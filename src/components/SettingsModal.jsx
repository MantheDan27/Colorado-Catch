import { useState } from 'react'

export default function SettingsModal({ apiKey, onSave, onClose }) {
  const [key, setKey] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>⚙️ Settings</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <h4>🔑 Anthropic API Key</h4>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 10 }}>
              Required for AI fish identification. Get your key at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: '#1a6fa8' }}>
                console.anthropic.com
              </a>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => setShowKey(v => !v)}
                style={{ flexShrink: 0 }}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="settings-note" style={{ marginTop: 6 }}>
              ⚠️ Your key is stored only in your browser's local storage and never sent to any server other than Anthropic.
            </p>
          </div>

          <div className="settings-section" style={{ background: '#f0f9ff', borderRadius: 10, padding: 14 }}>
            <h4 style={{ marginBottom: 8 }}>🗺️ How It Works</h4>
            <ul style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Browse the map and click any Colorado body of water</li>
              <li>View the fish scoreboard for that location</li>
              <li>Upload a photo or take one with your camera</li>
              <li>Claude AI identifies the species automatically</li>
              <li>Confirm and add it to that water's scoreboard</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(key); onClose() }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
