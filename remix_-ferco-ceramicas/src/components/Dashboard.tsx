/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Award, AlertTriangle, CheckCircle2, TrendingUp, Filter, Calendar } from 'lucide-react';
import { Audit, SStepConfig, AreaCompliance } from '../types';
import { MONTHLY_DATA, WEEKLY_DATA } from '../data/defaultData';

interface DashboardProps {
  audits: Audit[];
  sSteps: SStepConfig[];
  areas: string[];
}

export default function Dashboard({ audits, sSteps, areas }: DashboardProps) {
  const [selectedChartArea, setSelectedChartArea] = useState<string>('Todas');

  // Compute stats
  const stats = useMemo(() => {
    if (audits.length === 0) {
      return {
        globalScore: 0,
        totalAudits: 0,
        sScores: { '1ª S': 0, '2ª S': 0, '3ª S': 0, '4ª S': 0, '5ª S': 0 },
        sCounts: { '1ª S': 0, '2ª S': 0, '3ª S': 0, '4ª S': 0, '5ª S': 0 },
        sFailures: {} as Record<string, { text: string; count: number }[]>,
        areaRanking: [] as AreaCompliance[],
      };
    }

    const totalAudits = audits.length;
    let totalScoreSum = 0;

    // Track S-specific scores
    const sScoresSum = { '1ª S': 0, '2ª S': 0, '3ª S': 0, '4ª S': 0, '5ª S': 0 };
    const sScoresCount = { '1ª S': 0, '2ª S': 0, '3ª S': 0, '4ª S': 0, '5ª S': 0 };
    
    // Track S Failure incidences
    const sIncidences: Record<string, Record<string, number>> = {
      '1ª S': {}, '2ª S': {}, '3ª S': {}, '4ª S': {}, '5ª S': {}
    };

    // Track Area stats
    const areaMap: Record<string, { scoreSum: number; count: number; planesCount: number }> = {};
    areas.forEach(area => {
      areaMap[area] = { scoreSum: 0, count: 0, planesCount: 0 };
    });

    audits.forEach(audit => {
      totalScoreSum += audit.score;
      
      // Area stats
      if (!areaMap[audit.area]) {
        areaMap[audit.area] = { scoreSum: 0, count: 0, planesCount: 0 };
      }
      areaMap[audit.area].scoreSum += audit.score;
      areaMap[audit.area].count += 1;
      areaMap[audit.area].planesCount += audit.actionPlans.length;

      // Item level stats
      audit.items.forEach(item => {
        if (item.complies !== null) {
          sScoresCount[item.sType] += 1;
          if (item.complies) {
            sScoresSum[item.sType] += 100;
          } else {
            // Count incidence failure
            const sTypeIncidences = sIncidences[item.sType];
            sTypeIncidences[item.criterionText] = (sTypeIncidences[item.criterionText] || 0) + 1;
          }
        }
      });
    });

    // Calculate Global Score (Average of all audit scores)
    const globalScore = Math.round(totalScoreSum / totalAudits);

    // Calculate S scores
    const sScores = {
      '1ª S': sScoresCount['1ª S'] ? Math.round(sScoresSum['1ª S'] / sScoresCount['1ª S']) : 0,
      '2ª S': sScoresCount['2ª S'] ? Math.round(sScoresSum['2ª S'] / sScoresCount['2ª S']) : 0,
      '3ª S': sScoresCount['3ª S'] ? Math.round(sScoresSum['3ª S'] / sScoresCount['3ª S']) : 0,
      '4ª S': sScoresCount['4ª S'] ? Math.round(sScoresSum['4ª S'] / sScoresCount['4ª S']) : 0,
      '5ª S': sScoresCount['5ª S'] ? Math.round(sScoresSum['5ª S'] / sScoresCount['5ª S']) : 0,
    };

    // Get most common failure text for each S
    const sFailures: Record<string, string> = {};
    Object.keys(sIncidences).forEach(sKey => {
      const entries = Object.entries(sIncidences[sKey]);
      if (entries.length > 0) {
        // Sort by occurrence descending
        entries.sort((a, b) => b[1] - a[1]);
        sFailures[sKey] = entries[0][0]; // Most frequent failing criterion
      } else {
        sFailures[sKey] = 'Sin hallazgos';
      }
    });

    // Area rankings
    const areaRankingList: AreaCompliance[] = areas.map(area => {
      const data = areaMap[area];
      return {
        area,
        average: data.count > 0 ? Math.round(data.scoreSum / data.count) : 0,
        totalAudits: data.count,
        totalPlanes: data.planesCount,
      };
    });

    // Sort by compliance score (descending), secondary key is audit count
    // Areas with no audits get score 0 and are pushed down
    areaRankingList.sort((a, b) => {
      if (a.totalAudits === 0 && b.totalAudits > 0) return 1;
      if (b.totalAudits === 0 && a.totalAudits > 0) return -1;
      if (a.totalAudits === 0 && b.totalAudits === 0) return a.area.localeCompare(b.area);
      return b.average - a.average;
    });

    return {
      globalScore,
      totalAudits,
      sScores,
      sFailures,
      areaRanking: areaRankingList,
    };
  }, [audits]);

  // Compute dynamic SVG path for global score gauge
  // Semi-circle gauge (180 degrees)
  const scoreAngle = (stats.globalScore / 100) * 180;
  // Convert angle to circle coordinates
  const radius = 90;
  const cx = 120;
  const cy = 110;
  // Theoretical path for gauge background: from (30, 110) arc over top to (210, 110)
  // Path for value arc: starts at x1=30, y1=110, goes to target angle
  const targetRad = Math.PI - (scoreAngle * Math.PI) / 180;
  const targetX = cx + radius * Math.cos(targetRad);
  const targetY = cy - radius * Math.sin(targetRad);
  
  // Angle arc string (handling 0 and 100 cases gracefully)
  const valueArcPath = `M 30 110 A 90 90 0 0 1 ${targetX} ${targetY}`;

  // Monthly stats mapping for chart based on selected area
  const chartData = useMemo(() => {
    // If 'Todas' is selected, calculate average score per month
    if (selectedChartArea === 'Todas') {
      return MONTHLY_DATA.map(d => {
        const values = Object.entries(d)
          .filter(([key]) => key !== 'month')
          .map(([_, v]) => v as number);
        const avg = Math.round(values.reduce((sum, current) => sum + current, 0) / values.length);
        return { month: d.month, value: avg };
      });
    }

    // Otherwise, retrieve area specifically.
    // Convert friendly name e.g. "Rack 1" -> key "Rack1" (re-moving space to match defaultData keys)
    const dataKey = selectedChartArea.replace(/\s+/g, '') as keyof typeof MONTHLY_DATA[0];
    return MONTHLY_DATA.map(d => {
      const areaVal = d[dataKey];
      // fallback value if missing
      const val = typeof areaVal === 'number' ? areaVal : 75; 
      return { month: d.month, value: val };
    });
  }, [selectedChartArea]);

  // Weekly stats mapping for chart based on selected area
  const weeklyChartData = useMemo(() => {
    if (selectedChartArea === 'Todas') {
      return WEEKLY_DATA.map(d => {
        const values = Object.entries(d)
          .filter(([key]) => key !== 'week')
          .map(([_, v]) => v as number);
        const avg = Math.round(values.reduce((sum, current) => sum + current, 0) / values.length);
        return { week: d.week, value: avg };
      });
    }

    const dataKey = selectedChartArea.replace(/\s+/g, '') as keyof typeof WEEKLY_DATA[0];
    return WEEKLY_DATA.map(d => {
      const areaVal = d[dataKey];
      const val = typeof areaVal === 'number' ? areaVal : 75; 
      return { week: d.week, value: val };
    });
  }, [selectedChartArea]);

  // SVG dimensions for trend chart
  const trendXMax = 500;
  const trendYMax = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Calculate points for the trend chart
  const trendPoints = useMemo(() => {
    const records = chartData.length;
    const widthSegment = (trendXMax - paddingLeft - paddingRight) / (records - 1);
    
    return chartData.map((item, idx) => {
      const x = paddingLeft + idx * widthSegment;
      // standard range 0 to 100
      // 100% maps to Y = paddingTop
      // 0% maps to Y = trendYMax - paddingBottom
      const yMultiplier = (trendYMax - paddingTop - paddingBottom) / 100;
      const y = trendYMax - paddingBottom - item.value * yMultiplier;
      return { x, y, label: item.month, value: item.value };
    });
  }, [chartData]);

  const pathD = trendPoints.reduce((acc, point, idx) => {
    return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Fill area under line path
  const fillD = trendPoints.length > 0 
    ? `${pathD} L ${trendPoints[trendPoints.length - 1].x} ${trendYMax - paddingBottom} L ${trendPoints[0].x} ${trendYMax - paddingBottom} Z` 
    : '';

  // Calculate points for the weekly trend chart
  const weeklyTrendPoints = useMemo(() => {
    const records = weeklyChartData.length;
    const widthSegment = (trendXMax - paddingLeft - paddingRight) / (records - 1);
    
    return weeklyChartData.map((item, idx) => {
      const x = paddingLeft + idx * widthSegment;
      const yMultiplier = (trendYMax - paddingTop - paddingBottom) / 100;
      const y = trendYMax - paddingBottom - item.value * yMultiplier;
      return { x, y, label: item.week, value: item.value };
    });
  }, [weeklyChartData]);

  const weeklyPathD = weeklyTrendPoints.reduce((acc, point, idx) => {
    return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Fill area under weekly line path
  const weeklyFillD = weeklyTrendPoints.length > 0 
    ? `${weeklyPathD} L ${weeklyTrendPoints[weeklyTrendPoints.length - 1].x} ${trendYMax - paddingBottom} L ${weeklyTrendPoints[0].x} ${trendYMax - paddingBottom} Z` 
    : '';


  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Title & Sub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Cedi Nejapa El Salvador</h2>
          <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
            Tablero de Auditorías 5S • Panel de Control Estadístico
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Periodo: <strong className="text-amber-400">Año 2026</strong></span>
        </div>
      </div>

      {/* Global compliance indicator (Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Score Semicircle Gauge card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800/80 p-6 flex flex-col items-center justify-center relative shadow-md col-span-1 min-h-[300px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 absolute top-4">
            🔍 Score Global • Cedi El Salvador
          </h3>
          
          <div className="w-[240px] h-[130px] flex justify-center items-center mt-6">
            <svg className="w-full h-full" viewBox="0 0 240 140">
              <defs>
                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id="gold-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Background Arc */}
              <path 
                d="M 30 110 A 90 90 0 0 1 210 110" 
                fill="none" 
                stroke="#27272a" 
                strokeWidth="18" 
                strokeLinecap="round"
              />
              {/* Value Arc Accent */}
              {stats.globalScore > 0 && (
                <path 
                  d={valueArcPath} 
                  fill="none" 
                  stroke="url(#gold-grad)" 
                  strokeWidth="18" 
                  strokeLinecap="round"
                  filter="url(#gold-glow)"
                  className="transition-all duration-1000 ease-out"
                />
              )}
              {/* Score text */}
              <text 
                x="120" 
                y="105" 
                textAnchor="middle" 
                className="fill-zinc-100 text-4xl font-extrabold font-sans"
              >
                {stats.globalScore}%
              </text>
              <text 
                x="120" 
                y="125" 
                textAnchor="middle" 
                className="fill-zinc-400 text-[10px] font-bold tracking-widest uppercase"
              >
                Cumplimiento Promedio
              </text>
            </svg>
          </div>
          
          <div className="text-center text-xs text-zinc-400 font-medium z-10">
            Basado en <span className="font-bold text-amber-400">{stats.totalAudits}</span> auditorías aplicadas en todas las áreas.
          </div>
        </div>

        {/* Dynamic Comparative Compliance Chart monthly */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800/80 p-5 shadow-md col-span-1 flex flex-col justify-between min-h-[300px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Evolución de Cumplimiento Mensual
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">Desempeño acumulado en el semestre.</p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 self-start sm:self-center">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedChartArea}
                onChange={(e) => setSelectedChartArea(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none border-none py-0.5 cursor-pointer font-medium"
              >
                <option value="Todas" className="bg-zinc-900 text-zinc-200">Todas las Áreas</option>
                <option value="Rack 1" className="bg-zinc-900 text-zinc-200">Rack 1</option>
                <option value="Rack 2" className="bg-zinc-900 text-zinc-200">Rack 2</option>
                <option value="Rack 3" className="bg-zinc-900 text-zinc-200">Rack 3</option>
                <option value="Grifería" className="bg-zinc-900 text-zinc-200">Grifería</option>
                <option value="Loza y Muebles" className="bg-zinc-900 text-zinc-200">Loza y Muebles</option>
                <option value="Recepción" className="bg-zinc-900 text-zinc-200">Recepción</option>
                <option value="Pasillo 1" className="bg-zinc-900 text-zinc-200">Pasillo 1</option>
              </select>
            </div>
          </div>

          {/* SVG Trend Line Area and points */}
          <div className="w-full relative h-[140px] mt-2">
            <svg className="w-full h-full" viewBox={`0 0 ${trendXMax} ${trendYMax}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[25, 50, 75, 100].map((level) => {
                const yMultiplier = (trendYMax - paddingTop - paddingBottom) / 100;
                const y = trendYMax - paddingBottom - level * yMultiplier;
                return (
                  <g key={level}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={trendXMax - paddingRight} 
                      y2={y} 
                      stroke="#27272a" 
                      strokeWidth="1" 
                      strokeDasharray="4,4"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3} 
                      className="fill-zinc-500 font-mono text-[9px]" 
                      textAnchor="end"
                    >
                      {level}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {fillD && <path d={fillD} fill="url(#chart-fill-grad)" />}

              {/* Main Line */}
              {pathD && (
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#d97706" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points and Labels */}
              {trendPoints.map((pt, index) => (
                <g key={index} className="group cursor-pointer">
                  {/* Point Circle */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill="#18181b" 
                    stroke="#fbbf24" 
                    strokeWidth="2.5"
                  />
                  {/* Outer ripple glow */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="8" 
                    fill="#fbbf24" 
                    fillOpacity="0.15" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Score Label above point */}
                  <text 
                    x={pt.x} 
                    y={pt.y - 10} 
                    className="fill-amber-400 font-bold font-sans text-[10px]" 
                    textAnchor="middle"
                  >
                    {pt.value}%
                  </text>
                  {/* Month Label below chart */}
                  <text 
                    x={pt.x} 
                    y={trendYMax - 10} 
                    className="fill-zinc-400 font-medium font-sans text-[10px]" 
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="text-[10px] text-zinc-500 text-center font-mono mt-1">
            Filtro: <strong className="text-zinc-400">{selectedChartArea}</strong>
          </div>
        </div>

        {/* Dynamic Comparative Compliance Chart weekly */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800/80 p-5 shadow-md col-span-1 flex flex-col justify-between min-h-[300px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Evolución de Cumplimiento Semanal
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">Progreso continuo en las últimas 6 semanas.</p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 self-start sm:self-center">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedChartArea}
                onChange={(e) => setSelectedChartArea(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none border-none py-0.5 cursor-pointer font-medium"
              >
                <option value="Todas" className="bg-zinc-900 text-zinc-200">Todas las Áreas</option>
                <option value="Rack 1" className="bg-zinc-900 text-zinc-200">Rack 1</option>
                <option value="Rack 2" className="bg-zinc-900 text-zinc-200">Rack 2</option>
                <option value="Rack 3" className="bg-zinc-900 text-zinc-200">Rack 3</option>
                <option value="Grifería" className="bg-zinc-900 text-zinc-200">Grifería</option>
                <option value="Loza y Muebles" className="bg-zinc-900 text-zinc-200">Loza y Muebles</option>
                <option value="Recepción" className="bg-zinc-900 text-zinc-200">Recepción</option>
                <option value="Pasillo 1" className="bg-zinc-900 text-zinc-200">Pasillo 1</option>
              </select>
            </div>
          </div>

          {/* SVG Trend Line Area and points */}
          <div className="w-full relative h-[140px] mt-2">
            <svg className="w-full h-full" viewBox={`0 0 ${trendXMax} ${trendYMax}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="weekly-chart-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[25, 50, 75, 100].map((level) => {
                const yMultiplier = (trendYMax - paddingTop - paddingBottom) / 100;
                const y = trendYMax - paddingBottom - level * yMultiplier;
                return (
                  <g key={level}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={trendXMax - paddingRight} 
                      y2={y} 
                      stroke="#27272a" 
                      strokeWidth="1" 
                      strokeDasharray="4,4"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3} 
                      className="fill-zinc-500 font-mono text-[9px]" 
                      textAnchor="end"
                    >
                      {level}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {weeklyFillD && <path d={weeklyFillD} fill="url(#weekly-chart-fill-grad)" />}

              {/* Main Line */}
              {weeklyPathD && (
                <path 
                  d={weeklyPathD} 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points and Labels */}
              {weeklyTrendPoints.map((pt, index) => (
                <g key={index} className="group cursor-pointer">
                  {/* Point Circle */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill="#18181b" 
                    stroke="#fbbf24" 
                    strokeWidth="2.5"
                  />
                  {/* Outer ripple glow */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="8" 
                    fill="#fbbf24" 
                    fillOpacity="0.15" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Score Label above point */}
                  <text 
                    x={pt.x} 
                    y={pt.y - 10} 
                    className="fill-amber-400 font-bold font-sans text-[10px]" 
                    textAnchor="middle"
                  >
                    {pt.value}%
                  </text>
                  {/* Week Label below chart */}
                  <text 
                    x={pt.x} 
                    y={trendYMax - 10} 
                    className="fill-zinc-400 font-medium font-sans text-[10px]" 
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="text-[10px] text-zinc-500 text-center font-mono mt-1">
            Filtro: <strong className="text-zinc-400">{selectedChartArea}</strong>
          </div>
        </div>

      </div>

      {/* 5S Cards grid */}
      <div>
        <h3 className="text-zinc-300 font-bold text-sm tracking-wide mb-3 flex items-center gap-1.5 uppercase">
          📋 Desglose de Incidencias e Indicador por S
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sSteps.map((s, idx) => {
            const score = stats.sScores[s.sType] ?? 0;
            const biggestIssue = stats.sFailures[s.sType] || 'Sin hallazgos';
            
            // color mapping based on tier
            let colorClass = 'text-emerald-400';
            let progressColor = 'bg-emerald-500';
            if (score < 70) {
              colorClass = 'text-rose-400';
              progressColor = 'bg-rose-500';
            } else if (score < 90) {
              colorClass = 'text-amber-400';
              progressColor = 'bg-amber-500';
            }

            return (
              <div 
                key={s.id} 
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow transition-all duration-300 hover:border-amber-500/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500">{s.sType}</span>
                    <span className={`text-lg font-black ${colorClass}`}>{score}%</span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 mb-1" title={s.title}>
                    {s.title}
                  </h4>
                  
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-4">
                    Alerta Máxima / Incidencia:
                  </p>
                  
                  <div className="flex items-start gap-1 pb-2 mt-1">
                    {biggestIssue !== 'Sin hallazgos' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <p className={`text-[11px] leading-tight font-medium line-clamp-2 ${biggestIssue !== 'Sin hallazgos' ? 'text-rose-300' : 'text-emerald-400'}`}>
                      {biggestIssue}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${progressColor}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard/Ranking of Areas */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800/80 p-5 shadow-md">
        <h3 className="text-zinc-200 font-bold text-sm tracking-wide mb-4 flex items-center gap-1.5 uppercase">
          <Award className="w-4 h-4 text-amber-400" />
          Ranking General de Desempeño por Áreas (Disciplina 5S)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold text-[11px] uppercase">
                <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                <th className="py-2.5 px-4">ÁREA</th>
                <th className="py-2.5 px-4 text-center">PROMEDIO HISTÓRICO</th>
                <th className="py-2.5 px-4 text-center">AUDITORÍAS REALIZADAS</th>
                <th className="py-2.5 px-4 text-center">PLANES DE ACCIÓN CORRECTIVA</th>
                <th className="py-2.5 px-4 text-center">ESTADO DE COMPLIANCE</th>
              </tr>
            </thead>
            <tbody>
              {stats.areaRanking.map((item, idx) => {
                const noAudit = item.totalAudits === 0;
                let badgeClass = 'bg-zinc-800 text-zinc-400';
                let rowBg = 'border-b border-zinc-800/50 hover:bg-zinc-800/20';

                // Golden touch on top items
                if (idx === 0 && !noAudit) {
                  rowBg = 'border-b border-zinc-800/90 bg-amber-500/5 hover:bg-amber-500/10 font-medium';
                }

                if (noAudit) {
                  badgeClass = 'bg-zinc-950 text-zinc-600 border border-zinc-900';
                } else if (item.average >= 90) {
                  badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold';
                } else if (item.average >= 75) {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                } else {
                  badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                }

                return (
                  <tr key={item.area} className={`transition-colors duration-150 ${rowBg}`}>
                    <td className="py-3 px-3 text-center font-bold">
                      {idx === 0 && !noAudit ? (
                        <span className="text-amber-400 font-black">🥇</span>
                      ) : idx === 1 && !noAudit ? (
                        <span className="text-zinc-300 font-black">🥈</span>
                      ) : idx === 2 && !noAudit ? (
                        <span className="text-amber-700 font-black">🥉</span>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[11px]">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-100 font-semibold">{item.area}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-zinc-200 font-bold text-sm">
                        {noAudit ? '—' : `${item.average}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-400">
                      {item.totalAudits} audits
                    </td>
                    <td className="py-3 px-4 text-center">
                      {noAudit ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${item.totalPlanes > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.totalPlanes} planes
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded text-[10px] uppercase tracking-wider ${badgeClass}`}>
                        {noAudit ? 'Sin Auditorías' : item.average >= 90 ? 'Excelente' : item.average >= 75 ? 'Regular' : 'Crítico'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual history of audits that got resolved */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800/80 p-5 shadow-md flex flex-col gap-4">
        <h3 className="text-zinc-200 font-bold text-sm tracking-wide flex items-center gap-1.5 uppercase">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Auditorías Solventadas con Código de Resolución ({audits.filter(a => a.isResolved).length})
        </h3>

        {audits.filter(a => a.isResolved).length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs bg-zinc-950/40 rounded-xl border border-zinc-850/60 font-medium">
            No se han registrado cierres de incidencias mediante código de resolución todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audits.filter(a => a.isResolved).map(audit => (
              <div key={audit.id} className="bg-zinc-950 border border-zinc-850/80 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">{audit.resolutionCode || 'RES-COMPLETA'}</span>
                    <h4 className="text-zinc-100 font-black text-sm mt-0.5">{audit.area}</h4>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
                    Satisfecho (100% KPI)
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-900 text-[11px] text-zinc-400 leading-normal italic font-medium">
                  "{audit.resolutionComments || 'Resuelto de forma conforme.'}"
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px] text-zinc-500">
                  <span>Por: <strong className="text-zinc-400 font-semibold">{audit.assignedTo.name}</strong></span>
                  <span>Cerrada: <strong className="text-zinc-400 font-mono">{audit.resolvedAt ? new Date(audit.resolvedAt).toLocaleDateString() : 'Recientemente'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
