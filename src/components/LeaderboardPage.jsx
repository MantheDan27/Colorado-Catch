import { useState } from 'react'
import FishIdentifierModal from './FishIdentifierModal'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage({ water, catches, onFishAdded, onBack, apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('leaderboard')

  const waterCatches = catches[water.id] || []
  const speciesSet = [...new Set(waterCatches.map(c => c.species))]

  const anglerCounts = {}
  waterCatches.forEach(c => {
    anglerCounts[c.angler] = (anglerCounts[c.angler] || 0) + 1
  })
  const leaderboard = Object.entries(anglerCounts).sort(([, a], [, b]) => b - a)

  return (
    <div className="lb-page">
      <div className="lb-topbar">
        <button className="btn-back" onClick={onBack}>
          ← Colorado Map
        </button>
        <div className="lb-topbar-title">
          <span>{water.name}</span>
          <span className="lb-topbar-meta">{water.type} · {water.area} · {water.elevation}</span>
        </div>
        <button className="btn-log" onClick={() => setShowModal(true)}>
          📸 Log Catch
        </button>
      </div>

      <div className="lb-tabs">
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
        <button className={`tab ${activeTab === 'catches' ? 'active' : ''}`} onClick={() => setActiveTab('catches')}>
          Catches ({waterCatches.length})
        </button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          Info
        </button>
      </div>

      <div className="lb-body">
        <div className="lb-content">

          {activeTab === 'leaderboard' && (
            <>
              <div className="stats-row" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
                <div className="stat-card">
                  <div className="num">{waterCatches.length}</div>
                  <div className="label">Total Catches</div>
                </div>
                <div className="stat-card">
                  <div className="num">{speciesSet.length}</div>
                  <div className="label">Species Found</div>
                </div>
                <div className="stat-card">
                  <div className="num">{leaderboard.length}</div>
                  <div className="label">Anglers</div>
                </div>
              </div>

              <div className="lb-card">
                <div className="section-title">Top Anglers</div>
                {leaderboard.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">🏆</div>
                    <p>No catches logged yet.<br />Be the first on the leaderboard!</p>
                  </div>
                ) : (
                  leaderboard.map(([name, count], i) => (
                    <div key={name} className={`lb-row ${i < 3 ? 'lb-row-top' : ''}`}>
                      <div className={`rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                        {i < 3 ? MEDALS[i] : i + 1}
                      </div>
                      <div className="lb-angler-name">{name}</div>
                      <div className="lb-angler-count">{count} catch{count !== 1 ? 'es' : ''} 🐟</div>
                    </div>
                  ))
                )}
              </div>

              {speciesSet.length > 0 && (
                <div className="lb-card" style={{ marginTop: 16 }}>
                  <div className="section-title">Species Caught Here</div>
                  <div className="species-list">
                    {speciesSet.map(s => (
                      <span key={s} className="species-badge">🐟 {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'catches' && (
            <div className="lb-card">
              <div className="section-title">Recent Catches</div>
              {waterCatches.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🎣</div>
                  <p>No catches logged yet.<br />Be the first!</p>
                </div>
              ) : (
                [...waterCatches].sort((a, b) => b.timestamp - a.timestamp).map(entry => (
                  <div key={entry.id} className="fish-entry">
                    {entry.image ? (
                      <img src={entry.image} alt={entry.species} />
                    ) : (
                      <div className="fish-no-img">🐟</div>
                    )}
                    <div className="fish-info">
                      <div className="fish-name">{entry.species}</div>
                      {entry.scientificName && (
                        <div className="fish-meta" style={{ fontStyle: 'italic' }}>{entry.scientificName}</div>
                      )}
                      <div className="fish-angler">🧑‍🎣 {entry.angler}</div>
                      <div className="fish-meta">{entry.date}{entry.notes ? ` · ${entry.notes}` : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="lb-card">
              <div className="section-title">Details</div>
              {[['Type', water.type], ['Surface Area', water.area], ['Elevation', water.elevation]].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div className="section-title" style={{ marginTop: 20 }}>About</div>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{water.description}</p>
              <div className="section-title" style={{ marginTop: 16 }}>Known Species</div>
              <div className="species-list">
                {water.commonFish.map(f => (
                  <span key={f} className="species-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showModal && (
        <FishIdentifierModal
          water={water}
          apiKey={apiKey}
          onClose={() => setShowModal(false)}
          onFishAdded={onFishAdded}
        />
      )}
    </div>
  )
}
