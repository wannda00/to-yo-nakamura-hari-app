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
  const [requestedDate, setRequestedDate] = useState(null)
  const scrollContainerRef = useRef(null)
  const logSaveRef = useRef(null)
  const { symptoms, addSymptom, removeSymptom, updateSymptomColor, moveSymptom } = useSymptoms()
  const { records, saveRecord } = useRecords()
  const { treatmentDates, toggleTreatmentDate } = useTreatmentDates()

  function handleTabChange(newTab) {
    if (tab === 'log' && hasUnsaved && newTab !== 'log') {
      logSaveRef.current?.()
    }
    setTab(newTab)
  }

  function goToLogDate(date) {
    setRequestedDate(date)
    handleTabChange('log')
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
            <GraphPage
              symptoms={symptoms}
              records={records}
              treatmentDates={treatmentDates}
              onGoToLog={goToLogDate}
            />
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
                  saveRef={logSaveRef}
                  requestedDate={requestedDate}
                  onRequestedDateConsumed={() => setRequestedDate(null)}
                />
              )}
              {tab === 'settings' && (
                <SettingsPage
                  symptoms={symptoms}
                  addSymptom={addSymptom}
                  removeSymptom={removeSymptom}
                  updateSymptomColor={updateSymptomColor}
                  moveSymptom={moveSymptom}
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

    </div>
  )
}
