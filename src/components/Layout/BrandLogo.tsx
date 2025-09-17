import React from 'react';
import * as LucideIcons from 'lucide-react';
import { brandingConfig } from '../../config/branding';

interface BrandLogoProps {
  size?: 'header' | 'login' | 'sidebar' | 'custom';
  customSize?: string;
  showText?: boolean;
  className?: string;
  useCustomization?: boolean;
  context?: 'login' | 'public';
}

export default function BrandLogo({ 
  size = 'header', 
  customSize, 
  showText = true, 
  className = '',
  useCustomization = false,
  context = 'login'
}: BrandLogoProps) {
  // Carregar configurações salvas do localStorage
  const [savedConfigs, setSavedConfigs] = React.useState<any>(null);
  
  React.useEffect(() => {
    const saved = localStorage.getItem('logoCustomization');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações de logo:', error);
      }
    }
  }, []);
  
  // Usar configuração personalizada se solicitado
  const logoConfig = useCustomization && context 
    ? (savedConfigs?.[context] || brandingConfig.logoCustomization[context])
    : null;

  // Tamanhos responsivos baseados no contexto
  const getResponsiveSize = () => {
    if (customSize) return customSize;
    
    switch (size) {
      case 'header':
        return 'w-8 h-8 sm:w-10 sm:h-10'; // Responsivo no header
      case 'login':
        return 'w-12 h-12 sm:w-16 sm:h-16'; // Maior no login
      case 'sidebar':
        return 'w-6 h-6 sm:w-8 sm:h-8'; // Menor na sidebar
      default:
        return 'w-10 h-10';
    }
  };
  
  const logoSize = getResponsiveSize();
  const imageUrl = logoConfig?.imageUrl || brandingConfig.logo.imageUrl;
  const IconComponent = imageUrl 
    ? null 
    : (LucideIcons as any)[brandingConfig.logo.icon] || LucideIcons.Calendar;

  // Configurações personalizadas com responsividade
  const getCustomSize = () => {
    if (!logoConfig) return { width: 64, height: 64 };
    
    // Ajustar tamanho baseado no contexto e tela
    const baseWidth = logoConfig.width || 64;
    const baseHeight = logoConfig.height || 64;
    
    // Para header, usar tamanho menor em mobile
    if (size === 'header') {
      return {
        width: Math.min(baseWidth * 0.7, 40), // Menor no mobile
        height: Math.min(baseHeight * 0.7, 40),
        smWidth: Math.min(baseWidth, 48), // Tamanho normal no desktop
        smHeight: Math.min(baseHeight, 48)
      };
    }
    
    return { width: baseWidth, height: baseHeight };
  };
  
  const customSizes = getCustomSize();
  const backgroundColor = logoConfig?.backgroundColor || brandingConfig.colors.primary;
  const borderRadius = logoConfig?.borderRadius || 'rounded-lg';
  const padding = logoConfig?.padding || 'p-4';
  const showBackground = logoConfig?.showBackground ?? true;

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 ${className}`}>
      {/* Logo ou Ícone */}
      <div className={`flex items-center justify-center flex-shrink-0 ${
        useCustomization && logoConfig 
          ? `${showBackground ? `bg-${backgroundColor}` : ''} ${borderRadius} ${size === 'header' ? 'p-1 sm:p-2' : padding}`
          : `bg-${backgroundColor} rounded-lg ${logoSize}`
      }`}
      style={useCustomization && logoConfig ? {
        width: `${customSizes.width}px`,
        height: `${customSizes.height}px`,
        ...(customSizes.smWidth && {
          '@media (min-width: 640px)': {
            width: `${customSizes.smWidth}px`,
            height: `${customSizes.smHeight}px`
          }
        })
      } : undefined}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${brandingConfig.appName} Logo`}
            className={`object-contain ${
              useCustomization && logoConfig 
                ? "max-w-full max-h-full"
                : "w-full h-full rounded-lg"
            }`}
            style={useCustomization && logoConfig ? {
              maxWidth: `${customSizes.width - (size === 'header' ? 8 : 16)}px`,
              maxHeight: `${customSizes.height - (size === 'header' ? 8 : 16)}px`
            } : undefined}
          />
        ) : (
          IconComponent && <IconComponent className={`text-white ${
            size === 'header' ? 'w-4 h-4 sm:w-5 sm:h-5' : 
            size === 'login' ? 'w-6 h-6 sm:w-8 sm:h-8' :
            'w-4 h-4 sm:w-6 sm:h-6'
          }`} />
        )}
      </div>
      
      {/* Texto da Marca - Responsivo */}
      {showText && (
        <div className="min-w-0 flex-1">
          <h1 className={`font-bold text-gray-900 truncate ${
            size === 'login' ? 'text-lg sm:text-xl md:text-2xl' : 
            size === 'header' ? 'text-sm sm:text-base md:text-lg' : 
            'text-xs sm:text-sm md:text-base'
          }`}>
            {brandingConfig.appName}
          </h1>
          {size !== 'sidebar' && (
            <p className={`text-gray-500 truncate ${
              size === 'login' ? 'text-xs sm:text-sm md:text-base' : 
              size === 'header' ? 'text-xs sm:text-sm hidden md:block' :
              'text-xs hidden sm:block'
            }`}>
              {brandingConfig.appDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}