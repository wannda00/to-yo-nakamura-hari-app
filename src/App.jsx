import { useState } from 'react'
import { useSymptoms, useRecords, useTreatmentDates } from './hooks/useStorage'
import { useConsent } from './hooks/useConsent'
import LogPage from './pages/LogPage'
import GraphPage from './pages/GraphPage'
import SettingsPage from './pages/SettingsPage'
import ConsentModal from './components/ConsentModal'

const TABS = [
  { id: 'log', label: '記録', icon: '✏️' },
  { id: 'graph', label: 'グラフ', icon: '📈' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('log')
  const { symptoms, addSymptom, removeSymptom } = useSymptoms()
  const { records, saveRecord } = useRecords()
  const { treatmentDates, toggleTreatmentDate } = useTreatmentDates()
  const { consent, anonymousId, endpointUrl, setConsent, setEndpointUrl } = useConsent()

  const showConsentModal = consent === null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        {tab === 'log' && (
          <LogPage
            symptoms={symptoms}
            records={records}
            saveRecord={saveRecord}
            onGoToSettings={() => setTab('settings')}
            consent={consent}
            anonymousId={anonymousId}
            endpointUrl={endpointUrl}
            treatmentDates={treatmentDates}
            toggleTreatmentDate={toggleTreatmentDate}
          />
        )}
        {tab === 'graph' && (
          <GraphPage symptoms={symptoms} records={records} treatmentDates={treatmentDates} />
        )}
        {tab === 'settings' && (
          <SettingsPage
            symptoms={symptoms}
            addSymptom={addSymptom}
            removeSymptom={removeSymptom}
            consent={consent}
            setConsent={setConsent}
            anonymousId={anonymousId}
            endpointUrl={endpointUrl}
            setEndpointUrl={setEndpointUrl}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-100 flex z-20">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              tab === t.id ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

      {showConsentModal && (
        <ConsentModal
          onConsent={() => setConsent(true)}
          onDecline={() => setConsent(false)}
        />
      )}
    </div>
  )
}
