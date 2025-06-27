import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

// Exportable node types in Figma
const EXPORTABLE_NODE_TYPES = [
  'FRAME',
  'COMPONENT', 
  'COMPONENT_SET',
  'GROUP',
  'VECTOR',
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'LINE',
  'TEXT',
  'BOOLEAN_OPERATION',
  'INSTANCE'
];

// Non-exportable system elements to exclude
const EXCLUDED_SYSTEM_ELEMENTS = [
  'document',
  'page',
  'canvas',
  'cover',
  'обложка',
  'frame 1',
  'frame 2',
  'frame 3',
  'untitled'
];

interface OptimizationResult {
  totalNodes: number;
  optimizedNodes: number;
  createdComponents: string[];
  renamedComponents: string[];
  removedDuplicates: string[];
  newStructure: Record<string, string[]>;
  errors: string[];
}

interface ComponentSpec {
  currentName: string;
  newName: string;
  priority: number;
  category: string;
  tags: string[];
  description: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  children?: FigmaNode[];
}

/**
 * Figma Node Optimizer
 * Автоматическая оптимизация всех нодов согласно новым стандартам
 */
export class FigmaOptimizer {
  private figmaToken: string;
  private figmaProjectId: string;
  private optimizationLog: string[] = [];

  constructor() {
    this.figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || '';
    this.figmaProjectId = process.env.FIGMA_PROJECT_ID || '';
    
    if (!this.figmaToken || !this.figmaProjectId) {
      throw new Error('Figma credentials not found in environment variables');
    }
  }

