
# ⚽ Goal Prediction System - Sistema de Previsão de Gols em Tempo Real

Sistema inteligente de previsão de gols com scraper Playwright, machine learning adaptativo e notificações via Telegram.

## 🌐 URL de Deploy

**Produção:** https://probet.abacusai.app

## 🔐 Credenciais de Acesso

- **Email:** `john@doe.com`
- **Senha:** `johndoe123`

## ❓ Por que não vejo partidas?

O sistema precisa ser **INICIADO MANUALMENTE** através do dashboard. Siga estes passos:

### 1. Acesse o Dashboard
Faça login e você verá o painel de controle

### 2. Clique no botão "Iniciar"
O botão verde "Iniciar" ativa o scraper que busca partidas ao vivo

### 3. Use o botão "Testar"
- O botão "⚡ Testar" verifica se há partidas disponíveis no momento
- **IMPORTANTE**: Pode não haver partidas ao vivo dependendo do horário
- O scraper busca partidas de futebol em https://www.livescore.in/br/futebol/

### 4. Aguarde as Partidas Aparecerem
- Se houver jogos ao vivo, eles aparecerão em até 1-2 minutos
- O sistema atualiza automaticamente a cada 30 segundos
- Se não aparecer nada, pode ser que não haja partidas no momento

### 5. Horários com Mais Partidas
- **14h-17h** (horário brasileiro): Jogos europeus
- **18h-23h** (horário brasileiro): Jogos brasileiros e sul-americanos
- **Finais de semana**: Maior quantidade de partidas

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL (já configurado)
- Yarn (gerenciador de pacotes)
- Playwright (para scraping)

## 🚀 Como Iniciar o Sistema

### 1. Instalar Dependências

```bash
cd /home/ubuntu/goal_prediction_system/nextjs_space
yarn install
```

### 2. Instalar Playwright (IMPORTANTE)

O Playwright é necessário para o scraper funcionar:

```bash
# Instalar o Playwright
yarn add playwright

# Instalar o navegador Chromium
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright yarn playwright install chromium
```

### 3. Configurar Variável de Ambiente (Opcional)

Se você instalou os navegadores do Playwright em um caminho personalizado, adicione ao `.env`:

```env
PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright
```

### 4. Iniciar o Servidor

```bash
yarn dev
```

Acesse: `http://localhost:3000`

## 📊 Funcionalidades

### 1. **Dashboard Principal**
- Estatísticas em tempo real (Greens, Reds, Assertividade, Banca)
- Gráficos de performance
- Atualização automática a cada 30 segundos

### 2. **Sistema de Scraping**
O scraper coleta dados ao vivo de jogos de futebol incluindo:
- ✅ Finalizações (totais, no alvo, para fora, bloqueadas)
- ✅ Escanteios
- ✅ xG (Expected Goals)
- ✅ Chances claras
- ✅ Ataques perigosos
- ✅ Placar em tempo real
- ✅ Minuto do jogo

### 3. **Tipos de Previsões**
- **HT (Half Time)**: Previsão de gol no primeiro tempo → +0.3u se correto
- **FT (Full Time)**: Previsão de gol no jogo 
  - Antes dos 45min → +0.1u se correto
  - Após 45min → +0.3u se correto
- **BTTS (Both Teams to Score)**: Ambas marcam → +0.2u se correto
- **Penalidade**: -1u por previsão incorreta

### 4. **Gestão de Banca**
- Banca inicial: 100u
- Stake dinâmico: 5% da banca atual
- Sem stop loss/take profit
- Cálculo automático de lucro/prejuízo

### 5. **Machine Learning Adaptativo**
O sistema aprende com o tempo através de:
- Estatísticas históricas por time
- Estatísticas por liga
- Estatísticas por país
- Ajuste automático de pesos baseado em assertividade

### 6. **Notificações via Telegram**

