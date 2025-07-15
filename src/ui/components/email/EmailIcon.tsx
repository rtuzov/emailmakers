import React from 'react';

export type IconType = 'arrow' | 'heart' | 'vector';
export type IconVariant = '1' | '2' | 'base';
export type IconSize = 'small' | 'medium' | 'large';

export interface EmailIconProps {
  type: IconType;
  variant?: IconVariant;
  size?: IconSize;
  color?: string;
  alt?: string;
  className?: string;
  emailCompatible?: boolean;
}

const EmailIcon: React.FC<EmailIconProps> = ({
  type,
  variant = 'base',
  size = 'medium',
  color,
  alt,
  className = '',
  emailCompatible = false
}) => {
  // Asset mapping for Figma icons
  const getAssetPath = (type: IconType, _variant: IconVariant): string => {
    switch (type) {
      case 'arrow':
        return '/src/ui/components/email/assets/arrow-icon.png';
      case 'heart':
        return '/src/ui/components/email/assets/heart-icon.png';
      case 'vector':
        return '/src/ui/components/email/assets/vector-icon.png';
      default:
        return '/src/ui/components/email/assets/arrow-icon.png';
    }
  };

  // Size mappings optimized for email clients
  const getSizeStyles = (size: IconSize): React.CSSProperties => {
    const sizeMap = {
      small: { width: '24px', height: '24px' },
      medium: { width: '32px', height: '32px' },
      large: { width: '48px', height: '48px' }
    };
    return sizeMap[size];
  };

  // Generate email-compatible styles
  const getEmailStyles = (): React.CSSProperties => {
    if (!emailCompatible) return {};
    
    return {
      display: 'block',
      margin: '0',
      padding: '0',
      border: 'none',
      outline: 'none',
      verticalAlign: 'middle'
    };
  };

  // Color filter for email compatibility (limited support)
  const getColorStyles = (): React.CSSProperties => {
    if (!color || !emailCompatible) return {};
    
    // Note: CSS filters have limited email client support
    // For production, consider using colored asset variants instead
    return {
      filter: `brightness(0) saturate(100%) invert(1)`,
      // Fallback for clients that don't support filters
      backgroundColor: color
    };
  };

  // Generate alt text for accessibility
  const getAltText = (): string => {
    if (alt) return alt;
    
    const iconText = {
      arrow: 'стрелка',
      heart: 'сердце',
      vector: 'иконка'
    };

    return `${iconText[type]} для email-рассылки`;
  };

  const assetPath = getAssetPath(type, variant);
  const sizeStyles = getSizeStyles(size);
  const emailStyles = getEmailStyles();
  const colorStyles = getColorStyles();
  const altText = getAltText();

  // Email-compatible component structure
  if (emailCompatible) {
    return (
      <table
        style={{
          borderCollapse: 'collapse',
          margin: '0',
          padding: 0,
          display: 'inline-table'
        }}
        cellPadding="0"
        cellSpacing="0"
        border={0}
      >
        <tbody>
          <tr>
            <td style={{ padding: 0, verticalAlign: 'middle' }}>
              <img
                src={assetPath}
                alt={altText}
                style={{
                  ...sizeStyles,
                  ...emailStyles,
                  ...colorStyles
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
        ...emailStyles,
        ...colorStyles
      }}
      className={className}
    />
  );
};

export default EmailIcon; 