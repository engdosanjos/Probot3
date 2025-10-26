# 🚀 Como Rodar no Windows - Guia Completo

## ✅ Correção Aplicada!

O problema foi corrigido! O Prisma Client foi regenerado para SQLite.

---

## 📋 Pré-requisitos

Certifique-se de ter instalado:
- ✅ Node.js 18+ (https://nodejs.org/)
- ✅ Yarn (https://yarnpkg.com/)
- ✅ Git (https://git-scm.com/)

---

## 🎯 Passos para Rodar

### **1. Instalar Dependências**

Abra o PowerShell ou CMD na pasta do projeto e execute:

```bash
yarn install
```

### **2. Corrigir Prisma (IMPORTANTE)**

Execute o script de correção:

**No PowerShell/CMD:**
```bash
.\fix-prisma.bat
```

**Ou manualmente:**
```bash
# Limpar cache
rmdir /s /q node_modules\.prisma
rmdir /s /q node_modules\@prisma\client

# Gerar Prisma Client
npx prisma generate

# Criar banco SQLite
npx prisma db push --accept-data-loss

# Popular com dados iniciais
npx tsx scripts/seed.ts
```

### **3. Instalar Playwright (para scraping)**

```bash
npx playwright install chromium
```

### **4. Iniciar o Servidor**

```bash
yarn dev
```

Ou:

```bash
npm run dev
```

### **5. Acessar o Sistema**

Abra o navegador em:
```
http://localhost:3000
```

**Credenciais de login:**
- Email: `john@doe.com`
- Senha: `johndoe123`

---

## 🎮 Como Usar

### **1. Faça Login**
- Acesse `http://localhost:3000`
- Use as credenciais acima

### **2. Inicie o Sistema**
- Clique no botão verde **"Iniciar"** no header
- O sistema começará a buscar partidas ao vivo

### **3. Aguarde Partidas**
- Espere 1-2 minutos
- Partidas ao vivo aparecerão automaticamente
- **Importante**: Pode não haver partidas dependendo do horário

### **4. Teste a Conexão**
- Clique no botão **"⚡ Testar"**
- Verifica se há partidas disponíveis para scraping

### **5. Configure Telegram (Opcional)**
- Clique no ícone **⚙️** (configurações)
- Adicione Bot Token e Chat ID
- Receberá notificações automáticas

---

## 🔧 Comandos Úteis

### **Ver Status do Banco de Dados**
```bash
node test_db.js
```

### **Visualizar Banco (Interface Gráfica)**
```bash
npx prisma studio
```
Abre em: `http://localhost:5555`

### **Recriar Banco do Zero**
```bash
del dev.db
npx prisma db push --accept-data-loss
npx tsx scripts/seed.ts
```

### **Parar o Servidor**
- Pressione `Ctrl + C` no terminal

---

## ❌ Problemas Comuns e Soluções

### **Erro: "Invalid prisma.prediction.findMany()"**

**Causa:** Prisma Client desatualizado

**Solução:**
```bash
.\fix-prisma.bat
```

Ou manualmente:
```bash
npx prisma generate
yarn dev
```

---

### **Erro: "Cannot find module '@prisma/client'"**

**Solução:**
```bash
yarn add @prisma/client
npx prisma generate
```

---

### **Erro: "Playwright not installed"**

**Solução:**
```bash
npx playwright install chromium
```

---

### **Erro: "Port 3000 already in use"**

**Solução:**
```bash
# Matar processo na porta 3000
npx kill-port 3000

# Ou usar outra porta
set PORT=3001
yarn dev
```

---

### **Nenhuma Partida Aparece**

**Possíveis causas:**
1. ✅ Pode não haver jogos ao vivo no momento
2. ✅ Melhores horários: 14h-23h (horário do Brasil)
3. ✅ Finais de semana têm mais partidas

**Solução:**
- Use o botão "Testar" para verificar
- Aguarde alguns minutos
- Tente em horários de jogos

---

## 📊 Estrutura do Projeto

```
/app
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Autenticação
│   └── dashboard/         # Dashboard principal
├── components/            # Componentes React
├── lib/                   # Bibliotecas core
│   ├── scraper.ts        # Scraper Playwright
│   ├── prediction-engine.ts  # Motor de previsões
│   ├── telegram.ts       # Notificações
│   └── db.ts             # Cliente Prisma
├── prisma/
│   └── schema.prisma     # Schema do banco
├── scripts/
│   └── seed.ts           # Seed inicial
├── dev.db                # Banco SQLite
├── .env                  # Variáveis de ambiente
└── fix-prisma.bat        # Script de correção
```

---

## 🎯 Próximos Passos

1. ✅ Execute `.\fix-prisma.bat` (se ainda não fez)
2. ✅ Execute `yarn dev`
3. ✅ Acesse `http://localhost:3000`
4. ✅ Faça login
5. ✅ Clique em "Iniciar"
6. ✅ Monitore partidas ao vivo!

---

## 💡 Dicas

### **Melhor Experiência:**
- Use Chrome ou Edge (melhor compatibilidade)
- Aguarde horários de jogos (tarde/noite)
- Configure o Telegram para receber alertas
- Mantenha o servidor rodando enquanto houver jogos

### **Performance:**
- O scraper usa recursos do navegador (Playwright)
- Cada partida ao vivo abre uma aba no navegador headless
- Consumo de memória aumenta com mais partidas simultâneas

### **Segurança:**
- Troque o `NEXTAUTH_SECRET` no arquivo `.env` em produção
- Não compartilhe seu Bot Token do Telegram
- Use senhas fortes na autenticação

---

## 📞 Suporte

Se algo não funcionar:

1. ✅ Verifique os logs no terminal
2. ✅ Execute `.\fix-prisma.bat`
3. ✅ Reinicie o servidor (`Ctrl+C` e depois `yarn dev`)
4. ✅ Verifique se a porta 3000 está livre
5. ✅ Teste com `node test_db.js`

---

## ✅ Verificação Final

Execute estes comandos para confirmar que está tudo OK:

```bash
# 1. Testar banco de dados
node test_db.js

# 2. Ver versão do Node
node --version

# 3. Ver versão do Yarn
yarn --version

# 4. Verificar Prisma
npx prisma --version
```

---

**🎯⚽💰 Sistema pronto para uso! Boa sorte com as previsões!**
