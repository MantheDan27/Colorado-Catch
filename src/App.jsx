import { useState, useCallback } from 'react'
import ColoradoMap from './components/ColoradoMap'
import LeaderboardPage from './components/LeaderboardPage'
import SettingsModal from './components/SettingsModal'

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  const set = useCallback((v) => {
    setValue(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])

  return [value, set]
}

export default function App() {
  const [selectedWater, setSelectedWater] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [catches, setCatches] = useLocalStorage('colorado-catch-data', {})
  const [apiKey, setApiKey] = useLocalStorage('colorado-catch-apikey', '')

  const totalCatches = Object.values(catches).reduce((sum, arr) => sum + arr.length, 0)
  const totalSpecies = [...new Set(Object.values(catches).flat().map(c => c.species))].length

  const handleFishAdded = useCallback((waterId, entry) => {
    setCatches(prev => ({
      ...prev,
      [waterId]: [...(prev[waterId] || []), entry],
    }))
  }, [setCatches])

  if (selectedWater) {
    return (
      <div className="app">
        <LeaderboardPage
          water={selectedWater}
          catches={catches}
          onFishAdded={handleFishAdded}
          onBack={() => setSelectedWater(null)}
          apiKey={apiKey}
        />
        {showSettings && (
          <SettingsModal
            apiKey={apiKey}
            onSave={setApiKey}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span>🎣</span>
          Colorado Catch
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: '0.82rem', opacity: 0.85, textAlign: 'right' }}>
            <span style={{ fontWeight: 700 }}>{totalCatches}</span> catches ·{' '}
            <span style={{ fontWeight: 700 }}>{totalSpecies}</span> species statewide
          </div>
          <div className="header-actions">
            <button className="btn-icon" onClick={() => setShowSettings(true)}>
              ⚙️ Settings
            </button>
          </div>
        </div>
      </header>

      <div className="map-full">
        <ColoradoMap
          catches={catches}
          onSelectWater={setSelectedWater}
          selectedWater={null}
        />
      </div>

      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          onSave={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
