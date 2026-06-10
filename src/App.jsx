import { useState } from 'react'
import { useSymptoms, useRecords, useTreatmentDates } from './hooks/useStorage'
import LogPage from './pages/LogPage'
import GraphPage from './pages/GraphPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'

const TABS = [
  { id: 'log', label: '記録', icon: '✏️' },
  { id: 'graph', label: 'グラフ', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('log')
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('onboarded'))
  const { symptoms, addSymptom, removeSymptom } = useSymptoms()
  const { records, saveRecord } = useRecords()
  const { treatmentDates, toggleTreatmentDate } = useTreatmentDates()

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
          onClick={() => setTab('log')}
          className="px-4 py-2 flex items-center active:opacity-70 transition-opacity"
        >
          <span
            className="font-black text-[18px] tracking-tight"
            style={{ color: '#3C2E1D' }}
          >
            MIERU
          </span>
          <span className="text-[11px] font-medium ml-2" style={{ color: '#7a5c42' }}>-症状手帳-</span>
        </button>
      </header>

      {/* Page content — graph tab: no-scroll flex fill; others: scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'graph' ? (
          <div className="flex-1 min-h-0 max-w-[640px] w-full mx-auto flex flex-col">
            <GraphPage symptoms={symptoms} records={records} treatmentDates={treatmentDates} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[640px] mx-auto w-full">
              {tab === 'log' && (
                <LogPage
                  symptoms={symptoms}
                  records={records}
                  saveRecord={saveRecord}
                  onGoToSettings={() => setTab('settings')}
                  treatmentDates={treatmentDates}
                  toggleTreatmentDate={toggleTreatmentDate}
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
      <nav className="flex-shrink-0 bg-white border-t border-gray-100 flex z-20">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              tab === t.id ? 'text-[#3C2E1D]' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
