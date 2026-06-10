import { useState, useEffect, useRef } from 'react'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateJa(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return {
    full: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    day: days[d.getDay()],
  }
}

function VASSlider({ value, touched, color, onChange }) {
  const pct = (value / 10) * 100
  const trackBg = touched
    ? `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`
    : `linear-gradient(to right, #d1d5db 0%, #d1d5db ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`

  return (
    <input
      type="range"
      min={0}
      max={10}
      step={0.1}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className={`vas-slider${touched ? '' : ' untouched'}`}
      style={{ '--thumb-color': touched ? color : '#d1d5db', background: trackBg }}
    />
  )
}

function SymptomCard({ symptom, value, touched, onChange }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: `1.5px solid ${touched ? symptom.color + '45' : '#f3f4f6'}`, background: 'white' }}
    >
      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: symptom.color }} />
            <span className="font-semibold text-gray-800 text-sm">{symptom.name}</span>
          </div>
          {touched && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ color: symptom.color, backgroundColor: symptom.color + '18' }}
            >
              記録済
            </span>
          )}
        </div>
        <VASSlider value={value} touched={touched} color={symptom.color} onChange={onChange} />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-400">症状なし</span>
          <span className="text-[9px] text-gray-400">困ってる</span>
          <span className="text-[9px] text-gray-400">人生で最もつらい</span>
        </div>
      </div>
    </div>
  )
}

export default function LogPage({ symptoms, records, saveRecord, onGoToSettings, treatmentDates, toggleTreatmentDate, onUnsavedChange, saveRef }) {
  const [date, setDate] = useState(todayStr())
  const [values, setValues] = useState({})
  const [touched, setTouched] = useState(new Set())
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveKey, setSaveKey] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const saveButtonRef = useRef(null)

  useEffect(() => {
    onUnsavedChange?.(touched.size > 0 && !saved)
  }, [touched.size, saved])

  useEffect(() => {
    if (saveRef) saveRef.current = handleSave
  })

  // date が変わったときだけ保存状態をリセット
  useEffect(() => {
    setSaved(false)
    setShowToast(false)
  }, [date])

  // date または records が変わったとき表示データを同期
  useEffect(() => {
    const rec = records.find(r => r.date === date)
    if (rec) {
      const v = {}
      const t = new Set()
      rec.entries.forEach(e => { v[e.symptomId] = e.value; t.add(e.symptomId) })
      setValues(v)
      setTouched(t)
      setNote(rec.note || '')
      setSaved(true)
    } else {
      setValues({})
      setTouched(new Set())
      setNote('')
    }
  }, [date, records])

  function handleChange(symptomId, val) {
    setValues(prev => ({ ...prev, [symptomId]: val }))
    setTouched(prev => new Set([...prev, symptomId]))
    setSaved(false)
  }

  function handleSave() {
    const entries = [...touched].map(id => ({ symptomId: id, value: values[id] ?? 0 }))
    saveRecord(date, entries, note)
    setSaved(true)
    setSaveKey(k => k + 1)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2400)
  }

  function requestDateChange(next) {
    if (touched.size > 0 && !saved) {
      handleSave()
    }
    setDate(next)
  }

  function shiftDate(delta) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().slice(0, 10)
    if (next <= todayStr()) requestDateChange(next)
  }

  const { full, day } = formatDateJa(date)
  const isToday = date === todayStr()
  const touchedCount = touched.size

  if (symptoms.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <div
          className="px-4 pt-6 pb-5"
          style={{ background: '#3C2E1D' }}
        >
          <h1 className="text-white font-bold text-xl">症状を記録する</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5 py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: '#3C2E1D12' }}>
            <span className="w-8 h-8 rounded-full border-2" style={{ borderColor: '#3C2E1D40' }} />
          </div>
          <div>
            <p className="font-bold text-gray-700 text-lg mb-1">症状がまだ登録されていません</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              設定タブから記録したい症状を<br />追加してください
            </p>
          </div>
          <button
            onClick={onGoToSettings}
            className="px-6 py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all"
            style={{ background: '#3C2E1D' }}
          >
            症状を設定する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-6">
      {/* header */}
      <div
        className="px-4 pt-4 pb-4 sticky top-0 z-10"
        style={{ background: '#3C2E1D' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm hover:bg-white/30 transition-colors"
          >
            ‹
          </button>
          <div className="flex-1 relative">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={e => { if (e.target.value) requestDateChange(e.target.value) }}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold text-lg">{full}</span>
              <span className="text-white/70 text-sm">（{day}）</span>
              {isToday && (
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  今日
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
              isToday ? 'bg-white/10 text-white/30' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            ›
          </button>
        </div>
      </div>

      {/* cards */}
      <div className="px-4 pt-3 space-y-2">
        {/* 施術日トグル */}
        <div
          className="rounded-2xl overflow-hidden shadow-sm transition-all duration-200 border"
          style={{
            border: treatmentDates?.includes(date) ? '1.5px solid #3C2E1D40' : '1.5px solid #f3f4f6',
            background: treatmentDates?.includes(date) ? '#fdf8f3' : 'white',
          }}
        >
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#3C2E1D' }} />
              <div>
                <p className="font-semibold text-gray-800 text-sm">施術日</p>
                <p className="text-[11px] text-gray-400">この日に施術を受けた</p>
              </div>
            </div>
            <button
              onClick={() => toggleTreatmentDate(date)}
              style={{
                position: 'relative',
                width: 48,
                height: 28,
                borderRadius: 14,
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                background: treatmentDates?.includes(date)
                  ? '#3C2E1D'
                  : '#e5e7eb',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  transition: 'transform 0.2s',
                  transform: `translateX(${treatmentDates?.includes(date) ? 24 : 4}px)`,
                }}
              />
            </button>
          </div>
        </div>

        {symptoms.map(symptom => (
          <SymptomCard
            key={symptom.id}
            symptom={symptom}
            value={values[symptom.id] ?? 0}
            touched={touched.has(symptom.id)}
            onChange={val => handleChange(symptom.id, val)}
          />
        ))}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-3 pb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">メモ（任意）</label>
          <textarea
            value={note}
            onChange={e => { setNote(e.target.value); setSaved(false) }}
            placeholder="今日の状態・気づきなど..."
            rows={3}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#3C2E1D] placeholder:text-gray-300"
          />
        </div>

        <button
          ref={saveButtonRef}
          key={saveKey}
          onClick={handleSave}
          disabled={touchedCount === 0}
          className={`w-full py-3 rounded-2xl font-bold text-white text-[15px] transition-colors${saved ? ' btn-bounce' : ''}`}
          style={{
            background: saved
              ? '#22c55e'
              : touchedCount === 0
              ? '#d1d5db'
              : '#3C2E1D',
          }}
        >
          {saved ? '✓ 保存済み' : touchedCount > 0 ? `${touchedCount}件の症状を保存する` : '症状を選択してください'}
        </button>
      </div>

      {/* save toast */}
      {showToast && (
        <div
          key={saveKey}
          className="toast-float fixed z-50 pointer-events-none"
          style={{ bottom: '100px', left: '50%' }}
        >
          <div className="flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold whitespace-nowrap">
            <span className="text-green-400 text-base">✓</span>
            <span>{touchedCount}件の記録を保存しました</span>
          </div>
        </div>
      )}
    </div>
  )
}
