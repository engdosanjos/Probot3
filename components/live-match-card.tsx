
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Activity, Target, CornerDownRight, TrendingUp, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LiveMatchCardProps {
  match: any;
  index: number;
  onMatchClosed?: () => void;
}

export default function LiveMatchCard({ match, index, onMatchClosed }: LiveMatchCardProps) {
  const [isClosing, setIsClosing] = useState(false);
  
  const xgTotal = match.xgHome + match.xgAway;
  const shotsTotal = match.shotsHome + match.shotsAway;
  const shotsOnTargetTotal = match.shotsOnHome + match.shotsOnAway;
  const cornersTotal = match.cornersHome + match.cornersAway;
  const bigChancesTotal = match.bigChancesHome + match.bigChancesAway;

  // Calculate attacking intensity
  const attackingIntensity = match.minute > 0 ? shotsTotal / match.minute : 0;
  const shotAccuracy = shotsTotal > 0 ? (shotsOnTargetTotal / shotsTotal * 100) : 0;

  const handleCloseMatch = async () => {
    if (!confirm(`Tem certeza que deseja fechar esta partida?\n${match.homeTeam?.name} vs ${match.awayTeam?.name}`)) {
      return;
    }

    setIsClosing(true);
    try {
      const response = await fetch(`/api/matches/${match.id}/close`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Partida fechada",
          description: "A partida foi encerrada e as previsões foram resolvidas",
        });
        if (onMatchClosed) {
          onMatchClosed();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error closing match:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao fechar partida",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="font-semibold text-sm truncate">
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="outline" className="text-xs">
                {match.minute || 0}'
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseMatch}
                disabled={isClosing}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                title="Fechar partida"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold">
              {match.goalsHome} - {match.goalsAway}
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                {match.league?.name}
              </p>
              <p className="text-xs text-green-600 font-medium">{match.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Target className="h-3 w-3" />
                  xG
                </span>
                <span className="font-medium">{xgTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Precisão</span>
                <span className="font-medium">{shotAccuracy.toFixed(0)}%</span>
              </div>
            </div>
            <Progress value={Math.min(xgTotal * 25, 100)} className="h-1.5" />

            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 pt-1">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{shotsTotal}</div>
                <div>Finalizações</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{shotsOnTargetTotal}</div>
                <div>No alvo</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{cornersTotal}</div>
                <div>Escanteios</div>
              </div>
            </div>

            {bigChancesTotal > 0 && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  Chances claras
                </span>
                <span className="font-semibold text-orange-600">{bigChancesTotal}</span>
              </div>
            )}

            {attackingIntensity > 0.3 && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Alta intensidade ofensiva ({attackingIntensity.toFixed(2)}/min)
              </div>
            )}
          </div>

          {match.predictions && match.predictions.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="flex gap-1 flex-wrap">
                {match.predictions.map((pred: any) => (
                  <Badge key={pred.id} variant="secondary" className="text-xs">
                    {pred.type} ({(pred.confidenceScore * 100).toFixed(0)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
