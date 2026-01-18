'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ScoreBreakdownChart({ data }) {
  if (!data) return null;

  // Transform data for the chart
  const chartData = [
    {
      category: 'Communication',
      score: data.communication,
    },
    {
      category: 'Role Knowledge',
      score: data.role_knowledge,
    },
    {
      category: 'Structure',
      score: data.structure,
    },
    {
      category: 'Impact',
      score: data.impact,
    },
  ];

  return (
    <div className="score-breakdown-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="category" 
            stroke="var(--muted, #9ca3af)"
            style={{ fontSize: '14px' }}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="var(--muted, #9ca3af)"
            style={{ fontSize: '14px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--panel, #0e0e10)',
              border: '1px solid var(--border, #232326)',
              borderRadius: '6px',
              color: 'var(--text, #ffffff)',
            }}
            formatter={(value) => `${value}/100`}
            labelStyle={{ color: 'var(--text, #ffffff)' }}
          />
          <Bar 
            dataKey="score" 
            fill="var(--accent-color, #667eea)" 
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