#### Configurar Telegram:
1. Crie um bot no Telegram através do [@BotFather](https://t.me/botfather)
2. Use o comando `/newbot` e siga as instruções
3. Copie o **Bot Token** fornecido
4. Obtenha seu **Chat ID**:
   - Envie uma mensagem para seu bot
   - Acesse: `https://api.telegram.org/bot<SEU_BOT_TOKEN>/getUpdates`
   - Procure por `"chat":{"id":` para encontrar seu Chat ID
5. No painel, clique no botão de **Configurações** (⚙️)
6. Insira o Bot Token e Chat ID
7. Salve a configuração

O sistema enviará notificações automáticas:
- 📢 Quando uma entrada é realizada
- ✅ Resultado da entrada (Green/Red)

## 🎯 Como Usar

### Passo 1: Fazer Login
Acesse o sistema e faça login com as credenciais fornecidas.

### Passo 2: Configurar Telegram (Opcional)
Clique no botão de configurações no header e adicione suas credenciais do Telegram.

### Passo 3: Iniciar o Sistema
Clique no botão **"Iniciar"** no header do dashboard. O sistema irá:
1. ✅ Iniciar o scraper Playwright
2. ✅ Buscar jogos ao vivo
3. ✅ Coletar estatísticas em tempo real
4. ✅ Fazer previsões automáticas baseadas no modelo de ML
5. ✅ Enviar notificações (se Telegram configurado)

### Passo 4: Acompanhar Resultados
O dashboard mostra em tempo real:
- **Partidas Acompanhando**: Jogos sendo monitorados
- **Entradas Abertas**: Previsões ativas aguardando resultado
- **Últimas 10 Entradas**: Histórico recente
- **Estatísticas**: Greens, Reds, Assertividade, Evolução da banca

## 🔧 Arquitetura Técnica

### Backend
- **Next.js API Routes**: Endpoints REST
- **Playwright**: Web scraping
- **PostgreSQL + Prisma**: Banco de dados
- **Node.js**: Runtime

### Frontend  
- **Next.js 14**: Framework React
- **TailwindCSS**: Estilização
- **Framer Motion**: Animações
- **Recharts**: Gráficos
- **NextAuth.js**: Autenticação

### Machine Learning
- **Sistema de Pesos Adaptativos**: Aprende com resultados
- **Análise Multi-dimensional**: Times, Ligas, Países
- **Thresholds Dinâmicos**: Ajuste automático de critérios

## 📁 Estrutura do Projeto

```
/home/ubuntu/goal_prediction_system/nextjs_space/
├── app/
│   ├── api/               # API Routes
│   │   ├── auth/          # NextAuth
│   │   ├── config/        # Configurações
│   │   ├── matches/       # Jogos
│   │   ├── predictions/   # Previsões
│   │   ├── statistics/    # Estatísticas
│   │   └── system/        # Sistema (start/stop)
│   ├── auth/signin/       # Página de login
│   ├── dashboard/         # Dashboard principal
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── dashboard-client.tsx
│   ├── live-match-card.tsx
│   ├── prediction-card.tsx
│   ├── statistics-charts.tsx
│   └── ui/                # Componentes UI (shadcn)
├── lib/
│   ├── scraper.ts         # Scraper Playwright
│   ├── prediction-engine.ts  # Motor de previsões
│   ├── telegram.ts        # Notificações Telegram
│   ├── auth.ts            # Configuração NextAuth
│   └── db.ts              # Cliente Prisma
├── prisma/
│   └── schema.prisma      # Schema do banco
└── scripts/
    └── seed.ts            # Seed inicial
```

## 🐛 Troubleshooting

### O scraper não está funcionando

**Problema**: Sistema iniciado mas nenhuma partida sendo acompanhada.

**Solução**:
1. Verifique se o Playwright está instalado:
   ```bash
   yarn list playwright
   ```

2. Instale o navegador Chromium:
   ```bash
   PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright yarn playwright install chromium
   ```

3. Verifique os logs no terminal:
   ```bash
   yarn dev
   ```
   Procure por mensagens iniciadas com `[scraper]`

### Erro de permissão ao instalar navegadores

**Solução**: Use o caminho com permissões de usuário:
```bash
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright yarn playwright install chromium
```

### Telegram não está enviando notificações

**Verificações**:
1. ✅ Bot Token está correto?
2. ✅ Chat ID está correto?
3. ✅ Você enviou pelo menos uma mensagem para o bot?
4. ✅ O bot está ativo?

### Banco de dados com erro

**Solução**: Regenerar o Prisma Client:
```bash
yarn prisma generate
```

## 📈 Melhorias Futuras

- [ ] Backtesting com dados históricos
- [ ] API para integração externa
- [ ] App mobile (React Native)
- [ ] Suporte a mais tipos de apostas
- [ ] Dashboard de análise de ligas/times
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sistema de múltiplas bancas
- [ ] Integração com casas de apostas

## 🤝 Suporte

Para dúvidas ou problemas, verifique:
1. Os logs do servidor (`yarn dev`)
2. Os logs do navegador (F12 → Console)
3. A documentação do Playwright: https://playwright.dev
4. A documentação do Next.js: https://nextjs.org

## 📝 Notas Importantes

⚠️ **Avisos**:
- O sistema usa web scraping, que pode ser afetado por mudanças no site fonte
- As previsões são baseadas em estatísticas e não garantem lucro
- Use com responsabilidade e gestão de banca adequada
- Teste extensivamente antes de usar com valores reais

---

**Desenvolvido com** ❤️ **e** ⚽ **por DeepAgent (Abacus.AI)**
