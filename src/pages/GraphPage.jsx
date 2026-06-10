import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const RANGE_OPTIONS = [
  { label: '1ヶ月', days: 30 },
  { label: '3ヶ月', days: 90 },
  { label: '6ヶ月', days: 180 },
  { label: '全期間', days: 0 },
]

function trendColor(v) {
  return v > 0 ? '#ef4444' : v < 0 ? '#22c55e' : '#9ca3af'
}
function trendLabel(v) {
  return v > 0 ? `▲+${v.toFixed(1)}` : v < 0 ? `▼${v.toFixed(1)}` : '→±0'
}

function CustomTooltip({ active, payload, label, color, name }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{payload[0].value?.toFixed(1)}</p>
      <p className="text-[11px] text-gray-400">{name}</p>
    </div>
  )
}

export default function GraphPage({ symptoms, records, treatmentDates = [] }) {
  const [selectedId, setSelectedId] = useState(symptoms[0]?.id || null)
  const [range, setRange] = useState(90)
  const [showList, setShowList] = useState(false)

  const symptom = symptoms.find(s => s.id === selectedId)

  const cutoff = range === 0 ? null : (() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return d.toISOString().slice(0, 10)
  })()

  const chartData = records
    .filter(r => {
      if (cutoff && r.date < cutoff) return false
      return r.entries.some(e => e.symptomId === selectedId)
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({
      date: formatDateShort(r.date),
      fullDate: r.date,
      value: r.entries.find(e => e.symptomId === selectedId)?.value ?? null,
    }))

  const visibleTreatments = treatmentDates
    .filter(d => !cutoff || d >= cutoff)
    .map(d => formatDateShort(d))
    .filter(label => chartData.some(c => c.date === label))

  const allValues = records
    .filter(r => r.entries.some(e => e.symptomId === selectedId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => r.entries.find(e => e.symptomId === selectedId)?.value ?? null)
    .filter(v => v !== null)

  const values = chartData.map(d => d.value).filter(v => v !== null)
  const avg = values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null
  const max = values.length ? Math.max(...values) : null
  const min = values.length ? Math.min(...values) : null
  const latest = values[values.length - 1] ?? null
  const prev = values[values.length - 2] ?? null
  const trend = latest !== null && prev !== null ? Math.round((latest - prev) * 10) / 10 : null
  const firstVal = allValues[0] ?? null
  const firstTrend = latest !== null && firstVal !== null && allValues.length > 1
    ? Math.round((latest - firstVal) * 10) / 10
    : null

  const treatmentCount = treatmentDates.length
  const firstTreatment = treatmentCount > 0 ? [...treatmentDates].sort()[0] : null
  const treatmentDays = firstTreatment
    ? Math.floor((new Date() - new Date(firstTreatment + 'T00:00:00')) / 86400000)
    : null

  if (symptoms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="text-sm">設定タブで症状を追加してください</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50" style={{ height: '100%' }}>

      {/* ── 症状チップ（横スクロール） ── */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {symptoms.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
              style={
                s.id === selectedId
                  ? { backgroundColor: s.color, color: 'white', boxShadow: `0 2px 8px ${s.color}60` }
                  : { backgroundColor: 'white', color: '#6b7280', border: '1.5px solid #f3f4f6' }
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {symptom && (
        <>
          {/* ── 期間タブ ── */}
          <div className="flex-shrink-0 px-3 pb-2">
            <div className="flex gap-1 bg-white rounded-xl p-0.5 shadow-sm border border-gray-100">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setRange(opt.days)}
                  className="flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all"
                  style={
                    range === opt.days
                      ? { background: '#3C2E1D', color: 'white' }
                      : { color: '#9ca3af' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 統計 4ボックス ── */}
          <div className="flex-shrink-0 px-3 pb-2 grid grid-cols-4 gap-2">
            {[
              { label: '最新値', value: latest?.toFixed(1), hi: true },
              { label: '平均',   value: avg?.toFixed(1) },
              { label: '最大',   value: max?.toFixed(1) },
              { label: '最小',   value: min?.toFixed(1) },
            ].map(({ label, value, hi }) => (
              <div
                key={label}
                className="bg-white rounded-xl py-2 px-1 text-center shadow-sm border"
                style={hi && value
                  ? { borderColor: symptom.color + '40', backgroundColor: symptom.color + '08' }
                  : { borderColor: '#f3f4f6' }}
              >
                <p className="text-[9px] text-gray-400 font-medium leading-none mb-1">{label}</p>
                <p className="text-base font-black leading-none"
                  style={{ color: hi && value ? symptom.color : '#374151' }}>
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>

          {/* ── 施術統計 ── */}
          {treatmentCount > 0 && (
            <div className="flex-shrink-0 px-3 pb-2 flex gap-2">
              <div className="flex-1 bg-white rounded-xl py-2 px-3 shadow-sm border border-gray-100 text-center">
                <p className="text-[9px] text-gray-400 font-medium leading-none mb-1">施術回数</p>
                <p className="text-base font-black leading-none text-gray-800">
                  {treatmentCount}<span className="text-[11px] font-semibold text-gray-500 ml-0.5">回</span>
                </p>
              </div>
              {treatmentDays !== null && (
                <div className="flex-1 bg-white rounded-xl py-2 px-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-[9px] text-gray-400 font-medium leading-none mb-1">通院期間</p>
                  <p className="text-base font-black leading-none text-gray-800">
                    {treatmentDays}<span className="text-[11px] font-semibold text-gray-500 ml-0.5">日</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── 前回比 / 初回比 ── */}
          {(trend !== null || firstTrend !== null) && (
            <div className="flex-shrink-0 px-3 pb-2 flex gap-2">
              {trend !== null && (
                <div className="flex-1 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">前回比</span>
                  <span className="text-sm font-black" style={{ color: trendColor(trend) }}>
                    {trendLabel(trend)}
                  </span>
                  <span className="text-[9px] text-gray-400 ml-auto whitespace-nowrap">
                    {trend > 0 ? '悪化' : trend < 0 ? '改善' : ''}
                  </span>
                </div>
              )}
              {firstTrend !== null && (
                <div className="flex-1 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">初回比</span>
                  <span className="text-sm font-black" style={{ color: trendColor(firstTrend) }}>
                    {trendLabel(firstTrend)}
                  </span>
                  <span className="text-[9px] text-gray-400 ml-auto whitespace-nowrap">
                    {firstTrend > 0 ? '悪化' : firstTrend < 0 ? '改善' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── グラフ（残りを全部使う） ── */}
          <div className="flex-1 min-h-0 px-3 pb-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-3">

              {/* 凡例 */}
              <div className="flex-shrink-0 flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: symptom.color }} />
                  <span className="text-xs font-semibold text-gray-700">{symptom.name}</span>
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">VAS 0–10</span>
                {avg !== null && (
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: symptom.color }}>
                    <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: symptom.color, opacity: 0.7 }} />
                    平均
                  </span>
                )}
                {visibleTreatments.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[#3C2E1D]">
                    <span className="inline-block w-3 border-t-2 border-dashed border-[#3C2E1D]" />
                    施術日
                  </span>
                )}
              </div>

              {/* チャート本体 */}
              <div className="flex-1 min-h-0">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <span className="text-sm">この期間にデータがありません</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${symptom.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={symptom.color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={symptom.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2.5, 5, 7.5, 10]}
                        tickFormatter={v => v.toFixed(1)}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip color={symptom.color} name={symptom.name} />} />
                      {avg !== null && (
                        <ReferenceLine
                          y={avg}
                          stroke={symptom.color}
                          strokeDasharray="4 3"
                          strokeOpacity={0.75}
                          strokeWidth={1.5}
                          label={{ value: `平均 ${avg.toFixed(1)}`, position: 'insideTopRight', fontSize: 10, fill: symptom.color, opacity: 0.85 }}
                        />
                      )}
                      {visibleTreatments.map(label => (
                        <ReferenceLine
                          key={label}
                          x={label}
                          stroke="#3C2E1D"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          label={{ value: '施', position: 'top', fontSize: 10, fill: '#3C2E1D' }}
                        />
                      ))}
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={symptom.color}
                        strokeWidth={2.5}
                        fill={`url(#grad-${symptom.id})`}
                        dot={{ fill: symptom.color, r: 3.5, strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* ── 記録一覧（折りたたみ） ── */}
          {chartData.length > 0 && (
            <div className="flex-shrink-0 px-3 pb-3">
              <button
                onClick={() => setShowList(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-sm font-semibold text-gray-500"
              >
                <span>記録一覧（{chartData.length}件）</span>
                <span className="text-[11px] text-gray-400">{showList ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>
              {showList && (
                <div className="mt-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto max-h-44">
                  {[...chartData].reverse().map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{d.fullDate}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(d.value / 10) * 100}%`, backgroundColor: symptom.color }} />
                        </div>
                        <span className="text-sm font-black w-8 text-right tabular-nums" style={{ color: symptom.color }}>
                          {d.value?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
