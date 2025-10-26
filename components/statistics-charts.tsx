
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';

interface StatisticsChartsProps {
  statistics: any;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3'];

export default function StatisticsCharts({ statistics }: StatisticsChartsProps) {
  const predictionTypeData = useMemo(() => {
    if (!statistics?.byType) return [];
    
    return [
      {
        name: 'HT (Gol HT)',
        accuracy: (statistics.byType.HT?.accuracy || 0) * 100,
        total: statistics.byType.HT?.total || 0,
        correct: Math.round((statistics.byType.HT?.accuracy || 0) * (statistics.byType.HT?.total || 0)),
      },
      {
        name: 'FT (Gol FT)', 
        accuracy: (statistics.byType.FT?.accuracy || 0) * 100,
        total: statistics.byType.FT?.total || 0,
        correct: Math.round((statistics.byType.FT?.accuracy || 0) * (statistics.byType.FT?.total || 0)),
      },
      {
        name: 'BTTS (Ambas)',
        accuracy: (statistics.byType.BTTS?.accuracy || 0) * 100,
        total: statistics.byType.BTTS?.total || 0,
        correct: Math.round((statistics.byType.BTTS?.accuracy || 0) * (statistics.byType.BTTS?.total || 0)),
      }
    ];
  }, [statistics]);

  const pieData = useMemo(() => {
    if (!statistics?.overall) return [];
    
    return [
      {
        name: 'Greens',
        value: statistics.overall.greens || 0,
        color: '#22C55E'
      },
      {
        name: 'Reds',
        value: statistics.overall.reds || 0,
        color: '#EF4444'
      }
    ];
  }, [statistics]);

  const bankrollHistory = useMemo(() => {
    if (!statistics?.recentHistory) return [];
    
    let runningBalance = 100; // Starting balance
    return statistics.recentHistory
      .slice()
      .reverse()
      .map((entry: any, index: number) => {
        const newBalance = runningBalance + entry.change;
        runningBalance = newBalance;
        return {
          name: `Entry ${index + 1}`,
          balance: newBalance,
          change: entry.change,
          date: new Date(entry.createdAt).toLocaleDateString('pt-BR')
        };
      })
      .slice(-20); // Last 20 entries
  }, [statistics]);

  if (!statistics) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy by Prediction Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Assertividade por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictionTypeData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  label={{ 
                    value: 'Assertividade (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: 11 }
                  }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'accuracy' ? `${value.toFixed(1)}%` : value,
                    name === 'accuracy' ? 'Assertividade' : 'Total'
                  ]}
                  labelStyle={{ fontSize: 11 }}
                />
                <Bar 
                  dataKey="accuracy" 
                  fill="#60B5FF" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              {predictionTypeData.map((item, index) => (
                <div key={item.name} className="text-center">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {item.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {item.correct}/{item.total} acertos
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Greens vs Reds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-500" />
              Distribuição de Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({name, value, percent}) => 
                    `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Greens: <strong>{statistics.overall.greens}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Reds: <strong>{statistics.overall.reds}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bankroll Evolution */}
      {bankrollHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-purple-500" />
              Evolução da Banca
              <Badge variant="outline" className="ml-2">
                Últimas {bankrollHistory.length} entradas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bankrollHistory}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  label={{ 
                    value: 'Banca (u)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: 11 }
                  }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}u`, 'Banca']}
                  labelFormatter={(label) => `${label}`}
                  labelStyle={{ fontSize: 11 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#FF9149" 
                  strokeWidth={3}
                  dot={{ fill: '#FF9149', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Banca Atual</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {statistics.overall.currentBankroll?.toFixed(2)}u
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Lucro Hoje</div>
                  <div className={`text-xl font-bold ${
                    statistics.overall.todayProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {statistics.overall.todayProfit >= 0 ? '+' : ''}
                    {statistics.overall.todayProfit?.toFixed(2)}u
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
