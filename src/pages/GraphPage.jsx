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

function CustomTooltip({ active, payload, label, color, name }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>
        {payload[0].value?.toFixed(1)}
      </p>
      <p className="text-[11px] text-gray-400">{name}</p>
    </div>
  )
}

export default function GraphPage({ symptoms, records, treatmentDates = [] }) {
  const [selectedId, setSelectedId] = useState(symptoms[0]?.id || null)
  const [range, setRange] = useState(90)

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

  // 表示期間内の施術日を chartData の date ラベルで引く
  const visibleTreatments = treatmentDates
    .filter(d => !cutoff || d >= cutoff)
    .map(d => formatDateShort(d))
    .filter(label => chartData.some(c => c.date === label))

  const values = chartData.map(d => d.value).filter(v => v !== null)
  const avg = values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null
  const max = values.length ? Math.max(...values) : null
  const min = values.length ? Math.min(...values) : null
  const latest = values[values.length - 1] ?? null
  const prev = values[values.length - 2] ?? null
  const trend = latest !== null && prev !== null ? Math.round((latest - prev) * 10) / 10 : null

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* header */}
      <div
        className="px-4 pt-6 pb-5 sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <h1 className="text-white font-bold text-xl">推移グラフ</h1>
        <p className="text-white/60 text-xs mt-0.5">症状の経過を確認する</p>
      </div>

      {/* symptom chips */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">症状を選択</p>
        <div className="flex flex-wrap gap-2">
          {symptoms.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-sm"
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
          {/* range tabs */}
          <div className="px-4 pb-3">
            <div className="flex gap-1.5 bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setRange(opt.days)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={
                    range === opt.days
                      ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }
                      : { color: '#9ca3af' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* stats row */}
          <div className="px-4 mb-3 grid grid-cols-4 gap-2">
            {[
              { label: '最新値', value: latest?.toFixed(1), highlight: true },
              { label: '平均', value: avg?.toFixed(1) },
              { label: '最大', value: max?.toFixed(1) },
              { label: '最小', value: min?.toFixed(1) },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-2.5 shadow-sm border text-center"
                style={highlight && value ? { borderColor: symptom.color + '40', backgroundColor: symptom.color + '08' } : { borderColor: '#f3f4f6' }}
              >
                <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                <p
                  className="text-xl font-black leading-none mt-0.5"
                  style={{ color: highlight && value ? symptom.color : '#374151' }}
                >
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>

          {/* trend indicator */}
          {trend !== null && (
            <div className="px-4 mb-3">
              <div
                className="rounded-2xl px-4 py-2.5 flex items-center gap-2 bg-white shadow-sm border border-gray-100"
              >
                <span className="text-sm font-semibold text-gray-600">前回比</span>
                <span
                  className="text-lg font-black"
                  style={{ color: trend > 0 ? '#ef4444' : trend < 0 ? '#22c55e' : '#9ca3af' }}
                >
                  {trend > 0 ? `▲ +${trend.toFixed(1)}` : trend < 0 ? `▼ ${trend.toFixed(1)}` : '→ 変化なし'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {trend > 0 ? '前回より悪化' : trend < 0 ? '前回より改善' : ''}
                </span>
              </div>
            </div>
          )}

          {/* chart */}
          <div className="px-4 mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: symptom.color }} />
                <p className="text-sm font-semibold text-gray-700">{symptom.name}</p>
                <span className="text-xs text-gray-400 ml-auto">VAS 0–10</span>
                {visibleTreatments.length > 0 && (
                  <span className="text-[11px] text-purple-500 flex items-center gap-1 w-full">
                    <span className="inline-block w-4 border-t-2 border-dashed border-purple-400" />
                    施術日
                  </span>
                )}
              </div>

              {chartData.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-gray-300">
                  <span className="text-4xl mb-2">📉</span>
                  <span className="text-sm">この期間にデータがありません</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${symptom.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={symptom.color} stopOpacity={0.25} />
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
                        strokeOpacity={0.5}
                        strokeWidth={1.5}
                      />
                    )}
                    {visibleTreatments.map(label => (
                      <ReferenceLine
                        key={label}
                        x={label}
                        stroke="#667eea"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        label={{ value: '施', position: 'top', fontSize: 10, fill: '#667eea' }}
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

          {/* record list */}
          {chartData.length > 0 && (
            <div className="px-4 mb-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <p className="text-xs font-semibold text-gray-500 px-4 py-3 border-b border-gray-50 uppercase tracking-wide">
                  記録一覧
                </p>
                {[...chartData].reverse().map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{d.fullDate}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(d.value / 10) * 100}%`,
                            backgroundColor: symptom.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-black w-8 text-right tabular-nums"
                        style={{ color: symptom.color }}
                      >
                        {d.value?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {symptoms.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-20">
          <span className="text-5xl">⚙️</span>
          <span className="text-sm">設定タブで症状を追加してください</span>
        </div>
      )}
    </div>
  )
}
