/**
 * Generate Full Email - Manual Workflow
 * Runs Content → Design → Quality → Delivery specialists in sequence
 */

import { NextRequest, NextResponse } from 'next/server';
import { Agent, run } from '@openai/agents';
import { generateTraceId } from '../../../agent/utils/tracing-utils';
import { createSpecialistAgents } from '../../../agent/specialists/specialist-agents';

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    const body = await request.json();
    const { input, figmaUrl, includeAssets } = body;

    console.log('🚀 Starting Full Email Generation Workflow...');
    console.log('Input:', input);
    console.log('Figma URL:', figmaUrl);
    console.log('Include Assets:', includeAssets);

    // Create all specialists
    const specialists = await createSpecialistAgents();
    console.log('✅ All specialists created');

    const results = {
      content: null,
      design: null,
      quality: null,
      delivery: null,
      errors: []
    };

    // Step 1: Content Specialist
    try {
      console.log('📝 Running Content Specialist...');
      const contentResult = await Promise.race([
        run(specialists.contentSpecialist, input, { maxTurns: 10, context: { traceId } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Content timeout')), 60000))
      ]) as any;
      
      results.content = {
        success: true,
        finalOutput: contentResult.currentStep?.output || contentResult.lastModelResponse?.output?.[0]?.content?.[0]?.text || 'Content generated',
        state: contentResult.state,
        turns: contentResult.state?.currentTurn || 0
      };
      console.log('✅ Content Specialist completed in', results.content.turns, 'turns');
    } catch (error) {
      results.errors.push(`Content: ${error.message}`);
      console.error('❌ Content Specialist failed:', error.message);
      
      // Try to get partial result if available
      if (error.message.includes('Max turns')) {
        console.log('⚠️ Content Specialist hit max turns - trying to extract partial result');
      }
    }

    // Step 2: Design Specialist (if content succeeded)
    if (results.content?.success) {
      try {
        console.log('🎨 Running Design Specialist...');
        const designInput = `Create email design based on this content: ${results.content.finalOutput}`;
        
        const designResult = await Promise.race([
          run(specialists.designSpecialist, designInput, { maxTurns: 5, context: { traceId } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Design timeout')), 45000))
        ]) as any;
        
        results.design = {
          success: true,
          finalOutput: designResult.currentStep?.output || designResult.lastModelResponse?.output?.[0]?.content?.[0]?.text || 'Design generated',
          state: designResult.state
        };
        console.log('✅ Design Specialist completed');
      } catch (error) {
        results.errors.push(`Design: ${error.message}`);
        console.error('❌ Design Specialist failed:', error.message);
      }
    }

    // Step 3: Quality Specialist (if design succeeded)
    if (results.design?.success) {
      try {
        console.log('🔍 Running Quality Specialist...');
        const qualityInput = `Check quality of this email design: ${results.design.finalOutput}`;
        
        const qualityResult = await Promise.race([
          run(specialists.qualitySpecialist, qualityInput, { maxTurns: 3, context: { traceId } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Quality timeout')), 30000))
        ]) as any;
        
        results.quality = {
          success: true,
          finalOutput: qualityResult.currentStep?.output || qualityResult.lastModelResponse?.output?.[0]?.content?.[0]?.text || 'Quality checked',
          state: qualityResult.state
        };
        console.log('✅ Quality Specialist completed');
      } catch (error) {
        results.errors.push(`Quality: ${error.message}`);
        console.error('❌ Quality Specialist failed:', error.message);
      }
    }

    // Step 4: Delivery Specialist (if quality succeeded)
    if (results.quality?.success) {
      try {
        console.log('📦 Running Delivery Specialist...');
        const deliveryInput = `Finalize and deliver this email: ${results.quality.finalOutput}`;
        
        const deliveryResult = await Promise.race([
          run(specialists.deliverySpecialist, deliveryInput, { maxTurns: 3, context: { traceId } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Delivery timeout')), 30000))
        ]) as any;
        
        results.delivery = {
          success: true,
          finalOutput: deliveryResult.currentStep?.output || deliveryResult.lastModelResponse?.output?.[0]?.content?.[0]?.text || 'Email delivered',
          state: deliveryResult.state
        };
        console.log('✅ Delivery Specialist completed');
      } catch (error) {
        results.errors.push(`Delivery: ${error.message}`);
        console.error('❌ Delivery Specialist failed:', error.message);
      }
    }

    const overallSuccess = results.content?.success && results.design?.success && results.quality?.success && results.delivery?.success;

    return NextResponse.json({
      success: overallSuccess,
      workflow: 'manual_sequential',
      results,
      completedSteps: [
        results.content?.success ? 'content' : null,
        results.design?.success ? 'design' : null,
        results.quality?.success ? 'quality' : null,
        results.delivery?.success ? 'delivery' : null
      ].filter(Boolean),
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ Full Email Generation failed:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        traceId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 