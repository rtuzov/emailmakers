import React from 'react';

export type RabbitEmotion = 'happy' | 'angry' | 'neutral' | 'general';
export type RabbitVariant = '01' | '02' | '03' | '04' | '05';
export type RabbitSize = 'small' | 'medium' | 'large';

export interface RabbitCharacterProps {
  emotion: RabbitEmotion;
  variant?: RabbitVariant;
  size?: RabbitSize;
  alt?: string;
  className?: string;
  emailCompatible?: boolean;
}

const RabbitCharacter: React.FC<RabbitCharacterProps> = ({
  emotion,
  variant = '01',
  size = 'medium',
  alt,
  className = '',
  emailCompatible = false
}) => {
  // Asset mapping for Figma components
  const getAssetPath = (emotion: RabbitEmotion, variant?: RabbitVariant): string => {
    switch (emotion) {
      case 'happy':
        return '/src/ui/components/email/assets/rabbit-happy.png';
      case 'angry':
        return '/src/ui/components/email/assets/rabbit-angry.png';
      case 'general':
        return `/src/ui/components/email/assets/rabbit-general-${variant}.png`;
      default:
        return '/src/ui/components/email/assets/rabbit-happy.png';
    }
  };

  // Size mappings for email compatibility
  const getSizeStyles = (size: RabbitSize): React.CSSProperties => {
    const sizeMap = {
      small: { width: '100px', height: 'auto' },
      medium: { width: '150px', height: 'auto' },
      large: { width: '200px', height: 'auto' }
    };
    return sizeMap[size];
  };

  // Generate email-compatible styles
  const getEmailStyles = (): React.CSSProperties => {
    if (!emailCompatible) return {};
    
    return {
      display: 'block',
      margin: '0 auto',
      maxWidth: '100%',
      height: 'auto',
      border: 'none',
      outline: 'none'
    };
  };

  // Generate alt text for accessibility
  const getAltText = (): string => {
    if (alt) return alt;
    
    const emotionText = {
      happy: 'счастливый заяц',
      angry: 'разозленный заяц', 
      neutral: 'нейтральный заяц',
      general: 'заяц-персонаж'
    };

    return `${emotionText[emotion]} для email-рассылки`;
  };

  const assetPath = getAssetPath(emotion, variant);
  const sizeStyles = getSizeStyles(size);
  const emailStyles = getEmailStyles();
  const altText = getAltText();

  // Email-compatible component structure
  if (emailCompatible) {
    return (
      <table
        style={{
          borderCollapse: 'collapse',
          margin: '0 auto',
          padding: 0
        }}
        cellPadding="0"
        cellSpacing="0"
        border={0}
      >
        <tbody>
          <tr>
            <td style={{ padding: 0 }}>
              <img
                src={assetPath}
                alt={altText}
                style={{
                  ...sizeStyles,
                  ...emailStyles
                }}
                className={className}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // Standard React component for web usage
  return (
    <img
      src={assetPath}
      alt={altText}
      style={{
        ...sizeStyles,
        ...emailStyles
      }}
      className={className}
    />
  );
};

export default RabbitCharacter; 