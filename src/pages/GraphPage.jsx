import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine
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

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩',
                 '⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳']

function trendColor(v) {
  return v > 0 ? '#ef4444' : v < 0 ? '#22c55e' : '#9ca3af'
}
function trendLabel(v) {
  return v > 0 ? `▲+${v.toFixed(1)}` : v < 0 ? `▼${v.toFixed(1)}` : '→±0'
}

export default function GraphPage({ symptoms, records, treatmentDates = [] }) {
  const [selectedId, setSelectedId] = useState(symptoms[0]?.id || null)
  const [range, setRange] = useState(90)
  const [showList, setShowList] = useState(false)
  const [expandedNote, setExpandedNote] = useState(null)

  const symptom = symptoms.find(s => s.id === selectedId)

  const cutoff = range === 0 ? null : (() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return d.toISOString().slice(0, 10)
  })()

  // ── 症状スコアと施術日を完全分離して統合 ──
  const symptomDates = records
    .filter(r => (!cutoff || r.date >= cutoff) && r.entries.some(e => e.symptomId === selectedId))
    .map(r => r.date)

  const treatmentDatesInRange = [...treatmentDates].filter(d => !cutoff || d >= cutoff).sort()

  // 統合タイムライン（症状データのない施術日は value: null）
  const allDates = [...new Set([...symptomDates, ...treatmentDatesInRange])].sort()

  const chartData = allDates.map(d => {
    const rec = records.find(r => r.date === d)
    return {
      date: formatDateShort(d),
      fullDate: d,
      value: rec?.entries.find(e => e.symptomId === selectedId)?.value ?? null,
      note: rec?.note || null,
    }
  })

  // 症状スコアがある行のみ（記録一覧・統計用）
  const symptomData = chartData.filter(d => d.value !== null)

  // 施術日マーカー：全施術日を時系列で番号付け、範囲内のものを表示
  const sortedAllTreatments = [...treatmentDates].sort()
  const visibleTreatmentMarkers = treatmentDatesInRange.map(d => ({
    xLabel: formatDateShort(d),
    num: CIRCLED[sortedAllTreatments.indexOf(d)] ?? `(${sortedAllTreatments.indexOf(d) + 1})`,
  }))

  // ── 統計 ──
  const allValues = records
    .filter(r => r.entries.some(e => e.symptomId === selectedId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => r.entries.find(e => e.symptomId === selectedId)?.value ?? null)
    .filter(v => v !== null)

  const values = symptomData.map(d => d.value)
  const avg = values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null
  const latest = values[values.length - 1] ?? null
  const firstVal = allValues[0] ?? null
  const firstTrend = latest !== null && firstVal !== null && allValues.length > 1
    ? Math.round((latest - firstVal) * 10) / 10
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

          {/* ── 初回比 ── */}
          {firstTrend !== null && (
            <div className="flex-shrink-0 px-3 pb-2">
              <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex items-center justify-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">初回比</span>
                <span className="text-sm font-black" style={{ color: trendColor(firstTrend) }}>
                  {trendLabel(firstTrend)}
                </span>
                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                  {firstTrend > 0 ? '悪化' : firstTrend < 0 ? '改善' : ''}
                </span>
              </div>
            </div>
          )}

          {/* ── グラフ（リスト非表示時のみ） ── */}
          {!showList && <div className="flex-1 min-h-0 px-3 pb-2">
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
                {visibleTreatmentMarkers.length > 0 && (
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
                    <AreaChart data={chartData} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
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
                      {/* 施術日マーカー：症状データと完全分離、①②③ 番号付き */}
                      {visibleTreatmentMarkers.map(({ xLabel, num }) => (
                        <ReferenceLine
                          key={xLabel}
                          x={xLabel}
                          stroke="#3C2E1D"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          strokeOpacity={0.7}
                          label={({ viewBox }) => (
                            <g>
                              <rect x={viewBox.x - 9} y={viewBox.y + 2} width={18} height={15} fill="white" rx={3} />
                              <text x={viewBox.x} y={viewBox.y + 13} textAnchor="middle" fontSize={11} fill="#3C2E1D" fontWeight="bold">
                                {num}
                              </text>
                            </g>
                          )}
                        />
                      ))}
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={symptom.color}
                        strokeWidth={2.5}
                        fill={`url(#grad-${symptom.id})`}
                        connectNulls={true}
                        dot={(props) => {
                          if (props.value == null) return null
                          return <circle key={`d-${props.index}`} cx={props.cx} cy={props.cy} r={3.5} fill={symptom.color} stroke="white" strokeWidth={2} />
                        }}
                        activeDot={(props) => {
                          if (props.value == null) return null
                          return <circle key={`ad-${props.index}`} cx={props.cx} cy={props.cy} r={6} fill={symptom.color} stroke="white" strokeWidth={2} />
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>}

          {/* ── 記録一覧（症状スコアがある日のみ） ── */}
          {symptomData.length > 0 && (
            <div className={showList ? 'flex-1 min-h-0 px-3 pb-3 flex flex-col' : 'flex-shrink-0 px-3 pb-3'}>
              <button
                onClick={() => setShowList(v => !v)}
                className="flex-shrink-0 w-full flex items-center justify-between px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-sm font-semibold text-gray-500"
              >
                <span>記録一覧（{symptomData.length}件）</span>
                <span className="text-[11px] text-gray-400">{showList ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>
              {showList && (
                <div className="flex-1 min-h-0 mt-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto">
                  {[...symptomData].reverse().map((d, i) => {
                    const isExpanded = expandedNote === d.fullDate
                    return (
                      <div key={i} className="border-b border-gray-50 last:border-0">
                        <div
                          className="flex items-center justify-between px-4 py-2.5"
                          onClick={() => d.note && setExpandedNote(isExpanded ? null : d.fullDate)}
                          style={{ cursor: d.note ? 'pointer' : 'default' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{d.fullDate}</span>
                            {d.note && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: isExpanded ? '#3C2E1D18' : '#f3f4f6', color: isExpanded ? '#3C2E1D' : '#9ca3af' }}>
                                メモ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(d.value / 10) * 100}%`, backgroundColor: symptom.color }} />
                            </div>
                            <span className="text-sm font-black w-8 text-right tabular-nums" style={{ color: symptom.color }}>
                              {d.value?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {d.note && isExpanded && (
                          <div className="px-4 pb-3 -mt-0.5">
                            <p className="text-xs text-gray-500 leading-relaxed rounded-xl px-3 py-2"
                              style={{ background: '#fdf8f3', color: '#7a5c42' }}>
                              {d.note}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
