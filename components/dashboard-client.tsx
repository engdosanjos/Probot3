
"use client";

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Play,
  Pause,
  Settings,
  LogOut,
  Clock,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveMatchCard from '@/components/live-match-card';
import PredictionCard from '@/components/prediction-card';
import TelegramConfig from '@/components/telegram-config';
import StatisticsCharts from '@/components/statistics-charts';

interface Statistics {
  overall: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    activePredictions: number;
    currentBankroll: number;
    todayProfit: number;
    greens: number;
    reds: number;
  };
  byType: {
    HT: { accuracy: number; total: number };
    FT: { accuracy: number; total: number };
    BTTS: { accuracy: number; total: number };
  };
  recentHistory: any[];
}

export default function DashboardClient() {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [activePredictions, setActivePredictions] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, matchesRes, activePredRes, recentPredRes, systemRes] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/matches?type=live'),
        fetch('/api/predictions?type=active'),
        fetch('/api/predictions?type=recent'),
        fetch('/api/system/start')
      ]);

      const [stats, matches, activePred, recentPred, system] = await Promise.all([
        statsRes.json(),
        matchesRes.json(),
        activePredRes.json(),
        recentPredRes.json(),
        systemRes.json()
      ]);

      setStatistics(stats.statistics);
      setLiveMatches(matches.matches || []);
      setActivePredictions(activePred.predictions || []);
      setRecentPredictions(recentPred.predictions || []);
      setSystemStatus(system);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSystem = async () => {
    try {
      const endpoint = '/api/system/start';
      const method = systemStatus?.isRunning ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, { method });
      const result = await response.json();

      if (response.ok) {
        await fetchAllData(); // Refresh data
        toast({
          title: "Sistema " + (systemStatus?.isRunning ? "Parado" : "Iniciado"),
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error toggling system:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar status do sistema",
        variant: "destructive",
      });
    }
  };

  const testScraper = async () => {
    setTestingConnection(true);
    try {
      toast({
        title: "Testando conexão...",
        description: "Verificando se há partidas disponíveis para scraping",
      });
      
      const response = await fetch('/api/system/test-scraper');
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Teste bem-sucedido! ✅",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro no teste",
          description: result.error || "Falha ao testar scraper",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error testing scraper:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar teste de conexão",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Goal Prediction
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  Sistema em {systemStatus?.isRunning ? 'funcionamento' : 'standby'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={toggleSystem}
                variant={systemStatus?.isRunning ? "destructive" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {systemStatus?.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {systemStatus?.isRunning ? 'Parar' : 'Iniciar'}
              </Button>

              <Button
                onClick={testScraper}
                variant="outline"
                size="sm"
                disabled={testingConnection}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {testingConnection ? 'Testando...' : 'Testar'}
              </Button>

              <Button
                onClick={() => setShowTelegramConfig(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Greens</CardTitle>
                <CheckCircle className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.overall.greens || 0}</div>
                <p className="text-xs text-green-100">
                  Previsões corretas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reds</CardTitle>
                <XCircle className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.overall.reds || 0}</div>
                <p className="text-xs text-red-100">
                  Previsões incorretas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assertividade</CardTitle>
                <Target className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((statistics?.overall.accuracy || 0) * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={(statistics?.overall.accuracy || 0) * 100} 
                  className="mt-2 h-2 bg-blue-400"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banca Atual</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(statistics?.overall.currentBankroll || 0).toFixed(2)}u
                </div>
                <p className="text-xs text-purple-100 flex items-center gap-1">
                  {statistics?.overall?.todayProfit && statistics.overall.todayProfit > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {(statistics?.overall?.todayProfit || 0) > 0 ? '+' : ''}{(statistics?.overall?.todayProfit || 0).toFixed(2)}u hoje
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatisticsCharts statistics={statistics} />
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Matches */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Partidas Acompanhando
                  <Badge variant="secondary">{liveMatches.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Jogos sendo monitorados em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {liveMatches.length > 0 ? (
                    liveMatches.map((match: any, index) => (
                      <LiveMatchCard key={match.id} match={match} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Nenhuma partida ao vivo no momento
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {systemStatus?.isRunning 
                          ? 'O sistema está ativo e buscando partidas automaticamente'
                          : 'Clique em "Iniciar" para ativar o sistema e começar a buscar partidas'}
                      </p>
                      {!systemStatus?.isRunning && (
                        <Button 
                          onClick={toggleSystem}
                          variant="default"
                          size="sm"
                          className="mt-2"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Sistema
                        </Button>
                      )}
                      <Button 
                        onClick={testScraper}
                        variant="outline"
                        size="sm"
                        disabled={testingConnection}
                        className="mt-2 ml-2"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {testingConnection ? 'Testando...' : 'Testar Conexão'}
                      </Button>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Entradas Abertas
                  <Badge variant="secondary">{activePredictions.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Previsões aguardando resultado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {activePredictions.length > 0 ? (
                    activePredictions.map((prediction: any, index) => (
                      <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        index={index}
                        isActive={true}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-600 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Nenhuma entrada ativa</p>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Predictions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  Últimas 10 Entradas
                </CardTitle>
                <CardDescription>
                  Resultados das previsões recentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {recentPredictions.length > 0 ? (
                    recentPredictions.map((prediction: any, index) => (
                      <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        index={index}
                        isActive={false}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-600 dark:text-gray-400">Nenhuma previsão recente</p>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Telegram Configuration Modal */}
      <TelegramConfig
        isOpen={showTelegramConfig}
        onClose={() => setShowTelegramConfig(false)}
        onSave={fetchAllData}
      />
    </div>
  );
}
