
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface PredictionCardProps {
  prediction: any;
  index: number;
  isActive: boolean;
}

export default function PredictionCard({ prediction, index, isActive }: PredictionCardProps) {
  const getPredictionTypeLabel = (type: string) => {
    switch (type) {
      case 'HT': return 'Gol HT';
      case 'FT': return 'Gol FT';
      case 'BTTS': return 'Ambas Marcam';
      default: return type;
    }
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case 'HT': return 'bg-orange-500';
      case 'FT': return 'bg-blue-500';
      case 'BTTS': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
        isActive ? 'border-l-blue-500' : 
        prediction.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isActive ? (
                <Clock className="h-4 w-4 text-blue-500" />
              ) : prediction.isCorrect ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-semibold text-sm">
                {prediction.match?.homeTeam?.name} vs {prediction.match?.awayTeam?.name}
              </span>
            </div>
            <Badge 
              className={`text-xs text-white ${getPredictionColor(prediction.type)}`}
            >
              {getPredictionTypeLabel(prediction.type)}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p>{prediction.match?.league?.name}</p>
              <p>Minuto: {prediction.predictionMinute}'</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                Stake: {prediction.stake?.toFixed(2)}u
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Confiança: {(prediction.confidenceScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {!isActive && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">
                {prediction.isCorrect ? 'GREEN' : 'RED'}
              </span>
              <div className="flex items-center gap-1">
                {prediction.profit > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`font-bold ${prediction.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.profit > 0 ? '+' : ''}{prediction.profit?.toFixed(2)}u
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
