import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Card from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';

const formatINR = (val) => {
  if (val === undefined || val === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export function BarChartCard({
  title,
  subtitle,
  data = [],
  bars = [{ dataKey: 'value', name: 'Value', color: '#4f46e5' }],
  xKey = 'name',
  height = 280,
  isLoading = false,
  isMoney = true,
  layout = 'horizontal',
  action,
}) {
  const isEmpty = !data || data.length === 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {isMoney ? formatINR(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div style={{ height }} className="w-full relative">
        {isLoading ? (
          <div className="h-full w-full flex flex-col justify-center gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-full w-full" />
          </div>
        ) : isEmpty ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {layout === 'vertical' ? (
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={isMoney ? (v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` : undefined}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey={xKey}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                {bars.map((bar, i) => (
                  <Bar
                    key={bar.dataKey || i}
                    dataKey={bar.dataKey}
                    name={bar.name}
                    fill={bar.color || '#4f46e5'}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={isMoney ? (v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` : undefined}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
                {bars.map((bar, i) => (
                  <Bar
                    key={bar.dataKey || i}
                    dataKey={bar.dataKey}
                    name={bar.name}
                    fill={bar.color || '#4f46e5'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export default BarChartCard;
