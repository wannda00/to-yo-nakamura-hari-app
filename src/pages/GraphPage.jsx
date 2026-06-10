import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine
} from 'recharts'

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function RankingCard({ ranking, range }) {
  const rangeLabel = RANGE_OPTIONS.find(o => o.days === range)?.label ?? '全期間'
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-3 pb-4">
      <p className="text-xs font-bold text-gray-500 mb-2.5">
        改善ランキング
        <span className="ml-1.5 font-normal text-gray-400">（{rangeLabel}）</span>
      </p>
      {ranking.map((item, i) => (
        <div key={item.symptom.id} className="flex items-center gap-2 py-1.5">
          <span className="text-[11px] font-black w-5 text-right tabular-nums"
            style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c4e' : '#d1d5db' }}>
            {i + 1}
          </span>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.symptom.color }} />
          <span className="flex-1 text-sm text-gray-700 truncate">{item.symptom.name}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: trendColor(item.delta) }}>
            {trendLabel(item.delta)}
          </span>
          <span className="text-[10px] w-10 text-right" style={{ color: trendColor(item.delta) }}>
            {item.delta < 0 ? '改善' : item.delta > 0 ? '悪化' : '変化なし'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function GraphPage({ symptoms, records, treatmentDates = [], onGoToLog }) {
  const [selectedIds, setSelectedIds] = useState(() => {
    const first = symptoms[0]?.id
    return first ? new Set([first]) : new Set()
  })
  const [range, setRange] = useState(90)
  const [showList, setShowList] = useState(false)
  const [expandedNote, setExpandedNote] = useState(null)

  // Keep selectedIds in sync when symptoms list changes
  useEffect(() => {
    setSelectedIds(prev => {
      const valid = new Set(symptoms.map(s => s.id))
      const filtered = new Set([...prev].filter(id => valid.has(id)))
      if (filtered.size === 0 && symptoms.length > 0) return new Set([symptoms[0].id])
      return filtered.size === prev.size ? prev : filtered
    })
  }, [symptoms])

  function toggleSymptom(id) {
    setSelectedIds(prev => {
      if (prev.has(id) && prev.size === 1) return prev
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedSymptoms = symptoms.filter(s => selectedIds.has(s.id))
  const isSingle = selectedIds.size === 1
  const singleSymptom = isSingle ? selectedSymptoms[0] : null

  const cutoff = range === 0 ? null : (() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return localDateStr(d)
  })()

  const symptomDates = records
    .filter(r => (!cutoff || r.date >= cutoff) && r.entries.some(e => selectedIds.has(e.symptomId)))
    .map(r => r.date)

  const treatmentDatesInRange = [...treatmentDates].filter(d => !cutoff || d >= cutoff).sort()

  const allDates = [...new Set([...symptomDates, ...treatmentDatesInRange])].sort()

  const chartData = allDates.map(d => {
    const rec = records.find(r => r.date === d)
    const vals = {}
    selectedSymptoms.forEach(s => {
      vals[`v_${s.id}`] = rec?.entries.find(e => e.symptomId === s.id)?.value ?? null
    })
    return { date: formatDateShort(d), fullDate: d, note: rec?.note || null, ...vals }
  })

  // Dates where at least one selected symptom has a value
  const listData = chartData.filter(d => selectedSymptoms.some(s => d[`v_${s.id}`] !== null))

  // Single-symptom stats
  const singleStats = (() => {
    if (!isSingle || !singleSymptom) return null
    const rangeValues = listData.map(d => d[`v_${singleSymptom.id}`]).filter(v => v !== null)
    const allValues = records
      .filter(r => r.entries.some(e => e.symptomId === singleSymptom.id))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => r.entries.find(e => e.symptomId === singleSymptom.id)?.value ?? null)
      .filter(v => v !== null)
    const avg = rangeValues.length
      ? Math.round((rangeValues.reduce((s, v) => s + v, 0) / rangeValues.length) * 10) / 10
      : null
    const latest = rangeValues[rangeValues.length - 1] ?? null
    const firstVal = allValues[0] ?? null
    const firstTrend = latest !== null && firstVal !== null && allValues.length > 1
      ? Math.round((latest - firstVal) * 10) / 10
      : null
    return { avg, firstTrend }
  })()

  // Multi-symptom compact stats
  const multiStats = !isSingle ? selectedSymptoms.map(s => {
    const rangeValues = listData.map(d => d[`v_${s.id}`]).filter(v => v !== null)
    const allValues = records
      .filter(r => r.entries.some(e => e.symptomId === s.id))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => r.entries.find(e => e.symptomId === s.id)?.value ?? null)
      .filter(v => v !== null)
    const latest = rangeValues[rangeValues.length - 1] ?? null
    const firstVal = allValues[0] ?? null
    const firstTrend = latest !== null && firstVal !== null && allValues.length > 1
      ? Math.round((latest - firstVal) * 10) / 10
      : null
    return { symptom: s, latest, firstTrend }
  }) : null

  // Improvement ranking (all symptoms, current range, needs ≥2 records)
  const improvementRanking = symptoms
    .map(s => {
      const rangeRecs = records
        .filter(r => (!cutoff || r.date >= cutoff) && r.entries.some(e => e.symptomId === s.id))
        .sort((a, b) => a.date.localeCompare(b.date))
      const vals = rangeRecs.map(r => r.entries.find(e => e.symptomId === s.id)?.value).filter(v => v != null)
      if (vals.length < 2) return null
      const delta = Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10
      return { symptom: s, delta, startVal: vals[0], endVal: vals[vals.length - 1] }
    })
    .filter(Boolean)
    .sort((a, b) => a.delta - b.delta)

  const sortedAllTreatments = [...treatmentDates].sort()
  const visibleTreatmentMarkers = treatmentDatesInRange.map(d => ({
    xLabel: formatDateShort(d),
    num: CIRCLED[sortedAllTreatments.indexOf(d)] ?? `(${sortedAllTreatments.indexOf(d) + 1})`,
  }))

  if (symptoms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="text-sm">設定タブで症状を追加してください</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">

      {/* ── 症状チップ ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {symptoms.map(s => (
            <button
              key={s.id}
              onClick={() => toggleSymptom(s.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
              style={
                selectedIds.has(s.id)
                  ? { backgroundColor: s.color, color: 'white', boxShadow: `0 2px 8px ${s.color}60` }
                  : { backgroundColor: 'white', color: '#6b7280', border: '1.5px solid #f3f4f6' }
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 期間タブ ── */}
      <div className="px-3 pb-2">
        <div className="flex gap-1 bg-white rounded-xl p-0.5 shadow-sm border border-gray-100">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRange(opt.days)}
              className="flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all"
              style={range === opt.days ? { background: '#3C2E1D', color: 'white' } : { color: '#9ca3af' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 統計 ── */}
      {isSingle && singleStats?.firstTrend !== null && (
        <div className="px-3 pb-2">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 flex items-center justify-center gap-2">
            <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">初回比</span>
            <span className="text-sm font-black" style={{ color: trendColor(singleStats.firstTrend) }}>
              {trendLabel(singleStats.firstTrend)}
            </span>
            <span className="text-[9px] text-gray-400 whitespace-nowrap">
              {singleStats.firstTrend > 0 ? '悪化' : singleStats.firstTrend < 0 ? '改善' : ''}
            </span>
          </div>
        </div>
      )}
      {!isSingle && multiStats && (
        <div className="px-3 pb-2">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {multiStats.map(({ symptom: s, latest, firstTrend }) => (
              <span key={s.id} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="font-medium" style={{ color: '#6b7280' }}>{s.name}</span>
                {firstTrend !== null ? (
                  <span className="font-bold" style={{ color: trendColor(firstTrend) }}>{trendLabel(firstTrend)}</span>
                ) : latest !== null ? (
                  <span className="text-gray-400">{latest.toFixed(1)}</span>
                ) : (
                  <span className="text-gray-300">データなし</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── グラフ（大きく） ── */}
      <div className="px-3 pb-3" style={{ minHeight: 'calc(100svh - 260px)', height: 'calc(100svh - 260px)' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-3">
          {/* 凡例 */}
          <div className="flex-shrink-0 flex items-center gap-3 mb-2 flex-wrap">
            {selectedSymptoms.map(s => (
              <span key={s.id} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-semibold text-gray-700">{s.name}</span>
              </span>
            ))}
            <span className="text-[10px] text-gray-400 ml-auto">VAS 0–10</span>
            {isSingle && singleStats?.avg !== null && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: singleSymptom.color }}>
                <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: singleSymptom.color, opacity: 0.7 }} />
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
                    {selectedSymptoms.map(s => (
                      <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]} tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  {isSingle && singleStats?.avg !== null && (
                    <ReferenceLine y={singleStats.avg} stroke={singleSymptom.color} strokeDasharray="4 3" strokeOpacity={0.75} strokeWidth={1.5}
                      label={{ value: `平均 ${singleStats.avg.toFixed(1)}`, position: 'insideTopRight', fontSize: 10, fill: singleSymptom.color, opacity: 0.85 }} />
                  )}
                  {visibleTreatmentMarkers.map(({ xLabel, num }) => (
                    <ReferenceLine key={xLabel} x={xLabel} stroke="#3C2E1D" strokeWidth={1.5} strokeDasharray="3 3" strokeOpacity={0.7}
                      label={({ viewBox }) => (
                        <g>
                          <rect x={viewBox.x - 9} y={viewBox.y + 2} width={18} height={15} fill="white" rx={3} />
                          <text x={viewBox.x} y={viewBox.y + 13} textAnchor="middle" fontSize={11} fill="#3C2E1D" fontWeight="bold">{num}</text>
                        </g>
                      )} />
                  ))}
                  {selectedSymptoms.map(s => (
                    <Area key={s.id} type="monotone" dataKey={`v_${s.id}`} stroke={s.color} strokeWidth={2.5} fill={`url(#grad-${s.id})`} connectNulls={true}
                      dot={(props) => props.value == null ? null : <circle key={`d-${s.id}-${props.index}`} cx={props.cx} cy={props.cy} r={3.5} fill={s.color} stroke="white" strokeWidth={2} />}
                      activeDot={(props) => props.value == null ? null : <circle key={`ad-${s.id}-${props.index}`} cx={props.cx} cy={props.cy} r={6} fill={s.color} stroke="white" strokeWidth={2} />}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── 記録一覧 + 改善ランキング（スクロールで出現） ── */}
      <div className="px-3 pb-6 flex flex-col gap-2">
        {listData.length > 0 && (
          <>
            <button
              onClick={() => setShowList(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-sm font-semibold text-gray-500"
            >
              <span>記録一覧（{listData.length}件）</span>
              <span className="text-[11px] text-gray-400">{showList ? '▲ 閉じる' : '▼ 開く'}</span>
            </button>
            {showList && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {[...listData].reverse().map((d, i) => {
                  const isExpanded = expandedNote === d.fullDate
                  return (
                    <div key={i} className="border-b border-gray-50 last:border-0">
                      <div
                        className="flex items-center px-4 py-2.5 gap-2"
                        onClick={() => d.note && setExpandedNote(isExpanded ? null : d.fullDate)}
                        style={{ cursor: d.note ? 'pointer' : 'default' }}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-sm text-gray-600 flex-shrink-0">{d.fullDate}</span>
                          {d.note && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{ background: isExpanded ? '#3C2E1D18' : '#f3f4f6', color: isExpanded ? '#3C2E1D' : '#9ca3af' }}>
                              メモ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSingle ? (
                            <>
                              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${((d[`v_${singleSymptom.id}`] ?? 0) / 10) * 100}%`, backgroundColor: singleSymptom.color }} />
                              </div>
                              <span className="text-sm font-black w-8 text-right tabular-nums" style={{ color: singleSymptom.color }}>
                                {d[`v_${singleSymptom.id}`]?.toFixed(1)}
                              </span>
                            </>
                          ) : (
                            <div className="flex gap-2.5">
                              {selectedSymptoms.map(s => {
                                const val = d[`v_${s.id}`]
                                if (val === null) return null
                                return (
                                  <span key={s.id} className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                    <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{val.toFixed(1)}</span>
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); onGoToLog?.(d.fullDate) }}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors text-gray-300 active:text-[#3C2E1D]"
                          style={{ fontSize: 18 }}
                        >›</button>
                      </div>
                      {d.note && isExpanded && (
                        <div className="px-4 pb-3 -mt-0.5">
                          <p className="text-xs leading-relaxed rounded-xl px-3 py-2" style={{ background: '#fdf8f3', color: '#7a5c42' }}>
                            {d.note}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
        {improvementRanking.length > 0 && <RankingCard ranking={improvementRanking} range={range} />}
      </div>
    </div>
  )
}
