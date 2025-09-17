# 🚀 Guia de Deploy - QualyCorpore

## 📋 **Deploy no Netlify (Recomendado)**

### **Passo a Passo Completo:**

#### **1. Preparação do Projeto**
```bash
# Instalar dependências
npm install

# Testar build local
npm run build

# Testar preview local
npm run preview
```

#### **2. Deploy via Git (Recomendado)**
1. **Conecte seu repositório Git ao Netlify**
2. **Configure as seguintes opções:**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18.x`

#### **3. Deploy via Drag & Drop**
1. Execute `npm run build`
2. Arraste a pasta `dist` para o Netlify
3. Configure domínio personalizado se necessário

### **⚙️ Configurações Importantes**

#### **Arquivo `netlify.toml` (Já Configurado)**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

# Redirecionamentos para SPA
[[redirects]]
  from = "/agendamento/*"
  to = "/index.html"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **Arquivo `vercel.json` (Alternativo)**
```json
{
  "rewrites": [
    { "source": "/agendamento/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 🔧 **Configurações de Produção**

### **1. Variáveis de Ambiente**
Se necessário, configure no painel do Netlify:
```bash
VITE_APP_NAME=QualyCorpore
VITE_APP_VERSION=1.0.0
```

### **2. Headers de Segurança**
Já configurados no `netlify.toml`:
```toml
[[headers]]
  for = "/agendamento/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### **3. Otimizações de Build**
O `vite.config.ts` já está otimizado:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
          utils: ['jspdf', 'xlsx']
        }
      }
    }
  }
});
```

## 🌐 **Domínio Personalizado**

### **1. No Netlify:**
1. Vá em **Domain settings**
2. Clique em **Add custom domain**
3. Digite seu domínio (ex: `agendamento.suaempresa.com`)
4. Configure DNS conforme instruções

### **2. Configuração DNS:**
```
Type: CNAME
Name: agendamento (ou @)
Value: seu-site.netlify.app
```

## 📱 **Teste de Funcionalidades**

### **Checklist Pré-Deploy:**
- ✅ Login funciona com todos os usuários
- ✅ Dashboard carrega corretamente
- ✅ Links públicos funcionam
- ✅ QR Codes são gerados
- ✅ Agendamento público funciona
- ✅ Responsividade em mobile
- ✅ Relatórios são exportados

### **Teste de Links Públicos:**
1. Faça login como empresa
2. Vá em "Link Público"
3. Copie o link gerado
4. Teste em nova aba/dispositivo
5. Complete um agendamento

## 🔍 **Monitoramento**

### **1. Analytics (Opcional)**
Adicione Google Analytics no `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### **2. Logs de Erro**
O sistema já possui logs de debug no console:
```javascript
console.log('🔍 Debug info:', data);
console.error('❌ Erro:', error);
```

## 🚨 **Troubleshooting**

### **Problema: Links públicos não funcionam**
**Solução:**
1. Verifique se `netlify.toml` está na raiz
2. Confirme redirecionamentos no painel Netlify
3. Teste com URL completa

### **Problema: Build falha**
**Solução:**
1. Verifique Node.js version (18+)
2. Limpe cache: `npm ci`
3. Teste build local: `npm run build`

### **Problema: QR Codes não funcionam**
**Solução:**
1. Verifique se domínio está correto
2. Teste URL manualmente
3. Confirme HTTPS está ativo

## 📊 **Performance**

### **Métricas Esperadas:**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### **Otimizações Implementadas:**
- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ Minificação de assets
- ✅ Compressão gzip/brotli
- ✅ Cache de recursos estáticos

## 🔒 **Segurança**

### **Headers Configurados:**
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### **HTTPS:**
- Certificado SSL automático no Netlify
- Redirecionamento HTTP → HTTPS
- HSTS habilitado

## 📞 **Suporte Pós-Deploy**

### **Contato:**
- **Email**: suporte@chztech.com.br
- **Telefone**: (41) 98844-9685
- **Website**: https://chztech.com.br

### **Documentação:**
- README.md - Visão geral
- CHANGELOG.md - Histórico de mudanças
- Este arquivo - Guia de deploy

---

**🎉 Sistema pronto para produção!**

Desenvolvido por **CHZTECH ASSESSORIA DIGITAL** 🚀