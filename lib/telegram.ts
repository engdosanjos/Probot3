
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export class TelegramNotifier {
  private config: TelegramConfig | null = null;

  constructor(botToken?: string, chatId?: string) {
    if (botToken && chatId) {
      this.config = { botToken, chatId };
    }
  }

  updateConfig(botToken: string, chatId: string) {
    this.config = { botToken, chatId };
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.config) {
      console.log('[telegram] No configuration set, skipping message');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('[telegram] Message sent successfully');
        return true;
      } else {
        console.error('[telegram] Failed to send message:', result);
        return false;
      }
    } catch (error) {
      console.error('[telegram] Error sending message:', error);
      return false;
    }
  }

  async sendPredictionNotification(
    homeTeam: string, 
    awayTeam: string, 
    league: string,
    predictionType: string, 
    confidence: number,
    stake: number
  ) {
    const message = `
🔮 <b>NOVA ENTRADA!</b>

⚽ <b>${homeTeam} vs ${awayTeam}</b>
🏆 ${league}

🎯 <b>Previsão:</b> ${predictionType}
📊 <b>Confiança:</b> ${(confidence * 100).toFixed(1)}%
💰 <b>Stake:</b> ${stake.toFixed(2)}u

⏰ ${new Date().toLocaleString('pt-BR')}
    `.trim();

    return await this.sendMessage(message);
  }

  async sendResultNotification(
    homeTeam: string,
    awayTeam: string,
    predictionType: string,
    isCorrect: boolean,
    profit: number,
    newBankroll: number
  ) {
    const emoji = isCorrect ? '✅' : '❌';
    const result = isCorrect ? 'GREEN' : 'RED';
    
    const message = `
${emoji} <b>RESULTADO ${result}</b>

⚽ <b>${homeTeam} vs ${awayTeam}</b>
🎯 <b>Previsão:</b> ${predictionType}

💰 <b>Lucro/Prejuízo:</b> ${profit > 0 ? '+' : ''}${profit.toFixed(2)}u
🏦 <b>Banca atual:</b> ${newBankroll.toFixed(2)}u

⏰ ${new Date().toLocaleString('pt-BR')}
    `.trim();

    return await this.sendMessage(message);
  }

  async sendDailyReport(
    greens: number,
    reds: number,
    accuracy: number,
    bankroll: number,
    dailyProfit: number
  ) {
    const message = `
📊 <b>RELATÓRIO DIÁRIO</b>

✅ <b>Greens:</b> ${greens}
❌ <b>Reds:</b> ${reds}
📈 <b>Assertividade:</b> ${(accuracy * 100).toFixed(1)}%

💰 <b>Banca atual:</b> ${bankroll.toFixed(2)}u
📊 <b>Lucro do dia:</b> ${dailyProfit > 0 ? '+' : ''}${dailyProfit.toFixed(2)}u

⏰ ${new Date().toLocaleString('pt-BR')}
    `.trim();

    return await this.sendMessage(message);
  }
}
