import { useState, useRef } from 'react'
import { exportAllData, importAllData } from '../hooks/useStorage'

const PRESET_SYMPTOMS = ['肩こり', '腰痛', '膝痛', '頭痛', '便秘', '下痢しやすい', '鼻炎', '眼精疲労']

const GAS_SCRIPT = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['送信日時','匿名ID','記録日','症状','スコア']);
    }
    var data = JSON.parse(e.postData.contents);
    data.entries.forEach(function(entry) {
      sheet.appendRow([
        new Date().toLocaleString('ja-JP'),
        data.anonymousId,
        data.date,
        entry.symptomName,
        entry.value
      ]);
    });
    return ContentService
      .createTextOutput(JSON.stringify({status:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({status:'error',message:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`

export default function SettingsPage({ symptoms, addSymptom, removeSymptom, consent, setConsent, anonymousId, endpointUrl, setEndpointUrl }) {
  const [input, setInput] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [urlInput, setUrlInput] = useState(endpointUrl)
  const [urlSaved, setUrlSaved] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  function handleSaveUrl() {
    setEndpointUrl(urlInput)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 2000)
  }

  function handleCopyScript() {
    navigator.clipboard.writeText(GAS_SCRIPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleAddFreeInput() {
    const n = input.trim()
    if (!n || symptoms.some(s => s.name === n)) return
    addSymptom(n)
    setInput('')
  }

  function handleAddPreset(name) {
    if (symptoms.some(s => s.name === name)) return
    addSymptom(name)
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

  const unaddedPresets = PRESET_SYMPTOMS.filter(p => !symptoms.some(s => s.name === p))

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div
        className="px-4 pt-6 pb-5 sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
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
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 placeholder:text-gray-300"
                  maxLength={20}
                />
                <button
                  onClick={handleAddFreeInput}
                  disabled={!input.trim()}
                  className="px-4 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-30 transition-all active:scale-95"
                  style={{
                    background: input.trim()
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#e5e7eb',
                  }}
                >
                  追加
                </button>
              </div>
            </div>

            {/* presets */}
            {unaddedPresets.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">よく使う症状</p>
                <div className="flex flex-wrap gap-2">
                  {unaddedPresets.map(p => (
                    <button
                      key={p}
                      onClick={() => handleAddPreset(p)}
                      className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    >
                      ＋ {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        {/* ── データ共有 ── */}
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">データ共有</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* consent toggle */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">先生へのデータ共有</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    症状スコア・日付を匿名で自動送信（改善・SNS等に活用）
                  </p>
                </div>
                <button
                  onClick={() => setConsent(consent ? false : true)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${consent ? 'bg-purple-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${consent ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              {consent === false && (
                <p className="text-[11px] text-gray-400 mt-2">共有しない設定になっています</p>
              )}
              {consent === true && !endpointUrl && (
                <p className="text-[11px] text-amber-500 mt-2">⚠ 送信先URLが未設定です（下で設定してください）</p>
              )}
              {consent === true && endpointUrl && (
                <p className="text-[11px] text-green-600 mt-2">✓ 保存のたびに自動送信されます</p>
              )}
            </div>

            {/* anonymous ID */}
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-1">あなたの匿名ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 select-all">
                  {anonymousId}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(anonymousId)}
                  className="flex-shrink-0 text-xs text-gray-500 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50"
                >
                  コピー
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                先生に伝えることで、あなたの記録を特定してもらえます
              </p>
            </div>

            {/* endpoint URL */}
            <div className="px-4 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">送信先URL（先生が設定）</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setUrlSaved(false) }}
                  placeholder="https://script.google.com/..."
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 placeholder:text-gray-300"
                />
                <button
                  onClick={handleSaveUrl}
                  disabled={!urlInput.trim()}
                  className="flex-shrink-0 px-3 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-30 transition-all active:scale-95"
                  style={{ background: urlSaved ? '#22c55e' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {urlSaved ? '✓' : '保存'}
                </button>
              </div>
            </div>

            {/* GAS setup guide */}
            <div className="px-4 py-4">
              <button
                onClick={() => setShowScript(s => !s)}
                className="flex items-center gap-2 text-xs font-semibold text-purple-600"
              >
                <span>{showScript ? '▼' : '▶'}</span>
                Googleスプレッドシートの設定方法
              </button>
              {showScript && (
                <div className="mt-3 space-y-2 text-xs text-gray-600 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                    <li><a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-purple-600 underline">sheets.google.com</a> で新しいシートを作成</li>
                    <li>メニュー「拡張機能」→「Apps Script」を開く</li>
                    <li>下のスクリプトをコピーして貼り付け</li>
                    <li>「デプロイ」→「新しいデプロイ」→「ウェブアプリ」</li>
                    <li>「アクセスできるユーザー」を「全員」に設定して「デプロイ」</li>
                    <li>表示されたURLを上の「送信先URL」に貼り付け</li>
                  </ol>
                  <div className="relative mt-3">
                    <pre className="bg-gray-900 text-green-400 text-[10px] rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {GAS_SCRIPT}
                    </pre>
                    <button
                      onClick={handleCopyScript}
                      className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                      style={{ background: copied ? '#22c55e' : 'rgba(255,255,255,0.15)', color: 'white' }}
                    >
                      {copied ? '✓ コピー済み' : 'コピー'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── データのバックアップ ── */}
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            データのバックアップ
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* explanation */}
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                スマートフォンの機種変更や故障に備え、定期的にデータをエクスポートして保存しておくことをおすすめします。
              </p>
            </div>

            {/* export */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">📤 エクスポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    全データをJSONファイルで保存
                  </p>
                </div>
                <button
                  onClick={exportAllData}
                  className="flex-shrink-0 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  保存する
                </button>
              </div>
            </div>

            {/* import */}
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">📥 インポート</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    バックアップファイルからデータを復元
                  </p>
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
