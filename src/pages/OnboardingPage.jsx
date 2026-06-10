import { useState } from 'react'

const BRAND = '#3C2E1D'
const BRAND_SUB = '#7a5c42'

const PRESET_SYMPTOMS = [
  '肩こり', '腰痛', '膝痛', '頭痛', '便秘', '下痢しやすい', '鼻炎', '眼精疲労',
  'しびれ', '高血圧', '耳鳴り', 'めまい', '動悸', '喘息', '足がつる', '冷え性',
  'のぼせる', '睡眠障害', '頻尿', '花粉症', 'むくみ', '生理痛', '胃炎', '皮ふ症状', '倦怠感',
  'イライラする', '落ち込みやすい',
]

function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity disabled:opacity-30 active:opacity-80"
      style={{ background: BRAND }}
    >
      {children}
    </button>
  )
}

function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col h-full px-7 pt-12 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <div className="text-center">
          <div className="flex items-baseline gap-2 justify-center mb-1">
            <span className="font-black text-3xl" style={{ color: BRAND }}>MIERU</span>
            <span className="text-sm font-medium" style={{ color: BRAND_SUB }}>-症状手帳-</span>
          </div>
          <p className="text-gray-500 text-sm mt-1" style={{ color: BRAND_SUB }}>
            東洋中村はり灸院
          </p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-700 text-base leading-relaxed font-medium">
            毎日の体調をスライダーで記録して、<br />症状の変化を見える化するアプリです。
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            操作はとても簡単です。<br />まず記録したい症状を選びましょう。
          </p>
        </div>

        <div
          className="w-full px-4 py-3.5 rounded-2xl border text-left"
          style={{ background: '#fdf8f3', borderColor: `${BRAND}20` }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: BRAND }}>プライバシーについて</p>
          <p className="text-xs leading-relaxed" style={{ color: BRAND_SUB }}>
            記録はすべてこの端末の中だけに保存されます。院や第三者にデータが送信されることは一切ありません。
          </p>
        </div>
      </div>

      <PrimaryButton onClick={onNext}>はじめる →</PrimaryButton>
    </div>
  )
}

function StepSymptoms({ selected, animating, customInput, setCustomInput, onToggle, onAddCustom, onNext }) {
  const customAdded = [...selected].filter(n => !PRESET_SYMPTOMS.includes(n))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-10 pb-3">
        <p className="text-xs font-bold tracking-widest mb-2" style={{ color: BRAND_SUB }}>STEP 1 / 2</p>
        <h2 className="text-xl font-bold text-gray-800">気になる症状を選んでください</h2>
        <p className="text-sm text-gray-400 mt-1">複数選べます。あとからでも変更できます。</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* 自由入力 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddCustom()}
            placeholder="一覧にない症状を入力..."
            maxLength={20}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#3C2E1D] placeholder:text-gray-300"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={onAddCustom}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-30"
            style={{ background: BRAND }}
          >
            追加
          </button>
        </div>

        {/* カスタム追加済 */}
        {customAdded.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customAdded.map(name => (
              <button
                key={name}
                onClick={() => onToggle(name)}
                style={{
                  padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                  background: BRAND, color: 'white', border: 'none', cursor: 'pointer',
                  transform: animating.has(name) ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 2px 8px rgba(60,46,29,0.3)',
                }}
              >
                ✓ {name}
              </button>
            ))}
          </div>
        )}

        {/* プリセット */}
        <div className="flex flex-wrap gap-2">
          {PRESET_SYMPTOMS.map(p => {
            const isSel = selected.has(p)
            const isAnim = animating.has(p)
            return (
              <button
                key={p}
                onClick={() => onToggle(p)}
                style={{
                  padding: '7px 13px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  transform: isAnim ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s, box-shadow 0.2s',
                  background: isSel ? BRAND : '#f5f0eb',
                  color: isSel ? 'white' : '#5c4033',
                  boxShadow: isSel ? '0 2px 8px rgba(60,46,29,0.3)' : 'none',
                }}
              >
                {isSel ? `✓ ${p}` : p}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-shrink-0 px-6 pb-8 pt-3 border-t border-gray-100">
        {selected.size > 0 && (
          <p className="text-center text-sm text-gray-500 mb-3">
            <span className="font-bold" style={{ color: BRAND }}>{selected.size}件</span>を選択中
          </p>
        )}
        <PrimaryButton onClick={onNext} disabled={selected.size === 0}>
          {selected.size === 0 ? '症状を1つ以上選んでください' : `${selected.size}件の症状で次へ →`}
        </PrimaryButton>
        <button
          onClick={onNext}
          className="w-full mt-3 text-xs text-center py-2"
          style={{ color: '#a0856e' }}
        >
          後で設定から追加する →
        </button>
      </div>
    </div>
  )
}

function StepDone({ count, onComplete }) {
  return (
    <div className="flex flex-col h-full px-7 pt-12 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">準備できました！</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {count > 0
              ? <><span className="font-bold text-gray-700">{count}件</span>の症状を登録しました。<br />毎日記録して、体調の変化を<br />一緒に確認しましょう。</>
              : <>症状は設定タブからいつでも<br />追加できます。</>
            }
          </p>
        </div>

        <div className="w-full space-y-3">
          {[
            { tab: '記録タブ',  desc: 'スライダーを動かして今日の症状を入力' },
            { tab: 'グラフタブ', desc: '症状の変化をグラフで確認' },
            { tab: '設定タブ',  desc: '症状の追加・変更、データの保存' },
          ].map(({ tab, desc }) => (
            <div
              key={tab}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: `${BRAND}08`, border: `1px solid ${BRAND}15` }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: BRAND }}>{tab}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PrimaryButton onClick={onComplete}>記録を始める</PrimaryButton>
    </div>
  )
}

export default function OnboardingPage({ onComplete, addSymptom }) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [customInput, setCustomInput] = useState('')
  const [animating, setAnimating] = useState(new Set())

  function toggleSymptom(name) {
    triggerAnim(name)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function triggerAnim(name) {
    setAnimating(prev => new Set([...prev, name]))
    setTimeout(() => setAnimating(prev => {
      const next = new Set(prev)
      next.delete(name)
      return next
    }), 350)
  }

  function addCustom() {
    const n = customInput.trim()
    if (!n) return
    triggerAnim(n)
    setSelected(prev => new Set([...prev, n]))
    setCustomInput('')
  }

  function handleComplete() {
    ;[...selected].forEach(name => addSymptom(name))
    localStorage.setItem('onboarded', '1')
    onComplete()
  }

  return (
    <div className="max-w-[640px] mx-auto w-full flex flex-col" style={{ height: '100svh', background: 'white' }}>
      {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
      {step === 2 && (
        <StepSymptoms
          selected={selected}
          animating={animating}
          customInput={customInput}
          setCustomInput={setCustomInput}
          onToggle={toggleSymptom}
          onAddCustom={addCustom}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && <StepDone count={selected.size} onComplete={handleComplete} />}
    </div>
  )
}
