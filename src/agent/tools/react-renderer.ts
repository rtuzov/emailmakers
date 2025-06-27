import { ToolResult, handleToolError } from './index';

interface ComponentParams {
  type: 'rabbit' | 'icon';
  props: RabbitComponentProps | IconComponentProps;
}

interface RabbitComponentProps {
  emotion: 'happy' | 'angry' | 'neutral' | 'general';
  variant?: '01' | '02' | '03' | '04' | '05' | null;
  size?: 'small' | 'medium' | 'large' | null;
  alt?: string | null;
}

interface IconComponentProps {
  iconType: 'arrow' | 'heart' | 'vector';
  variant?: '1' | '2' | 'base' | null;
  size?: 'small' | 'medium' | 'large' | null;
  color?: string | null;
  alt?: string | null;
}

interface ComponentResult {
  html: string;
  component_type: string;
  assets_used: string[];
  mjml_compatible: boolean;
}

/**
 * T11: React Component Renderer Tool
 * Generates email-compatible HTML from component specifications
 */
export async function renderComponent(params: ComponentParams): Promise<ToolResult> {
  try {
    console.log(`T11: Rendering ${params.type} component`);

    let componentHtml: string;
    let assetsUsed: string[] = [];
    let componentType: string;

    switch (params.type) {
      case 'rabbit':
        const rabbitProps = params.props as RabbitComponentProps;
        componentHtml = generateRabbitHTML(rabbitProps);
        assetsUsed = getRabbitAssets(rabbitProps);
        componentType = `rabbit-${rabbitProps.emotion}`;
        break;

      case 'icon':
        const iconProps = params.props as IconComponentProps;
        componentHtml = generateIconHTML(iconProps);
        assetsUsed = getIconAssets(iconProps);
        componentType = `icon-${iconProps.iconType}`;
        break;

      default:
        throw new Error(`Unsupported component type: ${params.type}`);
    }

    const result: ComponentResult = {
      html: componentHtml,
      component_type: componentType,
      assets_used: assetsUsed,
      mjml_compatible: true
    };

    return {
      success: true,
      data: result,
      metadata: {
        component_type: params.type,
        assets_count: assetsUsed.length,
        email_compatible: true,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return handleToolError('render_component', error);
  }
}

function generateRabbitHTML(props: RabbitComponentProps): string {
  const { emotion, variant = '01', size = 'medium', alt } = props;
  
  const assetPath = getRabbitAssetPath(emotion, variant || '01');
  const sizeStyles = getSizeStyles(size || 'medium');
  const altText = alt || `${getEmotionText(emotion)} заяц для email-рассылки`;

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto; padding: 0;">
      <tbody>
        <tr>
          <td style="padding: 0;">
            <img src="${assetPath}" alt="${altText}" style="display: block; margin: 0 auto; max-width: 100%; height: auto; border: none; outline: none; ${sizeStyles}" />
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
}

function generateIconHTML(props: IconComponentProps): string {
  const { iconType, variant = 'base', size = 'medium', color, alt } = props;
  
  const assetPath = getIconAssetPath(iconType);
  const sizeStyles = getIconSizeStyles(size || 'medium');
  const altText = alt || `${getIconText(iconType)} для email-рассылки`;
  const colorStyles = color ? `filter: brightness(0) saturate(100%) invert(1);` : '';

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0; padding: 0; display: inline-table;">
      <tbody>
        <tr>
          <td style="padding: 0; vertical-align: middle;">
            <img src="${assetPath}" alt="${altText}" style="display: block; margin: 0; padding: 0; border: none; outline: none; vertical-align: middle; ${sizeStyles} ${colorStyles}" />
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
}

function getRabbitAssetPath(emotion: string, variant: string): string {
  switch (emotion) {
    case 'happy':
      return 'assets/заяц -Общие- 01-x1.png';
    case 'angry':
      return 'assets/заяц -Общие- 03-x1.png';
    case 'excited':
      return 'assets/заяц «Подборка»01-x1.png';
    case 'confused':
      return 'assets/заяц «Вопрос-ответ» 01-x1.png';
    case 'news':
      return 'assets/заяц «Новости» 01-x1.png';
    case 'deal':
      return 'assets/заяц -Билет дня- 01-x1.png';
    case 'general':
      return `assets/заяц -Общие- ${variant.padStart(2, '0')}-x1.png`;
    case 'neutral':
    default:
      return 'assets/заяц -Общие- 01-x1.png';
  }
}

function getIconAssetPath(iconType: string): string {
  switch (iconType) {
    case 'arrow':
      return 'assets/стрелка 1_01-x4.png';
    case 'heart':
      return 'assets/сердце_01-x4.png';
    case 'vector':
      return 'assets/Vector-x4.png';
    default:
      return 'assets/стрелка 1_01-x4.png';
  }
}

function getSizeStyles(size: string): string {
  const sizeMap = {
    small: 'width: 100px;',
    medium: 'width: 150px;',
    large: 'width: 200px;'
  };
  return sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
}

function getIconSizeStyles(size: string): string {
  const sizeMap = {
    small: 'width: 24px; height: 24px;',
    medium: 'width: 32px; height: 32px;',
    large: 'width: 48px; height: 48px;'
  };
  return sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
}

function getRabbitAssets(props: RabbitComponentProps): string[] {
  const { emotion, variant = '01' } = props;
  
  switch (emotion) {
    case 'happy':
      return ['заяц -Общие- 01-x1.png'];
    case 'angry':
      return ['заяц -Общие- 03-x1.png'];
    case 'general':
      return [`заяц -Общие- ${(variant || '01').padStart(2, '0')}-x1.png`];
    case 'neutral':
    default:
      return ['заяц -Общие- 01-x1.png'];
  }
}

function getIconAssets(props: IconComponentProps): string[] {
  const { iconType } = props;
  
  switch (iconType) {
    case 'arrow':
      return ['стрелка 1_01-x4.png'];
    case 'heart':
      return ['сердце_01-x4.png'];
    case 'vector':
      return ['Vector-x4.png'];
    default:
      return ['стрелка 1_01-x4.png'];
  }
}

function getEmotionText(emotion: string): string {
  const emotionMap = {
    happy: 'счастливый',
    angry: 'разозленный',
    neutral: 'нейтральный',
    general: 'персонаж'
  };
  return emotionMap[emotion as keyof typeof emotionMap] || 'персонаж';
}

function getIconText(iconType: string): string {
  const iconMap = {
    arrow: 'стрелка',
    heart: 'сердце',
    vector: 'иконка'
  };
  return iconMap[iconType as keyof typeof iconMap] || 'иконка';
}

/**
 * Convert component HTML to MJML-compatible format
 */
export function convertToMjml(componentHtml: string): string {
  // Wrap component HTML in mj-text for MJML compatibility
  return `<mj-text align="center" padding="10px 0">${componentHtml}</mj-text>`;
} 