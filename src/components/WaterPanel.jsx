import { useState } from 'react'
import FishIdentifierModal from './FishIdentifierModal'

export default function WaterPanel({ water, catches, onFishAdded, onClose, apiKey }) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('catches')

  const waterCatches = catches[water.id] || []
  const speciesSet = [...new Set(waterCatches.map(c => c.species))]

  return (
    <>
      <div className="panel-header" style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '1rem',
          }}
        >×</button>
        <h2>{water.name}</h2>
        <p>
          <span className="water-type">{water.type}</span>
          {' '}· {water.area} · {water.elevation}
        </p>
        <p style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 6 }}>{water.description}</p>
      </div>

      <div className="tab-bar">
        <button className={`tab ${activeTab === 'catches' ? 'active' : ''}`} onClick={() => setActiveTab('catches')}>
          Catches ({waterCatches.length})
        </button>
        <button className={`tab ${activeTab === 'species' ? 'active' : ''}`} onClick={() => setActiveTab('species')}>
          Species ({speciesSet.length})
        </button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          Info
        </button>
      </div>

      <div className="panel-body">
        <button className="btn-add-fish" onClick={() => setShowModal(true)}>
          📸 Log a Catch + Identify Fish
        </button>

        {activeTab === 'catches' && (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <div className="num">{waterCatches.length}</div>
                <div className="label">Total Catches</div>
              </div>
              <div className="stat-card">
                <div className="num">{speciesSet.length}</div>
                <div className="label">Species Found</div>
              </div>
            </div>

            <div className="section-title">Recent Catches</div>

            {waterCatches.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🎣</div>
                <p>No catches logged yet.<br />Be the first to log a fish!</p>
              </div>
            ) : (
              [...waterCatches]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(entry => (
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
                      <div className="fish-meta">
                        {entry.date}
                        {entry.notes ? ` · ${entry.notes}` : ''}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </>
        )}

        {activeTab === 'species' && (
          <>
            <div className="section-title">Confirmed Species Found Here</div>
            {speciesSet.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🔬</div>
                <p>No species identified yet.<br />Log a catch to start the list!</p>
              </div>
            ) : (
              <div className="species-list">
                {speciesSet.map(s => (
                  <span key={s} className="species-badge">🐟 {s}</span>
                ))}
              </div>
            )}

            <div className="section-title" style={{ marginTop: 16 }}>Common Species (Known)</div>
            <div className="species-list">
              {water.commonFish.map(f => (
                <span key={f} className="species-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  {f}
                </span>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>Top Anglers</div>
            {waterCatches.length === 0 ? (
              <div className="empty-state" style={{ padding: '16px' }}>
                <p>No anglers yet.</p>
              </div>
            ) : (
              (() => {
                const counts = {}
                waterCatches.forEach(c => { counts[c.angler] = (counts[c.angler] || 0) + 1 })
                return Object.entries(counts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([name, count], i) => (
                    <div key={name} className="leaderboard-entry">
                      <div className={`rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>{name}</div>
                      <div style={{ fontWeight: 700, color: '#1a6fa8' }}>{count} 🐟</div>
                    </div>
                  ))
              })()
            )}
          </>
        )}

        {activeTab === 'info' && (
          <>
            <div className="section-title">Lake Details</div>
            {[
              ['Type', water.type],
              ['Surface Area', water.area],
              ['Elevation', water.elevation],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            <div className="section-title" style={{ marginTop: 16 }}>About</div>
            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.6 }}>{water.description}</p>

            <div className="section-title" style={{ marginTop: 16 }}>Known Fish Species</div>
            <div className="species-list">
              {water.commonFish.map(f => (
                <span key={f} className="species-badge">{f}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <FishIdentifierModal
          water={water}
          apiKey={apiKey}
          onClose={() => setShowModal(false)}
          onFishAdded={onFishAdded}
        />
      )}
    </>
  )
}
