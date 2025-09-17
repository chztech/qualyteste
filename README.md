# 🎯 QualyCorpore - Sistema de Agendamento de Massagens

## 📋 **Sobre o Sistema**

O **QualyCorpore** é um sistema completo de agendamento de massagens corporativas e individuais, desenvolvido com tecnologias modernas e design responsivo.

### ✨ **Principais Funcionalidades:**

- 🏢 **Gestão de Empresas**: Cadastro e gerenciamento de empresas clientes
- 👥 **Gestão de Colaboradores**: Controle de funcionários por empresa
- 👨‍⚕️ **Gestão de Prestadores**: Cadastro de massagistas e terapeutas
- 📅 **Agendamento Inteligente**: Sistema de agendamento com múltiplas visualizações
- 📱 **Link Público**: Cada empresa possui link único para agendamentos
- 📊 **Dashboard Completo**: Relatórios e estatísticas em tempo real
- 🔐 **Controle de Acesso**: Diferentes níveis de usuário (Admin, Empresa, Prestador)
- 📱 **100% Responsivo**: Funciona perfeitamente em qualquer dispositivo

## 🚀 **Tecnologias Utilizadas**

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build**: Vite
- **Deploy**: Netlify
- **Storage**: LocalStorage (para demonstração)

## 📱 **Acesso ao Sistema**

### 🔑 **Usuários de Demonstração:**

#### **Administrador:**
- **Email**: `admin@admin.com`
- **Senha**: `qualquer`
- **Acesso**: Controle total do sistema

#### **Empresa 1:**
- **Email**: `empresa@techsolutions.com`
- **Senha**: `qualquer`
- **Acesso**: Dashboard da empresa

#### **Empresa 2:**
- **Email**: `contato@inovacaocorp.com`
- **Senha**: `qualquer`
- **Acesso**: Dashboard da empresa

#### **Prestador:**
- **Email**: `maria@massaflow.com`
- **Senha**: `qualquer`
- **Acesso**: Agenda do prestador

## 🎯 **Como Usar**

### **1. Para Administradores:**
1. Faça login com credenciais de admin
2. Gerencie empresas, prestadores e serviços
3. Visualize relatórios e estatísticas
4. Configure agendamentos administrativos

### **2. Para Empresas:**
1. Faça login com credenciais da empresa
2. Cadastre seus colaboradores
3. Visualize agendamentos da empresa
4. Compartilhe o link público com colaboradores

### **3. Para Prestadores:**
1. Faça login com credenciais do prestador
2. Visualize sua agenda pessoal
3. Confirme ou cancele agendamentos
4. Marque atendimentos como concluídos

### **4. Para Colaboradores (Link Público):**
1. Acesse o link fornecido pela empresa
2. Selecione data e horário disponível
3. Preencha seus dados pessoais
4. Confirme o agendamento

## 🔧 **Instalação Local**

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🌐 **Deploy**

O sistema está configurado para deploy automático no Netlify:

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Node Version**: 18+

### **Configurações Importantes:**
- Redirecionamentos configurados para SPAs
- Suporte a links públicos de agendamento
- Headers de segurança configurados

## 📊 **Funcionalidades Detalhadas**

### **Dashboard Administrativo:**
- Visão geral de todas as empresas
- Estatísticas em tempo real
- Gestão completa de usuários
- Relatórios em PDF e Excel
- Links públicos para todas as empresas

### **Dashboard da Empresa:**
- Gestão de colaboradores
- Visualização de agendamentos
- Link público personalizado
- QR Code para compartilhamento
- Estatísticas da empresa

### **Dashboard do Prestador:**
- Agenda pessoal
- Controle de status dos atendimentos
- Estatísticas de performance
- Filtros por período

### **Sistema de Agendamento Público:**
- Interface otimizada para mobile
- Processo guiado em etapas
- Validação de dados em tempo real
- Confirmação automática

## 🔒 **Segurança**

- Tokens únicos por empresa
- Validação de dados no frontend
- Controle de acesso por roles
- Links seguros para agendamento público

## 📱 **Responsividade**

O sistema foi desenvolvido com abordagem **Mobile-First**:
- ✅ Smartphones (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1024px+)
- ✅ Orientação portrait/landscape

## 🎨 **Personalização**

O sistema pode ser facilmente personalizado editando o arquivo `src/config/branding.ts`:

```typescript
export const brandingConfig = {
  appName: 'Seu Nome',
  appDescription: 'Sua Descrição',
  colors: {
    primary: 'blue-600', // Sua cor principal
  },
  logo: {
    icon: 'Calendar', // Seu ícone
    imageUrl: '', // Sua logo personalizada
  }
};
```

## 📞 **Suporte**

Para suporte técnico ou dúvidas:
- **Email**: suporte@chztech.com.br
- **Telefone**: (41) 98844-9685
- **Website**: https://chztech.com.br

## 📄 **Licença**

© 2025 CHZTECH ASSESSORIA DIGITAL. Todos os direitos reservados.

---

**Sistema desenvolvido com ❤️ pela CHZTECH ASSESSORIA DIGITAL**