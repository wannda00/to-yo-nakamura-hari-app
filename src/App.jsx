import { useState, useRef } from 'react'
import { useSymptoms, useRecords, useTreatmentDates } from './hooks/useStorage'
import LogPage from './pages/LogPage'
import GraphPage from './pages/GraphPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'

const TABS = [
  { id: 'log', label: '記録' },
  { id: 'graph', label: 'グラフ' },
  { id: 'settings', label: '設定' },
]

export default function App() {
  const [tab, setTab] = useState('log')
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('onboarded'))
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
  const scrollContainerRef = useRef(null)
  const { symptoms, addSymptom, removeSymptom } = useSymptoms()
  const { records, saveRecord } = useRecords()
  const { treatmentDates, toggleTreatmentDate } = useTreatmentDates()

  function handleTabChange(newTab) {
    if (tab === 'log' && hasUnsaved && newTab !== 'log') {
      const el = scrollContainerRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      setPendingTab(newTab)
    } else {
      setTab(newTab)
    }
  }

  function confirmLeave() {
    setTab(pendingTab)
    setPendingTab(null)
    setHasUnsaved(false)
  }

  if (!onboarded) {
    return (
      <OnboardingPage
        addSymptom={addSymptom}
        onComplete={() => setOnboarded(true)}
      />
    )
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100svh' }}>
      {/* Brand header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100">
        <button
          onClick={() => handleTabChange('log')}
          className="px-4 py-2 flex items-center active:opacity-70 transition-opacity"
        >
          <span className="font-black text-[18px] tracking-tight" style={{ color: '#3C2E1D' }}>
            MIERU
          </span>
          <span className="text-[11px] font-medium ml-2" style={{ color: '#7a5c42' }}>-症状手帳-</span>
        </button>
      </header>

      {/* Page content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'graph' ? (
          <div className="flex-1 min-h-0 max-w-[640px] w-full mx-auto flex flex-col">
            <GraphPage symptoms={symptoms} records={records} treatmentDates={treatmentDates} />
          </div>
        ) : (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[640px] mx-auto w-full">
              {tab === 'log' && (
                <LogPage
                  symptoms={symptoms}
                  records={records}
                  saveRecord={saveRecord}
                  onGoToSettings={() => handleTabChange('settings')}
                  treatmentDates={treatmentDates}
                  toggleTreatmentDate={toggleTreatmentDate}
                  onUnsavedChange={setHasUnsaved}
                />
              )}
              {tab === 'settings' && (
                <SettingsPage
                  symptoms={symptoms}
                  addSymptom={addSymptom}
                  removeSymptom={removeSymptom}
                />
              )}
              <p className="text-center text-[10px] text-gray-300 pb-3 pt-1">
                Developed by 東洋中村はり灸院
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 flex z-20" style={{ background: '#f5ede4', borderTop: '1px solid #e8d9cc' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className="flex-1 flex items-center justify-center py-4 active:opacity-60 transition-opacity relative"
          >
            <span
              className="text-base font-bold px-5 py-2 rounded-full transition-all"
              style={tab === t.id
                ? { background: '#3C2E1D', color: 'white' }
                : { color: '#a0856e' }
              }
            >{t.label}</span>
          </button>
        ))}
      </nav>

      {/* 未保存警告モーダル */}
      {pendingTab && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPendingTab(null)}
        >
          <div
            className="w-full max-w-[640px] bg-white rounded-t-3xl px-5 pt-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h2 className="text-base font-bold text-gray-800 mb-1">保存されていない記録があります</h2>
            <p className="text-sm text-gray-400 mb-6">このまま移動すると、入力した内容が失われます。</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setPendingTab(null)}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px]"
                style={{ background: '#3C2E1D' }}
              >
                戻って保存する
              </button>
              <button
                onClick={confirmLeave}
                className="w-full py-3 rounded-2xl font-semibold text-gray-500 text-sm bg-gray-100"
              >
                保存せずに移動
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
