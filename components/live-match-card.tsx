
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Activity, Target, CornerDownRight, TrendingUp } from 'lucide-react';

interface LiveMatchCardProps {
  match: any;
  index: number;
}

export default function LiveMatchCard({ match, index }: LiveMatchCardProps) {
  const xgTotal = match.xgHome + match.xgAway;
  const shotsTotal = match.shotsHome + match.shotsAway;
  const cornersTotal = match.cornersHome + match.cornersAway;

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
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-sm">
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {match.minute || 0}'
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold">
              {match.goalsHome} - {match.goalsAway}
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400">{match.league?.name}</p>
              <p className="text-xs text-green-600 font-medium">{match.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                xG
              </span>
              <span className="font-medium">{xgTotal.toFixed(2)}</span>
            </div>
            <Progress value={Math.min(xgTotal * 25, 100)} className="h-1" />

            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Finalizações: {shotsTotal}</span>
              <span>Escanteios: {cornersTotal}</span>
            </div>
          </div>

          {match.predictions && match.predictions.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="flex gap-1 flex-wrap">
                {match.predictions.map((pred: any) => (
                  <Badge key={pred.id} variant="secondary" className="text-xs">
                    {pred.type}
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
