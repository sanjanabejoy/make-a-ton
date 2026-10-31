import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Card from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';

const DEFAULT_COLORS = [
  '#4f46e5', // indigo-600
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
];

const formatINR = (val) => {
  if (val === undefined || val === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export function DonutCard({
  title,
  subtitle,
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  height = 280,
  isLoading = false,
  isMoney = true,
  colors = DEFAULT_COLORS,
  centerLabel,
  centerSub,
  action,
}) {
  const isEmpty = !data || data.length === 0 || data.every((d) => !d[valueKey]);

  const total = data.reduce((acc, curr) => acc + (Number(curr[valueKey]) || 0), 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
          <p className="font-semibold text-slate-200">{entry.name}</p>
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">
              {isMoney ? formatINR(entry.value) : entry.value}
            </span>
            <span className="text-slate-400">({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div style={{ height }} className="w-full relative flex items-center justify-center">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
        ) : isEmpty ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
            No data available
          </div>
        ) : (
          <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey={valueKey}
                    nameKey={nameKey}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold text-slate-900">
                  {centerLabel || (isMoney ? formatINR(total) : total)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {centerSub || 'Total'}
                </span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex-1 max-h-48 overflow-y-auto space-y-1.5 w-full pr-1">
              {data.map((item, idx) => {
                const color = item.color || colors[idx % colors.length];
                const pct = total > 0 ? (((item[valueKey] || 0) / total) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-700 font-medium truncate">
                        {item[nameKey]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-900">
                        {isMoney ? formatINR(item[valueKey]) : item[valueKey]}
                      </span>
                      <span className="text-slate-400 text-[10px] w-7 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default DonutCard;
