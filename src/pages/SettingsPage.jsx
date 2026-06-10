import { useState, useRef } from 'react'
import { exportAllData, importAllData } from '../hooks/useStorage'

const PRESET_SYMPTOMS = [
  '肩こり', '腰痛', '膝痛', '頭痛', '便秘', '下痢しやすい', '鼻炎', '眼精疲労',
  'しびれ', '高血圧', '耳鳴り', 'めまい', '動悸', '喘息', '足がつる', '冷え性',
  'のぼせる', '睡眠障害', '頻尿', '花粉症', 'むくみ', '生理痛', '胃炎', '皮ふ症状', '倦怠感',
  'イライラする', '落ち込みやすい',
]

export default function SettingsPage({ symptoms, addSymptom, removeSymptom }) {
  const [input, setInput] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [animating, setAnimating] = useState(new Set())
  const fileInputRef = useRef(null)

  function handleAddFreeInput() {
    const n = input.trim()
    if (!n || symptoms.some(s => s.name === n)) return
    addSymptom(n)
    setInput('')
  }

  function handlePresetClick(name) {
    triggerAnim(name)
    const existing = symptoms.find(s => s.name === name)
    if (existing) {
      removeSymptom(existing.id)
    } else {
      addSymptom(name)
    }
  }

  function triggerAnim(name) {
    setAnimating(prev => new Set([...prev, name]))
    setTimeout(() => {
      setAnimating(prev => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
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
      <div
        className="px-4 pt-6 pb-5 sticky top-0 z-10"
        style={{ background: '#3C2E1D' }}
      >
        <h1 className="text-white font-bold text-xl">設定</h1>
        <p className="text-white/60 text-xs mt-0.5">症状の管理とデータのバックアップ</p>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── 症状を追加 ── */}
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">症状を追加</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-4 pb-5 space-y-4">
            {/* free input */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">自由に入力</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFreeInput()}
                  placeholder="例：膝の痛み"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#3C2E1D] placeholder:text-gray-300"
                  maxLength={20}
                />
                <button
                  onClick={handleAddFreeInput}
                  disabled={!input.trim()}
                  className="px-4 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-30 transition-all active:scale-95"
                  style={{
                    background: input.trim()
                      ? '#3C2E1D'
                      : '#e5e7eb',
                  }}
                >
                  追加
                </button>
              </div>
            </div>

            {/* presets — all always shown */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">よく使う症状</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SYMPTOMS.map(p => {
                  const isAdded = symptoms.some(s => s.name === p)
                  const isAnim = animating.has(p)
                  return (
                    <button
                      key={p}
                      onClick={() => handlePresetClick(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 9999,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        transform: isAnim ? 'scale(0.88)' : 'scale(1)',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s, color 0.2s',
                        background: isAdded
                          ? '#3C2E1D'
                          : '#f9fafb',
                        color: isAdded ? 'white' : '#6b7280',
                        boxShadow: isAdded ? '0 2px 10px rgba(102,126,234,0.4)' : 'none',
                        outline: isAdded ? 'none' : '1.5px solid #e5e7eb',
                      }}
                    >
                      {isAdded ? `✓ ${p}` : `＋ ${p}`}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                タップで追加・もう一度タップで解除
              </p>
            </div>
          </div>
        </section>

        {/* ── 登録済み症状 ── */}
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            登録済みの症状 ({symptoms.length}件)
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {symptoms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
                <span className="text-4xl">🩺</span>
                <span className="text-sm text-gray-400">症状がまだ登録されていません</span>
                <span className="text-xs text-gray-300">上のフォームから追加してください</span>
              </div>
            ) : (
              symptoms.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  </div>
                  {confirmId === s.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">削除しますか？</span>
                      <button
                        onClick={() => { removeSymptom(s.id); setConfirmId(null) }}
                        className="text-xs text-red-500 font-bold px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg"
                      >削除</button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-gray-500 px-2.5 py-1 border border-gray-200 rounded-lg"
                      >戻る</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 text-base"
                    >✕</button>
                  )}
                </div>
              ))
            )}
          </div>
          {symptoms.length > 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              削除しても過去の記録データは残ります
            </p>
          )}
        </section>

        {/* ── データのバックアップ ── */}
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            データのバックアップ
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                スマートフォンの機種変更や故障に備え、定期的にデータをエクスポートして保存しておくことをおすすめします。
              </p>
            </div>

            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">📤 エクスポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">全データをJSONファイルで保存</p>
                </div>
                <button
                  onClick={exportAllData}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all active:scale-95"
                  style={{ background: '#3C2E1D' }}
                >
                  保存する
                </button>
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">📥 インポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">バックアップファイルからデータを復元</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl transition-all active:scale-95 hover:bg-gray-200"
                >
                  読み込む
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />
              {importStatus === 'loading' && (
                <p className="text-xs text-gray-500 mt-2">読み込み中...</p>
              )}
              {importStatus?.ok === true && (
                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 font-semibold">
                    ✓ 復元完了 — 症状 {importStatus.symptoms}件、記録 {importStatus.records}件
                  </p>
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
      </div>
    </div>
  )
}
