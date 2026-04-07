import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AccuracyChartProps {
  checkedCount: number;
  totalCount: number;
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ checkedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  
  const data = totalCount === 0 
    ? [{ name: 'Empty', value: 1, color: '#F1F5F9' }] // Slate 100
    : [
        { name: 'Checked', value: checkedCount, color: '#4F46E5' }, // Indigo 600
        { name: 'Unchecked', value: Math.max(0, totalCount - checkedCount), color: '#E2E8F0' }, // Slate 200
      ];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={totalCount > 0 ? 5 : 0}
              dataKey="value"
              startAngle={90}
              endAngle={450}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold text-slate-900 font-mono tracking-tighter">{percentage}%</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mt-1">Accuracy</span>
        </div>
      </div>
      
      <div className="mt-2 flex gap-8">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Checked</span>
            <span className="text-sm font-bold text-slate-700 font-mono">{checkedCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Total</span>
            <span className="text-sm font-bold text-slate-700 font-mono">{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
