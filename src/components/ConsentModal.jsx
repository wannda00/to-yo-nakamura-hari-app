export default function ConsentModal({ onConsent, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-[480px] bg-white rounded-t-3xl px-5 pt-6 pb-10 shadow-2xl"
        style={{ animation: 'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #667eea20, #764ba220)' }}>
            📊
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg leading-tight">データ共有のお願い</h2>
            <p className="text-xs text-gray-400 mt-0.5">匿名データを院の改善・情報発信に活用させてください</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-green-700 mb-1.5">✓ 共有される情報</p>
            <ul className="space-y-1">
              {[
                '症状名・スコア・記録日',
                '匿名ID（誰かは特定できません）',
              ].map(t => (
                <li key={t} className="text-xs text-green-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-green-400 rounded-full flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="text-xs text-green-600 mt-2 leading-relaxed">
              このデータは施術の改善・統計分析のほか、個人が特定できない形でSNS・ホームページ等での情報発信にも活用する場合があります。
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-gray-500 mb-1.5">✕ 共有されない情報</p>
            <ul className="space-y-1">
              {['氏名・連絡先などの個人情報', 'メモ欄の内容'].map(t => (
                <li key={t} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center mb-5">
          設定タブからいつでも変更できます
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onConsent}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px] active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            同意する
          </button>
          <button
            onClick={onDecline}
            className="w-full py-3 rounded-2xl font-semibold text-gray-500 text-sm bg-gray-100 active:scale-95 transition-all"
          >
            今はしない
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
