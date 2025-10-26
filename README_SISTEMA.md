# ⚽ Sistema de Previsão de Gols em Tempo Real

Sistema inteligente de previsão de gols com scraper Playwright, machine learning adaptativo e notificações via Telegram.

## 🎯 Objetivo do Sistema

Assistir todos os jogos ao vivo, ler as estatísticas, antecipar comportamentos que antecedem gols e fazer previsões. **Foco: Lucro máximo.**

## ✅ Correções Implementadas

### 1. **Migração para SQLite3** ✅
- ✅ Schema Prisma atualizado para SQLite
- ✅ Banco de dados criado e inicializado
- ✅ Seed inicial configurado com dados padrão

### 2. **Scraper Melhorado** ✅
- ✅ Leitura correta de estatísticas ao vivo
- ✅ Inclusão adequada no banco de dados
- ✅ Captura de gols do primeiro tempo (HT)
- ✅ Detecção automática de partidas finalizadas
- ✅ Fechamento automático de abas quando partida termina

### 3. **Prediction Engine Aprimorado** ✅
- ✅ Análise de padrões que antecedem gols:
  - Taxa de conversão de finalizações
  - Intensidade ofensiva (finalizações por minuto)
  - Momentum de ataque
  - Pressão sustentada (escanteios + ataques)
  - Precisão de chutes
  - Déficit de xG (gols esperados vs realizados)
  - Bônus de final de jogo (pressão após 60 min)
  
- ✅ Melhorias específicas por tipo:
  - **HT (Half Time)**: Peso maior em xG e chances claras
  - **FT (Full Time)**: Considera intensidade e momento do jogo
  - **BTTS**: Análise de equilíbrio ofensivo entre times

### 4. **Gestão de Partidas no Painel** ✅
- ✅ Botão para fechar partidas manualmente (X vermelho)
- ✅ Mais informações exibidas:
  - Finalizações totais e no alvo
  - Taxa de precisão dos chutes
  - Chances claras com destaque
  - Intensidade ofensiva em tempo real
  - Porcentagem de confiança nas previsões
- ✅ Indicador visual de intensidade ofensiva
- ✅ Auto-fechamento de partidas encerradas
- ✅ Resolução automática de previsões ao fechar

## 🚀 Como Usar

### 1. Acesse o Dashboard
```
http://localhost:3000
```

**Credenciais padrão:**
- Email: `john@doe.com`
- Senha: `johndoe123`

### 2. Iniciar o Sistema
1. Clique no botão **"Iniciar"** no header
2. O sistema começará a buscar partidas ao vivo automaticamente
3. Aguarde 1-2 minutos para partidas aparecerem

### 3. Testar Conexão
- Use o botão **"Testar"** para verificar se há partidas disponíveis
- Útil para depuração e validação

### 4. Configurar Telegram (Opcional)
1. Clique no ícone de engrenagem (⚙️)
2. Adicione Bot Token e Chat ID
3. Receberá notificações automáticas de entradas

### 5. Gerenciar Partidas
- Cada partida mostra estatísticas detalhadas em tempo real
- Clique no **X vermelho** para fechar partida manualmente
- Partidas finalizadas são fechadas automaticamente

## 📊 Estatísticas Monitoradas

O sistema coleta e analisa:
- ✅ Finalizações (totais, no alvo, para fora, bloqueadas)
- ✅ Escanteios
- ✅ xG (Expected Goals)
- ✅ Chances claras
- ✅ Ataques perigosos
- ✅ Placar em tempo real
- ✅ Minuto do jogo
- ✅ Taxa de conversão
- ✅ Intensidade ofensiva

## 🤖 Machine Learning Adaptativo

O sistema aprende continuamente através de:
- Ajuste automático de pesos baseado em assertividade
- Análise de padrões por time, liga e país
- Thresholds dinâmicos que se adaptam ao desempenho
- Consideração de múltiplos fatores estatísticos

### Indicadores de Previsão
O sistema identifica padrões que antecedem gols:
1. **Alta precisão de chutes** → Maior probabilidade de gol
2. **Intensidade ofensiva crescente** → Time pressionando
3. **Déficit de xG** → "Gol esperado" ainda não aconteceu
4. **Momentum de ataque** → Sequência de chances
5. **Pressão sustentada** → Escanteios + ataques consecutivos

