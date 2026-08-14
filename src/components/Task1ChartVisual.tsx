import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';
import type {
  ChartData, TableChartData, BarChartData, LineChartData,
  PieChartData, MapDiagramData, ProcessDiagramData,
} from '../data/writingTask1';

/* ── Table ── */
function TableVisual({ data }: { data: TableChartData }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white">
            {data.headers.map((h, i) => (
              <th key={i} className={`px-4 py-3 font-bold text-left text-xs uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'rounded-tl-xl' : ''} ${i === data.headers.length - 1 ? 'rounded-tr-xl' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{row.label}</td>
              {row.cells.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-700 text-center whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.note && (
        <p className="text-[11px] text-slate-500 italic px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          Note: {data.note}
        </p>
      )}
    </div>
  );
}

/* ── Bar Chart ── */
function BarVisual({ data }: { data: BarChartData }) {
  const chartData = data.groups.map((group, i) => {
    const entry: Record<string, string | number> = { name: group };
    data.series.forEach(s => { entry[s.name] = s.values[i]; });
    return entry;
  });
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 font-medium">{data.unit}</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value: number) => [`${value} ${data.unit}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {data.series.map(s => (
            <Bar key={s.name} dataKey={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Line Graph ── */
function LineVisual({ data }: { data: LineChartData }) {
  const chartData = data.xValues.map((x, i) => {
    const entry: Record<string, string | number> = { name: x };
    data.series.forEach(s => { entry[s.name] = s.values[i]; });
    return entry;
  });
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 font-medium">{data.unit}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {data.series.map(s => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: s.color }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Pie Chart ── */
const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.04) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function PieVisual({ data }: { data: PieChartData }) {
  return (
    <div className={`flex flex-col ${data.charts.length > 1 ? 'sm:flex-row' : ''} gap-6 justify-center`}>
      {data.charts.map((chart, ci) => (
        <div key={ci} className="flex-1 min-w-0">
          <p className="text-center font-bold text-slate-700 text-sm mb-2">{chart.title}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chart.segments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={90}
                dataKey="value"
              >
                {chart.segments.map((seg, i) => (
                  <Cell key={i} fill={seg.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2">
            {chart.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] text-slate-600">{seg.name} ({seg.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Map Diagram ── */
function MapVisual({ data }: { data: MapDiagramData }) {
  const vb = data.viewBox || '0 0 400 300';
  const [, , vw, vh] = vb.split(' ').map(Number);

  return (
    <div className={`flex flex-col ${data.periods.length > 1 ? 'sm:flex-row' : ''} gap-4`}>
      {data.periods.map((period, pi) => (
        <div key={pi} className="flex-1 min-w-0">
          <p className="text-center font-bold text-slate-700 text-sm mb-2 px-2 py-1 bg-slate-100 rounded-lg">
            {period.label}
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <svg
              viewBox={vb}
              width="100%"
              className="block"
              style={{ aspectRatio: `${vw}/${vh}`, maxHeight: 280 }}
            >
              {/* Compass */}
              <g transform={`translate(${vw - 28}, 18)`}>
                <circle cx="0" cy="0" r="14" fill="white" stroke="#cbd5e1" strokeWidth="1" />
                <text x="0" y="-4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e3a8a">N</text>
                <polygon points="0,-12 -4,0 4,0" fill="#1e3a8a" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1" />
              </g>

              {period.elements.map((el, ei) => {
                const lines = el.label.split('\n');
                const fs = el.fontSize ?? (el.w < 80 || el.h < 40 ? 9 : 11);
                const textX = el.x + el.w / 2;
                const textY = el.y + el.h / 2 - ((lines.length - 1) * (fs + 2)) / 2;
                return (
                  <g key={ei}>
                    <rect
                      x={el.x} y={el.y} width={el.w} height={el.h}
                      fill={el.color}
                      stroke="rgba(0,0,0,0.12)"
                      strokeWidth="1"
                      rx="3"
                    />
                    {lines.map((line, li) => (
                      <text
                        key={li}
                        x={textX}
                        y={textY + li * (fs + 3)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fs}
                        fontWeight="600"
                        fill={el.textColor || '#1f2937'}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Process Diagram ── */
function ProcessVisual({ data }: { data: ProcessDiagramData }) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200" />
      <div className="space-y-2">
        {data.stages.map((stage, i) => (
          <div key={i} className="flex items-start gap-4 relative">
            {/* Step number circle */}
            <div
              className="w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 z-10 border-2 border-white shadow-md text-xl"
              style={{ backgroundColor: stage.color }}
            >
              <span className="text-lg leading-none">{stage.icon}</span>
              <span className="text-[9px] font-black text-slate-500 mt-0.5">{i + 1}</span>
            </div>
            {/* Content box */}
            <div className="flex-1 min-w-0 mt-1.5 pb-1">
              <div
                className="rounded-2xl p-3 border border-slate-100 shadow-sm"
                style={{ backgroundColor: stage.color }}
              >
                <p className="font-bold text-slate-800 text-sm mb-0.5">{stage.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{stage.description}</p>
              </div>
              {/* Arrow to next */}
              {i < data.stages.length - 1 && (
                <div className="flex justify-start ml-6 mt-0.5">
                  <span className="text-slate-300 text-sm">▼</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main export ── */
export function Task1ChartVisual({ chartData }: { chartData: ChartData }) {
  switch (chartData.type) {
    case 'table':   return <TableVisual   data={chartData as TableChartData}   />;
    case 'bar':     return <BarVisual     data={chartData as BarChartData}     />;
    case 'line':    return <LineVisual    data={chartData as LineChartData}    />;
    case 'pie':     return <PieVisual     data={chartData as PieChartData}     />;
    case 'map':     return <MapVisual     data={chartData as MapDiagramData}   />;
    case 'process': return <ProcessVisual data={chartData as ProcessDiagramData} />;
    default:        return null;
  }
}
