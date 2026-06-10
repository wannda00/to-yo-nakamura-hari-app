import { useState, useRef } from 'react'
import { exportAllData, importAllData, COLORS } from '../hooks/useStorage'
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRESET_SYMPTOMS = [
  '肩こり', '腰痛', '膝痛', '頭痛', '便秘', '下痢しやすい', '鼻炎', '眼精疲労',
  'しびれ', '高血圧', '耳鳴り', 'めまい', '動悸', '喘息', '足がつる', '冷え性',
  'のぼせる', '睡眠障害', '頻尿', '花粉症', 'むくみ', '生理痛', '胃炎', '皮ふ症状', '倦怠感',
  'イライラする', '落ち込みやすい',
]

function DragHandle() {
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 -ml-1.5 rounded-xl text-gray-300 pointer-events-none">
      <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4.5" cy="3"  r="1.3"/><circle cx="9.5" cy="3"  r="1.3"/>
        <circle cx="4.5" cy="7"  r="1.3"/><circle cx="9.5" cy="7"  r="1.3"/>
        <circle cx="4.5" cy="11" r="1.3"/><circle cx="9.5" cy="11" r="1.3"/>
      </svg>
    </span>
  )
}

function SortableSymptomRow({ s, confirmId, colorPickerId, setConfirmId, setColorPickerId, removeSymptom, updateSymptomColor }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: isDragging
          ? `${CSS.Transform.toString(transform)} scale(1.04)`
          : CSS.Transform.toString(transform),
        transition: isDragging ? 'box-shadow 0.15s' : transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
        background: isDragging ? '#fdf8f3' : 'white',
        boxShadow: isDragging ? '0 8px 28px rgba(0,0,0,0.13)' : 'none',
        borderRadius: isDragging ? 14 : 0,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className="border-b border-gray-50 last:border-0"
    >
      <div className="flex items-center px-3 py-3 gap-2">
        <DragHandle />
        {/* 色変更ボタン */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => setColorPickerId(colorPickerId === s.id ? null : s.id)}
          className="flex-shrink-0 w-5 h-5 rounded-full transition-all active:scale-90"
          style={{
            background: s.color,
            boxShadow: colorPickerId === s.id
              ? `0 0 0 2px white, 0 0 0 4px ${s.color}`
              : '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
        <span className="flex-1 text-sm font-medium text-gray-800">{s.name}</span>
        {/* 削除 */}
        {confirmId === s.id ? (
          <div className="flex items-center gap-1.5" onPointerDown={e => e.stopPropagation()}>
            <button
              onClick={() => { removeSymptom(s.id); setConfirmId(null); setColorPickerId(null) }}
              className="text-xs text-red-500 font-bold px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg"
            >削除</button>
            <button
              onClick={() => setConfirmId(null)}
              className="text-xs text-gray-500 px-2.5 py-1 border border-gray-200 rounded-lg"
            >戻る</button>
          </div>
        ) : (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { setConfirmId(s.id); setColorPickerId(null) }}
            className="text-gray-300 hover:text-red-400 transition-colors p-1 text-base"
          >✕</button>
        )}
      </div>
      {/* カラーピッカー */}
      {colorPickerId === s.id && (
        <div className="px-4 py-2.5 flex flex-wrap gap-2.5" style={{ background: '#fafafa' }} onPointerDown={e => e.stopPropagation()}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { updateSymptomColor(s.id, c); setColorPickerId(null) }}
              className="w-7 h-7 rounded-full transition-all active:scale-90"
              style={{ background: c, boxShadow: s.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage({ symptoms, addSymptom, removeSymptom, updateSymptomColor, reorderSymptoms }) {
  const [input, setInput] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [colorPickerId, setColorPickerId] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [animating, setAnimating] = useState(new Set())
  const [addAnim, setAddAnim] = useState(false)
  const fileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = symptoms.findIndex(s => s.id === active.id)
    const newIndex = symptoms.findIndex(s => s.id === over.id)
    reorderSymptoms(arrayMove(symptoms, oldIndex, newIndex))
  }

  function handleAddFreeInput() {
    const n = input.trim()
    if (!n || symptoms.some(s => s.name === n)) return
    setAddAnim(true)
    setTimeout(() => setAddAnim(false), 350)
    addSymptom(n)
    setInput('')
  }

  function handlePresetClick(name) {
    triggerAnim(name)
    const existing = symptoms.find(s => s.name === name)
    if (existing) removeSymptom(existing.id)
    else addSymptom(name)
  }

  function triggerAnim(name) {
    setAnimating(prev => new Set([...prev, name]))
    setTimeout(() => {
      setAnimating(prev => { const next = new Set(prev); next.delete(name); return next })
    }, 350)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('loading')
    try {
      const result = await importAllData(file)
      setImportStatus({ ok: true, ...result })
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setImportStatus({ ok: false, message: err.message })
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="px-4 py-3 space-y-4">

        {/* ── 症状一覧 ── */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-3 pt-3 pb-3 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">症状一覧</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SYMPTOMS.map(p => {
                  const sym = symptoms.find(s => s.name === p)
                  const isAdded = !!sym
                  const isAnim = animating.has(p)
                  return (
                    <button
                      key={p}
                      onClick={() => handlePresetClick(p)}
                      style={{
                        padding: '5px 11px', borderRadius: 9999, fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', border: 'none',
                        transform: isAnim ? 'scale(0.88)' : 'scale(1)',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s',
                        background: isAdded ? `${sym.color}1a` : '#f9fafb',
                        color: isAdded ? sym.color : '#6b7280',
                        outline: isAdded ? `1.5px solid ${sym.color}55` : '1.5px solid #e5e7eb',
                      }}
                    >
                      {isAdded ? `✓ ${p}` : `＋ ${p}`}
                    </button>
                  )
                })}
                {symptoms.filter(s => !PRESET_SYMPTOMS.includes(s.name)).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handlePresetClick(s.name)}
                    style={{
                      padding: '5px 11px', borderRadius: 9999, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', border: 'none',
                      transform: animating.has(s.name) ? 'scale(0.88)' : 'scale(1)',
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s',
                      background: `${s.color}1a`, color: s.color, outline: `1.5px solid ${s.color}55`,
                    }}
                  >
                    ✓ {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">自由に入力</p>
              <div className="flex gap-2">
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFreeInput()}
                  placeholder="例：膝の痛み"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#3C2E1D] placeholder:text-gray-300"
                  style={{ fontSize: '16px' }} maxLength={20}
                />
                <button
                  onPointerDown={e => e.preventDefault()}
                  onClick={handleAddFreeInput}
                  disabled={!input.trim() && !addAnim}
                  className={`px-4 py-2.5 text-sm font-bold rounded-xl${addAnim ? ' add-pop' : ''}`}
                  style={addAnim
                    ? { background: '#22c55e', color: 'white' }
                    : input.trim()
                      ? { background: '#3C2E1D', color: 'white' }
                      : { background: '#f5ede4', color: '#a0856e', border: '1.5px solid #e8d9cc' }
                  }
                >
                  {addAnim ? '✓' : '追加'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 登録済み症状 ── */}
        {symptoms.length > 0 && (
          <section>
            <p className="text-sm font-bold text-gray-600 mb-2">登録済み（{symptoms.length}件）</p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={symptoms.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {symptoms.map(s => (
                    <SortableSymptomRow
                      key={s.id} s={s}
                      confirmId={confirmId} colorPickerId={colorPickerId}
                      setConfirmId={setConfirmId} setColorPickerId={setColorPickerId}
                      removeSymptom={removeSymptom} updateSymptomColor={updateSymptomColor}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">削除しても過去の記録データは残ります</p>
          </section>
        )}

        {/* ── データのバックアップ ── */}
        <section>
          <p className="text-sm font-bold text-gray-600 mb-2">データのバックアップ</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ background: '#fdf8f3', borderColor: '#e8d9cc' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#7a5c42' }}>
                スマートフォンの機種変更や故障に備え、定期的にデータをエクスポートして保存しておくことをおすすめします。
              </p>
            </div>
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">エクスポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">全データをJSONファイルで保存</p>
                </div>
                <button onClick={exportAllData}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all active:scale-95"
                  style={{ background: '#3C2E1D' }}>保存する</button>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">インポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">バックアップファイルからデータを復元</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl transition-all active:scale-95 hover:bg-gray-200">
                  読み込む</button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
              {importStatus === 'loading' && <p className="text-xs text-gray-500 mt-2">読み込み中...</p>}
              {importStatus?.ok === true && (
                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 font-semibold">✓ 復元完了 — 症状 {importStatus.symptoms}件、記録 {importStatus.records}件</p>
                  <p className="text-xs text-green-600 mt-0.5">まもなく再読み込みします...</p>
                </div>
              )}
              {importStatus?.ok === false && (
                <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600 font-semibold">エラー：{importStatus.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── データの初期化 ── */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-800">データを初期化</p>
                <p className="text-xs text-gray-500 mt-0.5">すべての記録・症状・施術日を削除</p>
              </div>
              {confirmReset ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      ['symptoms','records','treatmentDates','onboarded'].forEach(k => localStorage.removeItem(k))
                      window.location.reload()
                    }}
                    className="text-xs text-red-500 font-bold px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-xl"
                  >本当に初期化</button>
                  <button onClick={() => setConfirmReset(false)}
                    className="text-xs text-gray-500 px-2.5 py-1.5 border border-gray-200 rounded-xl">戻る</button>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold rounded-xl border transition-all active:scale-95"
                  style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fff5f5' }}>
                  初期化
                </button>
              )}
            </div>
          </div>
          {confirmReset && (
            <p className="text-xs text-red-400 text-center mt-2">
              この操作は取り消せません。エクスポートでバックアップを取ってから行ってください。
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
