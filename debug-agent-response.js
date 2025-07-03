const { DesignSpecialistAgentV2 } = require('./src/agent/specialists/design-specialist-agent-v2.ts');

async function debugAgentResponse() {
  const agent = new DesignSpecialistAgentV2();
  
  // Simulated input based on our test
  const input = {
    task_type: 'render_email',
    content_package: {
      complete_content: {
        subject: 'Специальные предложения на авиабилеты от 5279 RUB — не упустите шанс!',
        preheader: 'Летите по выгодным ценам этим летом и открывайте новые горизонты',
        body: 'Лето в разгаре, и это идеальное время для путешествий! Мы рады предложить вам уникальную возможность сэкономить на авиабилетах.',
        cta: 'Забронировать сейчас'
      },
      content_metadata: {
        language: 'ru',
        tone: 'friendly'
      }
    },
    rendering_requirements: {
      output_format: 'html',
      template_type: 'promotional',
      email_client_optimization: 'universal',
      responsive_design: true
    }
  };

  try {
    // Mock the agent run to capture the exact response structure
    const { run } = await import('openai/agents');
    
    const agentResponse = await run(agent.agent, `Find appropriate images for email campaign based on AI-generated tags.
                     Tags: авиабилет, путешествия, лето, отдых, счастье
                     Subject: ${input.content_package.complete_content.subject}
                     Find 2-3 relevant images that match the content tone and message.`);
    
    console.log('🔍 Full Agent Response Structure:');
    console.log(JSON.stringify(agentResponse, null, 2));
    
    console.log('\n🔍 Response Keys:', Object.keys(agentResponse || {}));
    console.log('🔍 Response Type:', typeof agentResponse);
    
    if (agentResponse?.state) {
      console.log('\n🔍 State Structure:');
      console.log(JSON.stringify(agentResponse.state, null, 2));
    }
    
    if (agentResponse?.messages) {
      console.log('\n🔍 Messages Structure:');
      agentResponse.messages.forEach((msg, i) => {
        console.log(`Message ${i}:`, {
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : msg.content,
          tool_calls: msg.tool_calls,
          name: msg.name
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAgentResponse().catch(console.error); 