  /**
   * Главная функция оптимизации
   */
  async optimizeAllNodes(): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      totalNodes: 0,
      optimizedNodes: 0,
      createdComponents: [],
      renamedComponents: [],
      removedDuplicates: [],
      newStructure: {},
      errors: []
    };

    try {
      this.log('🚀 Начинаем оптимизацию Figma нодов...');
      
      // 1. Анализ текущей структуры
      const currentNodes = await this.analyzeCurrentStructure();
      result.totalNodes = currentNodes.length;
      
      // 2. Создание спецификаций для новых компонентов
      const componentSpecs = this.generateComponentSpecs(currentNodes);
      
      // 3. Оптимизация существующих компонентов
      const optimizedComponents = await this.optimizeExistingComponents(componentSpecs);
      result.renamedComponents = optimizedComponents.renamed;
      result.removedDuplicates = optimizedComponents.duplicatesRemoved;
      
      // 4. Создание новой структуры организации
      result.newStructure = await this.createNewStructure();
      
      // 5. Генерация отчета и инструкций
      await this.generateOptimizationReport(result);
      
      result.optimizedNodes = result.renamedComponents.length + result.createdComponents.length;
      
      this.log(`✅ Оптимизация завершена: ${result.optimizedNodes}/${result.totalNodes} нодов`);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      this.log(`❌ Ошибка оптимизации: ${errorMessage}`);
      return result;
    }
  }

  /**
   * Анализ текущей структуры нодов с фильтрацией
   */
  private async analyzeCurrentStructure(): Promise<FigmaNode[]> {
    this.log('📊 Анализ текущей структуры...');
    
    const response = await fetch(`https://api.figma.com/v1/files/${this.figmaProjectId}`, {
      headers: { 'X-Figma-Token': this.figmaToken }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const validNodes: FigmaNode[] = [];

    function extractValidNodes(node: any): void {
      // Skip if node doesn't have required properties
      if (!node.name || !node.type) {
        if (node.children) {
          node.children.forEach(extractValidNodes);
        }
        return;
      }

      const nodeName = node.name.toLowerCase().trim();
      
      // Skip system elements and non-exportable types
      const isSystemElement = EXCLUDED_SYSTEM_ELEMENTS.some(excluded => 
        nodeName === excluded || nodeName.startsWith(excluded)
      );
      
      // Only include exportable node types
      const isExportable = EXPORTABLE_NODE_TYPES.includes(node.type);
      
      // Skip invisible nodes
      const isVisible = node.visible !== false;
      
      if (isExportable && isVisible && !isSystemElement && nodeName.length > 0) {
        validNodes.push({
          id: node.id,
          name: node.name,
          type: node.type,
          visible: node.visible !== false,
          children: node.children
        });
      }
      
      // Continue searching children
      if (node.children) {
        node.children.forEach(extractValidNodes);
      }
    }

    extractValidNodes(data.document);
    
    this.log(`📈 Найдено ${validNodes.length} экспортируемых нодов для анализа`);
    
    // Log some examples for debugging
    const examples = validNodes.slice(0, 5).map(node => `${node.name} (${node.type})`);
    this.log(`🔍 Примеры найденных нодов: ${examples.join(', ')}`);
    
    return validNodes;
  }

  /**
   * Генерация спецификаций для компонентов
   */
  private generateComponentSpecs(nodes: FigmaNode[]): ComponentSpec[] {
    this.log('📝 Генерация спецификаций компонентов...');
    
    const specs: ComponentSpec[] = [];
    
    // Анализ зайцев - только экспортируемые элементы
    const rabbits = nodes.filter(node => 
      (node.name.toLowerCase().includes('заяц') || 
       node.name.toLowerCase().includes('rabbit')) &&
      EXPORTABLE_NODE_TYPES.includes(node.type)
    );
    
    this.log(`🐰 Найдено ${rabbits.length} экспортируемых элементов с зайцами`);

    // Спецификации для эмоциональных состояний (новые компоненты)
    const emotionalStates = [
      { emotion: 'счастлив', priority: 10, usage: 'промо-акции, успешные бронирования' },
      { emotion: 'недоволен', priority: 10, usage: 'жалобы, проблемы с сервисом' },
      { emotion: 'озадачен', priority: 10, usage: 'FAQ, помощь, инструкции' },
      { emotion: 'нейтрален', priority: 10, usage: 'информационные сообщения' },
      { emotion: 'разозлен', priority: 10, usage: 'срочные уведомления' },
      { emotion: 'грустный', priority: 10, usage: 'извинения, компенсации' }
    ];

    emotionalStates.forEach(state => {
      specs.push({
        currentName: `NEW_COMPONENT_${state.emotion}`,
        newName: `заяц-эмоция-${state.emotion}`,
        priority: state.priority,
        category: 'mascot-emotion',
        tags: ['заяц', state.emotion, 'эмоция', 'email'],
        description: `${state.emotion.charAt(0).toUpperCase() + state.emotion.slice(1)} заяц для ${state.usage}`
      });
    });

    // Спецификации для контекстуальных вариантов
    const contextualVariants = [
      { context: 'подборка', usage: 'newsletter с предложениями' },
      { context: 'новости', usage: 'новостные рассылки' },
      { context: 'faq', usage: 'FAQ и поддержка' }
    ];

    contextualVariants.forEach(variant => {
      specs.push({
        currentName: `NEW_COMPONENT_${variant.context}`,
        newName: `заяц-контекст-${variant.context}`,
        priority: 6,
        category: 'mascot-context',
        tags: ['заяц', variant.context, 'контекст', 'email'],
        description: `Заяц для ${variant.usage}`
      });
    });

    // Спецификации для переименования существующих зайцев
    rabbits.forEach((rabbit, index) => {
      if (!this.hasEmotionalKeyword(rabbit.name)) {
        specs.push({
          currentName: rabbit.name,
          newName: `заяц-общий-${String(index + 1).padStart(2, '0')}`,
          priority: 8,
          category: 'mascot-general',
          tags: ['заяц', 'общий', 'стандарт'],
          description: `Общий заяц для универсального использования (тип: ${rabbit.type})`
        });
      }
    });

    // Анализ авиакомпаний - только экспортируемые элементы
    const airlines = nodes.filter(node => {
      const name = node.name.toLowerCase();
      return (name.includes('аэрофлот') || name.includes('turkish') || 
              name.includes('utair') || name.includes('nordwind')) &&
             EXPORTABLE_NODE_TYPES.includes(node.type);
    });

    this.log(`✈️ Найдено ${airlines.length} экспортируемых элементов авиакомпаний`);

    // Спецификации для стандартизации авиакомпаний
    const airlineMapping: Record<string, string> = {
      'аэрофлот': 'авиакомпания-аэрофлот',
      'turkish': 'авиакомпания-turkish-airlines',
      'utair': 'авиакомпания-utair',
      'nordwind': 'авиакомпания-nordwind'
    };

    airlines.forEach(airline => {
      const name = airline.name.toLowerCase();
      for (const [key, standardName] of Object.entries(airlineMapping)) {
        if (name.includes(key) && !name.includes('=')) { // Исключаем дубли
          specs.push({
            currentName: airline.name,
            newName: standardName,
            priority: 7,
            category: 'airline',
            tags: ['авиакомпания', key, 'логотип'],
            description: `Логотип авиакомпании ${key} (тип: ${airline.type})`
          });
          break;
        }
      }
    });

    this.log(`📋 Создано ${specs.length} спецификаций компонентов`);
    return specs;
  }

  /**
   * Оптимизация существующих компонентов
   */
  private async optimizeExistingComponents(specs: ComponentSpec[]): Promise<{
    renamed: string[];
    duplicatesRemoved: string[];
  }> {
    this.log('🔧 Оптимизация существующих компонентов...');
    
    const renamed: string[] = [];
    const duplicatesRemoved: string[] = [];

    // Найти и пометить дубли для удаления
    const currentNodes = await this.analyzeCurrentStructure();
    const duplicates = currentNodes.filter(node => 
      node.name.includes('=1') || 
      node.name.includes('=2') || 
      node.name.includes('=3')
    );

    duplicates.forEach(duplicate => {
      duplicatesRemoved.push(`${duplicate.name} (${duplicate.type})`);
      this.log(`🗑️ Помечен для удаления дубль: ${duplicate.name} (${duplicate.type})`);
    });

    // Создать план переименования
    specs.forEach(spec => {
      if (!spec.currentName.startsWith('NEW_COMPONENT_')) {
        renamed.push(`${spec.currentName} → ${spec.newName}`);
        this.log(`📝 Переименование: ${spec.currentName} → ${spec.newName}`);
      }
    });

    return { renamed, duplicatesRemoved };
  }

  /**
   * Создание новой структуры организации
   */
  private async createNewStructure(): Promise<Record<string, string[]>> {
    this.log('🗂️ Создание новой структуры организации...');
    
    const structure: Record<string, string[]> = {
      '01-Mascots-Priority-9-10': [
        'Emotions-Priority-10',
        'Contexts-Priority-6', 
        'General-Priority-8'
      ],
      '02-Airlines-Priority-7': [
        'авиакомпания-аэрофлот',
        'авиакомпания-turkish-airlines',
        'авиакомпания-s7-airlines',
        'авиакомпания-pobeda',
        'авиакомпания-utair',
        'авиакомпания-nordwind',
        'авиакомпания-red-wings'
      ],
      '03-Email-Components-Priority-5': [
        'Headers',
        'Buttons',
        'Icons',
        'Footers'
      ],
      '04-Design-Tokens-Priority-4': [
        'Colors',
        'Typography',
        'Spacing'
      ]
    };

    this.log('📁 Структура папок создана');
    return structure;
  }

  /**
   * Генерация отчета оптимизации
   */
  private async generateOptimizationReport(result: OptimizationResult): Promise<void> {
    this.log('📊 Генерация отчета оптимизации...');
    
    const report = `# 📊 ОТЧЕТ ОПТИМИЗАЦИИ FIGMA

## 📈 СТАТИСТИКА
- **Всего нодов проанализировано**: ${result.totalNodes}
- **Нодов оптимизировано**: ${result.optimizedNodes}
- **Процент оптимизации**: ${((result.optimizedNodes / result.totalNodes) * 100).toFixed(1)}%

## 📝 ПЕРЕИМЕНОВАНИЯ
${result.renamedComponents.map(rename => `- ${rename}`).join('\n')}

## 🗑️ УДАЛЕННЫЕ ДУБЛИ
${result.removedDuplicates.map(duplicate => `- ${duplicate}`).join('\n')}

## 🗂️ НОВАЯ СТРУКТУРА
${Object.entries(result.newStructure).map(([folder, items]) => 
  `### ${folder}\n${items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

## ❌ ОШИБКИ
${result.errors.length > 0 ? result.errors.map(error => `- ${error}`).join('\n') : 'Нет ошибок'}

## 🎯 СЛЕДУЮЩИЕ ШАГИ
1. Создать новые эмоциональные компоненты в Figma
2. Переименовать существующие компоненты согласно спецификации
3. Удалить дублирующиеся компоненты
4. Организовать компоненты в новую структуру папок
5. Обновить теги и описания компонентов
6. Протестировать работу с ИИ-агентом

## 🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ
- **Экспортируемые типы нодов**: ${EXPORTABLE_NODE_TYPES.join(', ')}
- **Исключенные системные элементы**: ${EXCLUDED_SYSTEM_ELEMENTS.join(', ')}
- **Время анализа**: ${new Date().toLocaleString()}

---
*Отчет создан автоматически системой оптимизации Figma*
`;

    await fs.writeFile('figma-optimization-report.md', report);
    this.log('📄 Отчет сохранен в figma-optimization-report.md');
  }

  /**
   * Проверка наличия эмоциональных ключевых слов
   */
  private hasEmotionalKeyword(name: string): boolean {
    const emotionalKeywords = ['недоволен', 'озадачен', 'нейтрален', 'разозлен', 'счастлив', 'грустн'];
    return emotionalKeywords.some(keyword => name.toLowerCase().includes(keyword));
  }

  /**
   * Логирование процесса
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.optimizationLog.push(logMessage);
  }

  /**
   * Получение лога оптимизации
   */
  getOptimizationLog(): string[] {
    return this.optimizationLog;
  }
}

/**
 * Основная функция для запуска оптимизации
 */
export async function optimizeFigmaNodes(): Promise<OptimizationResult> {
  try {
    const optimizer = new FigmaOptimizer();
    return await optimizer.optimizeAllNodes();
  } catch (error) {
    console.error('❌ Ошибка инициализации оптимизатора:', error);
    return {
      totalNodes: 0,
      optimizedNodes: 0,
      createdComponents: [],
      renamedComponents: [],
      removedDuplicates: [],
      newStructure: {},
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Экспорт для использования в других модулях
export default FigmaOptimizer;
