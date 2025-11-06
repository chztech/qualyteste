// 🎨 CONFIGURAÇÃO DE MARCA E LOGO
// Edite este arquivo para personalizar o nome e logo do seu sistema

export const brandingConfig = {
  // 📝 INFORMAÇÕES DA EMPRESA
  appName: '',
  appDescription: 'Sistema de Agendamento',
  companyName: 'QualyCorpore',
  
  // 🎨 CORES DA MARCA (Tailwind CSS classes)
  colors: {
    primary: 'blue-600',      // Cor principal
    primaryHover: 'blue-700', // Cor principal hover
    primaryLight: 'blue-100', // Cor principal clara
    primaryDark: 'blue-900',  // Cor principal escura
    accent: 'green-600',      // Cor de destaque
    warning: 'yellow-600',    // Cor de aviso
    danger: 'red-600',        // Cor de perigo
  },
  
  // 🖼️ LOGO E ÍCONES
  logo: {
    // Ícone do Lucide React (usado quando não há logo personalizada)
    icon: 'Calendar',
    
    // URL da logo personalizada (deixe vazio para usar ícone)
    // Exemplo: '/logo.png' ou 'https://exemplo.com/logo.png'
    imageUrl: '/logo_qualy.png',
    
    // Tamanhos da logo em diferentes contextos
    sizes: {
      header: 'w-10 h-10',     // Tamanho no cabeçalho
      login: 'w-16 h-16',      // Tamanho na tela de login
      sidebar: 'w-8 h-8',      // Tamanho na sidebar
      public: 'w-20 h-20',     // Tamanho no link público
    }
  },
  
  // 🎨 PERSONALIZAÇÃO DE LOGO
  logoCustomization: {
    // Configurações da logo na tela de login
    login: {
      imageUrl: '/logo_qualy.png',
      width: 160,              // Largura em pixels
      height: 80,             // Altura em pixels
      backgroundColor: 'transparent', // Cor de fundo
      borderRadius: 'rounded-lg',   // Bordas arredondadas
      padding: 'p-0',         // Espaçamento interno
      showBackground: false,    // Mostrar fundo colorido
    },
    // Configurações da logo no link público
    public: {
      imageUrl: '/logo_qualy.png',
      width: 160,
      height: 90,
      backgroundColor: 'transparent',
      borderRadius: 'rounded-xl',
      padding: 'p-0',
      showBackground: false,
    }
  },
  
  // 📱 FAVICON
  favicon: {
    // URL do favicon (deixe vazio para usar padrão)
    url: '/favicon.ico',
    
    // Ícone alternativo se não houver favicon
    fallbackIcon: 'Calendar'
  },
  
  // 🌐 INFORMAÇÕES DE CONTATO
  contact: {
    email: 'suporte@chztech.com.br',
    phone: '(41) 98844-9685',
    website: 'https://chztech.com.br',
    address: 'Pinhais, PR - Brasil'
  },
  
  // 📄 INFORMAÇÕES LEGAIS
  legal: {
    copyright: '© 2025 QualyCorpore. Todos os direitos reservados. by CHZTECH ASSESSORIA DIGITAL',
    version: '1.0.0',
    privacyPolicy: '/politica-privacidade',
    termsOfService: '/termos-uso'
  },
  
  // 🎯 SEO E META TAGS
  seo: {
    title: 'QualyCorpore - Sistema de Agendamento de Massagem',
    description: 'Sistema completo para agendamento de massagens corporativas e individuais',
    keywords: 'agendamento, massagem em curitiba, corporativo',
    author: 'CHZTECH ASSESSORIA DIGITAL'
  }
};

// 🎨 TEMAS PREDEFINIDOS
export const themes = {
  // Tema Azul (Padrão)
  blue: {
    primary: 'blue-600',
    primaryHover: 'blue-700',
    primaryLight: 'blue-100',
    primaryDark: 'blue-900',
    accent: 'green-600'
  },
  
  // Tema Verde
  green: {
    primary: 'green-600',
    primaryHover: 'green-700',
    primaryLight: 'green-100',
    primaryDark: 'green-900',
    accent: 'blue-600'
  },
  
  // Tema Roxo
  purple: {
    primary: 'purple-600',
    primaryHover: 'purple-700',
    primaryLight: 'purple-100',
    primaryDark: 'purple-900',
    accent: 'pink-600'
  },
  
  // Tema Laranja
  orange: {
    primary: 'orange-600',
    primaryHover: 'orange-700',
    primaryLight: 'orange-100',
    primaryDark: 'orange-900',
    accent: 'blue-600'
  }
};

// 🔧 FUNÇÃO PARA APLICAR TEMA
export const applyTheme = (themeName: keyof typeof themes) => {
  const theme = themes[themeName];
  if (theme) {
    Object.assign(brandingConfig.colors, theme);
  }
};

// 📝 INSTRUÇÕES DE USO:
/*
  1. ALTERAR NOME:
     - Edite 'appName' para o nome do seu sistema
     - Edite 'appDescription' para a descrição
     - Edite 'companyName' para o nome da sua empresa

  2. ALTERAR LOGO:
     - Para usar uma imagem: coloque a URL em 'logo.imageUrl'
     - Para usar ícone: deixe 'imageUrl' vazio e escolha um ícone em 'logo.icon'
     - Ícones disponíveis: Calendar, Heart, Zap, Star, Shield, etc.

  3. ALTERAR CORES:
     - Use um tema predefinido: applyTheme('green')
     - Ou edite as cores manualmente em 'colors'

  4. PERSONALIZAR CONTATO:
     - Edite as informações em 'contact'

  EXEMPLOS DE ÍCONES LUCIDE:
  - Calendar, Clock, Heart, Zap, Star, Shield, Users, Building2
  - Smile, Sun, Moon, Leaf, Flower, Sparkles, Award, Crown
*/
