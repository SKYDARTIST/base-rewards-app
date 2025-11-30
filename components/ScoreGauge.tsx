import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreGaugeProps {
  score: number; // 0 to 1
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 1 - score },
  ];

  const getColor = (s: number) => {
    if (s < 0.3) return '#EF4444'; // Red
    if (s < 0.7) return '#F59E0B'; // Amber
    return '#2563EB'; // Blue
  };

  const activeColor = getColor(score);
  const COLORS = [activeColor, '#F3F4F6'];

  return (
    <div className="relative h-40 w-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1 mt-4 text-center">
        <span className="text-3xl font-bold text-gray-900 block">
          {Math.round(score * 100)}
        </span>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
};