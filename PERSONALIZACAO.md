# 🎨 GUIA DE PERSONALIZAÇÃO - NOME E LOGO

## 📝 **Como Personalizar Seu Sistema**

### **1. 🏷️ ALTERAR NOME DO SISTEMA**

Edite o arquivo `src/config/branding.ts`:

```typescript
export const brandingConfig = {
  appName: 'SEU_NOME_AQUI',           // Ex: 'RelaxFlow', 'WellnessPro'
  appDescription: 'SUA_DESCRIÇÃO',    // Ex: 'Sistema de Bem-Estar'
  companyName: 'SUA_EMPRESA',         // Ex: 'Wellness Solutions'
}
```

### **2. 🖼️ ALTERAR LOGO**

#### **Opção A: Usar Imagem Personalizada**
```typescript
logo: {
  imageUrl: '/sua-logo.png',  // Coloque sua logo na pasta public/
  icon: 'Calendar',           // Ícone de fallback
}
```

#### **Opção B: Usar Ícone do Lucide**
```typescript
logo: {
  imageUrl: '',               // Deixe vazio
  icon: 'Heart',              // Escolha um ícone
}
```

**Ícones Disponíveis:**
- `Calendar`, `Heart`, `Zap`, `Star`, `Shield`, `Users`
- `Building2`, `Smile`, `Sun`, `Moon`, `Leaf`, `Flower`
- `Sparkles`, `Award`, `Crown`, `Clock`, `Activity`

### **3. 🎨 ALTERAR CORES**

#### **Usar Tema Predefinido:**
```typescript
import { applyTheme } from './config/branding';

// No seu componente principal
applyTheme('green');  // Opções: 'blue', 'green', 'purple', 'orange'
```

#### **Cores Personalizadas:**
```typescript
colors: {
  primary: 'emerald-600',      // Cor principal
  primaryHover: 'emerald-700', // Hover
  primaryLight: 'emerald-100', // Clara
  primaryDark: 'emerald-900',  // Escura
}
```

### **4. 📞 INFORMAÇÕES DE CONTATO**

```typescript
contact: {
  email: 'contato@seusite.com',
  phone: '(11) 99999-9999',
  website: 'https://seusite.com',
  address: 'Sua Cidade, Estado'
}
```

### **5. 🌐 SEO E META TAGS**

```typescript
seo: {
  title: 'Seu Sistema - Descrição',
  description: 'Descrição para Google',
  keywords: 'palavras, chave, relevantes',
  author: 'Sua Empresa'
}
```

## 🚀 **EXEMPLOS PRONTOS**

### **Exemplo 1: Clínica de Massagem**
```typescript
appName: 'RelaxFlow',
appDescription: 'Sistema de Agendamento',
logo: { icon: 'Heart', imageUrl: '' },
colors: { primary: 'green-600' }
```

### **Exemplo 2: Spa Corporativo**
```typescript
appName: 'WellnessPro',
appDescription: 'Bem-Estar Corporativo',
logo: { icon: 'Sparkles', imageUrl: '' },
colors: { primary: 'purple-600' }
```

### **Exemplo 3: Centro de Terapias**
```typescript
appName: 'TherapyFlow',
appDescription: 'Centro de Terapias',
logo: { icon: 'Activity', imageUrl: '' },
colors: { primary: 'blue-600' }
```

## 📁 **ESTRUTURA DE ARQUIVOS**

```
src/
├── config/
│   └── branding.ts          ← ARQUIVO PRINCIPAL
├── components/
│   ├── Layout/
│   │   ├── BrandLogo.tsx    ← Componente da logo
│   │   └── Header.tsx       ← Cabeçalho atualizado
│   └── Auth/
│       ├── LoginForm.tsx    ← Login atualizado
│       └── RegisterForm.tsx ← Registro atualizado
public/
└── sua-logo.png            ← Sua logo aqui (opcional)
```

## ⚡ **APLICAR MUDANÇAS**

1. **Edite** `src/config/branding.ts`
2. **Salve** o arquivo
3. **Recarregue** a página
4. **Pronto!** Mudanças aplicadas automaticamente

## 🎯 **DICAS IMPORTANTES**

- ✅ **Logo:** Use PNG/SVG com fundo transparente
- ✅ **Tamanho:** Máximo 200x200px para melhor performance
- ✅ **Cores:** Use classes do Tailwind CSS
- ✅ **Teste:** Verifique em diferentes telas
- ✅ **Backup:** Salve suas configurações

## 🔧 **SUPORTE TÉCNICO**

Se precisar de ajuda:
1. Verifique se editou o arquivo correto
2. Confirme se as cores existem no Tailwind
3. Teste com ícones diferentes
4. Recarregue a página completamente

**Seu sistema personalizado está pronto! 🎉**
```