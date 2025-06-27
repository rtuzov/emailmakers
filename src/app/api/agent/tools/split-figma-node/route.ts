import { NextRequest, NextResponse } from 'next/server';
import { splitFigmaSprite } from '../../../../../agent/tools/figma-sprite-splitter';
import path from 'path';
import { promises as fs } from 'fs';

// Figma API Configuration
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || 'YOUR_FIGMA_TOKEN_HERE';
const FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;

export async function GET(request: NextRequest) {
  try {
    if (!FIGMA_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Figma token not configured'
      }, { status: 500 });
    }

    // Поиск нодов с "заяц" и "общие" в Figma
    if (!FIGMA_PROJECT_ID) {
      return NextResponse.json({
        success: false,
        message: 'FIGMA_PROJECT_ID not configured',
        help: 'Add FIGMA_PROJECT_ID to your .env.local file',
        status: 'no_project_id'
      });
    }

    // Получаем структуру файла из Figma
    const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_PROJECT_ID}`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Figma API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const data = await response.json();
    const targetNodes: any[] = [];

    function findNodes(node: any, path = ''): void {
      if (node.name && node.type) {
        const nodeName = node.name.toLowerCase();
        if (nodeName.includes('заяц') && (nodeName.includes('общие') || nodeName.includes('09'))) {
          targetNodes.push({
            id: node.id,
            name: node.name,
            type: node.type,
            path: path,
            size: node.absoluteBoundingBox || null
          });
        }
      }
      
      if (node.children) {
        const nodePath = path ? `${path} > ${node.name || 'Unnamed'}` : (node.name || 'Root');
        node.children.forEach((child: any) => findNodes(child, nodePath));
      }
    }

    findNodes(data.document);

    return NextResponse.json({
      success: true,
      project_name: data.name,
      nodes_found: targetNodes.length,
      nodes: targetNodes,
      can_export: targetNodes.filter(node => 
        ['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP', 'RECTANGLE', 'ELLIPSE'].includes(node.type)
      ).length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.node_id && !body.node_name) {
      return NextResponse.json({
        success: false,
        error: 'node_id or node_name parameter is required'
      }, { status: 400 });
    }

    if (!FIGMA_TOKEN || !FIGMA_PROJECT_ID) {
      return NextResponse.json({
        success: false,
        error: 'Figma credentials not configured'
      }, { status: 500 });
    }

    let nodeId = body.node_id;

    // Если передано имя ноды, найдем её ID
    if (!nodeId && body.node_name) {
      const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_PROJECT_ID}`, {
        headers: { 'X-Figma-Token': FIGMA_TOKEN }
      });

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `Figma API error: ${response.status} ${response.statusText}`
        }, { status: response.status });
      }

      const data = await response.json();
      
      function findNodeByName(node: any, targetName: string): string | null {
        if (node.name && node.name.toLowerCase().includes(targetName.toLowerCase())) {
          return node.id;
        }
        
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeByName(child, targetName);
            if (found) return found;
          }
        }
        
        return null;
      }

      nodeId = findNodeByName(data.document, body.node_name);
      
      if (!nodeId) {
        return NextResponse.json({
          success: false,
          error: `Node with name "${body.node_name}" not found`
        }, { status: 404 });
      }
    }

    // Экспортируем нод как PNG
    const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(FIGMA_PROJECT_ID)}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`;
    
    const exportResponse = await fetch(exportUrl, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });
    
    if (!exportResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Export failed: ${exportResponse.status} ${exportResponse.statusText}`
      }, { status: exportResponse.status });
    }
    
    const exportData = await exportResponse.json();
    
    if (exportData.err) {
      return NextResponse.json({
        success: false,
        error: `Figma export error: ${exportData.err}`
      }, { status: 400 });
    }

    const imageUrl = exportData.images[nodeId];
    
    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image URL returned from Figma'
      }, { status: 400 });
    }

    // Скачиваем изображение с правильным обработчиком буфера
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to download image: ${imageResponse.status}`
      }, { status: 400 });
    }

    // Используем arrayBuffer вместо buffer() для совместимости
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Создаем временный файл
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFileName = `figma-node-${nodeId}-${Date.now()}.png`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, buffer);

    // Теперь разделяем спрайт используя существующий инструмент
    const splitResult = await splitFigmaSprite({
      path: tempFilePath,
      h_gap: body.h_gap || 10,
      v_gap: body.v_gap || 10,
      confidence_threshold: body.confidence_threshold || 0.6,
      min_component_size: body.min_component_size || 50,
      output_dir: body.output_dir || `figma-split-${Date.now()}`
    });

    // Удаляем временный файл
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.warn('Could not delete temp file:', tempFilePath);
    }

    return NextResponse.json({
      success: true,
      source: 'figma_node',
      node_id: nodeId,
      node_name: body.node_name || 'Unknown',
      original_image_url: imageUrl,
      image_size_bytes: buffer.length,
      split_result: splitResult
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 