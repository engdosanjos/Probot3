
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Send, Bot, MessageSquare, Settings, Loader2 } from 'lucide-react';

interface TelegramConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function TelegramConfig({ isOpen, onClose, onSave }: TelegramConfigProps) {
  const [config, setConfig] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    bankroll: 100,
    stakePercentage: 5,
    isSystemActive: true
  });
  const [loading, setLoading] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      
      if (data.config) {
        setConfig({
          telegramBotToken: data.config.telegramBotToken || '',
          telegramChatId: data.config.telegramChatId || '',
          bankroll: data.config.bankroll || 100,
          stakePercentage: data.config.stakePercentage || 5,
          isSystemActive: data.config.isSystemActive ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        });
        onSave();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testTelegram = async () => {
    if (!config.telegramBotToken || !config.telegramChatId) {
      toast({
        title: "Erro",
        description: "Preencha o Token do Bot e Chat ID antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTestingTelegram(true);
    try {
      const testMessage = `🧪 <b>TESTE DE CONFIGURAÇÃO</b>

✅ Sistema de Previsões conectado com sucesso!

🤖 <b>Bot Token:</b> ${config.telegramBotToken.substring(0, 10)}...
💬 <b>Chat ID:</b> ${config.telegramChatId}

⏰ ${new Date().toLocaleString('pt-BR')}`;

      const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: testMessage,
          parse_mode: 'HTML'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Mensagem de teste enviada com sucesso!",
        });
      } else {
        throw new Error(result.description || 'Falha ao enviar mensagem');
      }
    } catch (error: any) {
      console.error('Error testing telegram:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao testar Telegram",
        variant: "destructive",
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Configure o Telegram e parâmetros do sistema de previsões
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Telegram Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-blue-500" />
                Configuração do Telegram
              </CardTitle>
              <CardDescription>
                Configure as notificações via Telegram para receber alertas das previsões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxyz"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Obtido através do @BotFather no Telegram
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="123456789"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  ID do chat onde as mensagens serão enviadas
                </p>
              </div>

              <Button
                onClick={testTelegram}
                variant="outline"
                className="w-full"
                disabled={testingTelegram}
              >
                {testingTelegram ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Testar Configuração
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-green-500" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankroll">Banca Inicial (u)</Label>
                  <Input
                    id="bankroll"
                    type="number"
                    step="0.01"
                    value={config.bankroll}
                    onChange={(e) => setConfig(prev => ({ ...prev, bankroll: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stakePercentage">Stake (%)</Label>
                  <Input
                    id="stakePercentage"
                    type="number"
                    step="0.1"
                    value={config.stakePercentage}
                    onChange={(e) => setConfig(prev => ({ ...prev, stakePercentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sistema Ativo</Label>
                  <p className="text-xs text-gray-500">
                    Ativar/desativar o sistema de previsões
                  </p>
                </div>
                <Switch
                  checked={config.isSystemActive}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isSystemActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <MessageSquare className="h-4 w-4" />
                Como configurar o Telegram
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
              <p><strong>1.</strong> Abra o Telegram e procure por @BotFather</p>
              <p><strong>2.</strong> Digite /newbot e siga as instruções</p>
              <p><strong>3.</strong> Copie o Token fornecido</p>
              <p><strong>4.</strong> Para obter seu Chat ID, procure por @userinfobot</p>
              <p><strong>5.</strong> Digite /start e copie seu ID</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
