"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface AccuracyChartProps {
  checkedCount: number;
  totalCount: number;
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ checkedCount, totalCount }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const width = chartRef.current.clientWidth;
    const height = 220;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const data = totalCount === 0 
      ? [{ label: 'Empty', value: 1, color: 'var(--color-chart-empty)' }]
      : [
          { label: 'Checked', value: checkedCount, color: '#4F46E5' },
          { label: 'Unchecked', value: Math.max(0, totalCount - checkedCount), color: 'var(--color-chart-unchecked)' }
        ];

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.75)
      .outerRadius(radius)
      .cornerRadius(8);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'currentColor')
      .attr('class', 'text-white dark:text-slate-900')
      .style('stroke-width', '2px');

    // Central Text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '32px')
      .style('font-weight', '800')
      .style('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-chart-text)')
      .text(`${percentage}%`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.1em')
      .style('fill', '#94a3b8')
      .text('Accuracy');

  }, [checkedCount, totalCount, percentage]);

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={chartRef} className="w-full h-[220px]" />
      
      <div className="mt-6 flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Checked</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono leading-none">{checkedCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Total</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono leading-none">{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
