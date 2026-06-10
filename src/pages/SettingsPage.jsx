import { useState, useRef, useEffect } from 'react'
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

const DELETE_W = 76

function DragHandle({ listeners, attributes }) {
  return (
    <button
      {...listeners}
      {...attributes}
      tabIndex={-1}
      className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded text-gray-300 active:text-gray-500 cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4.5" cy="3"  r="1.3"/><circle cx="9.5" cy="3"  r="1.3"/>
        <circle cx="4.5" cy="7"  r="1.3"/><circle cx="9.5" cy="7"  r="1.3"/>
        <circle cx="4.5" cy="11" r="1.3"/><circle cx="9.5" cy="11" r="1.3"/>
      </svg>
    </button>
  )
}

function SortableSymptomRow({ s, openSwipeId, setOpenSwipeId, colorPickerId, setColorPickerId, removeSymptom, updateSymptomColor }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id })
  const isOpen = openSwipeId === s.id
  const contentRef = useRef(null)
  const ptr = useRef(null) // { startX, startY, startOffset, dir, liveX }

  // Animate to settled position when isOpen changes externally
  useEffect(() => {
    const el = contentRef.current
    if (!el || ptr.current?.dir === 'h') return
    el.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    el.style.transform = `translateX(${isOpen ? -DELETE_W : 0}px)`
  }, [isOpen])

  function pDown(e) {
    if (isDragging) return
    ptr.current = {
      startX: e.clientX, startY: e.clientY,
      startOffset: isOpen ? -DELETE_W : 0,
      dir: null, liveX: isOpen ? -DELETE_W : 0,
    }
  }

  function pMove(e) {
    if (isDragging) return
    const p = ptr.current
    if (!p || p.dir === 'v') return
    const dx = e.clientX - p.startX
    const dy = e.clientY - p.startY

    if (p.dir === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      p.dir = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h'
      if (p.dir === 'v') return
    }

    if (p.dir === 'h' && contentRef.current) {
      e.stopPropagation()
      const clamped = Math.min(0, Math.max(-DELETE_W, p.startOffset + dx))
      p.liveX = clamped
      contentRef.current.style.transform = `translateX(${clamped}px)`
      contentRef.current.style.transition = 'none'
    }
  }

  function pUp() {
    if (isDragging) return
    const p = ptr.current
    ptr.current = null
    if (!p || p.dir !== 'h') return

    const snap = p.liveX < -DELETE_W * 0.4
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      contentRef.current.style.transform = `translateX(${snap ? -DELETE_W : 0}px)`
    }
    if (snap) {
      setOpenSwipeId(s.id)
      setColorPickerId(null)
    } else {
      setOpenSwipeId(prev => prev === s.id ? null : prev)
    }
  }

  function pCancel() {
    const p = ptr.current
    ptr.current = null
    if (!p || p.dir !== 'h') return
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.22s ease'
      contentRef.current.style.transform = `translateX(${isOpen ? -DELETE_W : 0}px)`
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.45 : 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'white',
      }}
      className="border-b border-gray-50 last:border-0"
    >
      {/* 削除ゾーン（背景） */}
      <div
        className="absolute right-0 inset-y-0 flex items-center justify-center"
        style={{ width: DELETE_W, background: '#ef4444' }}
      >
        <button
          onPointerDown={e => {
            e.stopPropagation()
            removeSymptom(s.id)
            setOpenSwipeId(null)
            setColorPickerId(null)
          }}
          className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
        >削除</button>
      </div>

      {/* スライドするメインコンテンツ */}
      <div
        ref={contentRef}
        style={{ background: isDragging ? '#fdf8f3' : 'white', touchAction: 'pan-y', position: 'relative', zIndex: 1 }}
        onPointerDown={pDown}
        onPointerMove={pMove}
        onPointerUp={pUp}
        onPointerCancel={pCancel}
      >
        <div className="flex items-center px-3 py-3 gap-2">
          <DragHandle listeners={listeners} attributes={attributes} />
          {/* 色変更ボタン */}
          <button
            onPointerDown={e => e.preventDefault()}
            onClick={() => {
              setColorPickerId(colorPickerId === s.id ? null : s.id)
              setOpenSwipeId(null)
            }}
            className="flex-shrink-0 w-5 h-5 rounded-full transition-all active:scale-90"
            style={{
              background: s.color,
              boxShadow: colorPickerId === s.id
                ? `0 0 0 2px white, 0 0 0 4px ${s.color}`
                : '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
          <span className="flex-1 text-sm font-medium text-gray-800">{s.name}</span>
          {/* スワイプヒント */}
          {!isOpen && (
            <span className="text-[10px] text-gray-300 pr-1">← 削除</span>
          )}
        </div>
        {/* カラーピッカー */}
        {colorPickerId === s.id && (
          <div className="px-4 py-2.5 flex flex-wrap gap-2.5" style={{ background: '#fafafa' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onPointerDown={e => e.preventDefault()}
                onClick={() => { updateSymptomColor(s.id, c); setColorPickerId(null) }}
                className="w-7 h-7 rounded-full transition-all active:scale-90"
                style={{ background: c, boxShadow: s.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage({ symptoms, addSymptom, removeSymptom, updateSymptomColor, reorderSymptoms }) {
  const [input, setInput] = useState('')
  const [colorPickerId, setColorPickerId] = useState(null)
  const [openSwipeId, setOpenSwipeId] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [animating, setAnimating] = useState(new Set())
  const [addAnim, setAddAnim] = useState(false)
  const fileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
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
                      openSwipeId={openSwipeId} setOpenSwipeId={setOpenSwipeId}
                      colorPickerId={colorPickerId} setColorPickerId={setColorPickerId}
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