## 💰 Gestão de Banca

- Banca inicial: **100u**
- Stake dinâmico: **5% da banca atual**
- Sem stop loss/take profit
- Lucro/prejuízo calculado automaticamente

### Tipos de Previsões e Retornos
- **HT (Half Time)**: Gol no primeiro tempo → +0.3u se correto
- **FT (Full Time)**: Gol no jogo
  - Antes dos 45min → +0.1u
  - Após 45min → +0.3u
- **BTTS**: Ambas marcam → +0.2u
- **Penalidade**: -1u por erro

## 🗄️ Banco de Dados

### SQLite3 (✅ Implementado)
- Arquivo: `/app/dev.db`
- Migrations automáticas via Prisma
- Seed inicial com configurações padrão

### Estrutura Principal
- `Match`: Partidas ao vivo
- `Team`: Times e estatísticas históricas
- `League`: Ligas e padrões
- `Prediction`: Previsões realizadas
- `StatSnapshot`: Snapshots de estatísticas por minuto
- `MLWeights`: Pesos do modelo de ML
- `Config`: Configurações do sistema
- `BankHistory`: Histórico da banca

## 🔧 Comandos Úteis

### Gerenciar Servidor
```bash
# Ver status
sudo supervisorctl status

# Reiniciar sistema
sudo supervisorctl restart nextjs

# Ver logs
tail -f /var/log/supervisor/nextjs.out.log
tail -f /var/log/supervisor/nextjs.err.log
```

### Banco de Dados
```bash
# Recriar banco
cd /app && npx prisma db push --accept-data-loss

# Seed inicial
cd /app && npx tsx scripts/seed.ts

# Ver dados
cd /app && npx prisma studio
```

### Playwright
```bash
# Reinstalar navegadores
cd /app && npx playwright install chromium --with-deps
```

## 🐛 Troubleshooting

### Nenhuma partida aparece
1. ✅ Sistema está iniciado?
2. ✅ Clique em "Testar" para verificar
3. ✅ Pode não haver partidas ao vivo no momento
4. ✅ Melhores horários: 14h-23h (horário brasileiro)

### Playwright não funciona
```bash
cd /app && npx playwright install chromium --with-deps
```

### Erro no banco de dados
```bash
cd /app
npx prisma generate
npx prisma db push
npx tsx scripts/seed.ts
```

### Servidor não inicia
```bash
sudo supervisorctl restart nextjs
tail -f /var/log/supervisor/nextjs.err.log
```

## 📈 Melhorias Futuras Sugeridas

- [ ] Análise de momentum mais profunda (aceleração de estatísticas)
- [ ] Detecção de padrões temporais (gols costumam acontecer em certos minutos)
- [ ] Machine learning com redes neurais para padrões complexos
- [ ] Análise de forma recente dos times
- [ ] Histórico head-to-head
- [ ] Análise de condições (tempo, casa/fora, etc)
- [ ] Backtesting com dados históricos
- [ ] Dashboard de análise por liga/time
- [ ] Exportação de relatórios
- [ ] Integração com casas de apostas

## ⚠️ Avisos Importantes

- O sistema usa web scraping que pode ser afetado por mudanças no site fonte
- As previsões são baseadas em estatísticas e **não garantem lucro**
- Use com **responsabilidade** e gestão de banca adequada
- Teste extensivamente antes de usar com valores reais
- **Este é um sistema educacional para fins de estudo**

## 🎓 Como o Sistema Funciona

1. **Scraper**: Monitora partidas ao vivo usando Playwright
2. **Coleta**: Captura estatísticas a cada 20-30 segundos
3. **Análise**: Prediction Engine analisa padrões em tempo real
4. **Decisão**: Se probabilidade > threshold, faz previsão
5. **Notificação**: Envia alerta via Telegram (se configurado)
6. **Resolução**: Quando partida termina, resolve previsões
7. **Aprendizado**: Ajusta pesos baseado em acertos/erros

## 📞 Suporte

Para problemas:
1. Verifique os logs do sistema
2. Consulte a seção Troubleshooting
3. Verifique se há partidas ao vivo no momento

---

**Desenvolvido com ❤️ e ⚽ - Sistema otimizado para máximo lucro através de análise estatística avançada**
