import { useState } from 'react'
import { coloradoWaters } from '../data/coloradoWaters'

const W = 720, H = 450
const LAT_MAX = 41.05, LAT_MIN = 36.5
const LNG_MIN = -109.15, LNG_MAX = -101.85

function geo(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (W - 40) + 20
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - 40) + 20
  return { x, y }
}

function makePath(waypoints) {
  return waypoints.map(([lat, lng], i) => {
    const { x, y } = geo(lat, lng)
    return `${i === 0 ? 'M' : 'L'} ${Math.round(x)},${Math.round(y)}`
  }).join(' ')
}

function waterRx(areaStr) {
  const acres = parseInt(areaStr.replace(/,/g, '')) || 500
  return Math.max(7, Math.min(24, Math.sqrt(acres) * 0.13))
}

const RIVERS = [
  { points: [[40.23,-105.82],[40.05,-106.38],[39.55,-107.32],[39.07,-108.55],[39.0,-109.1]], label: 'Colorado R.' },
  { points: [[38.93,-105.51],[39.74,-104.98],[40.42,-104.7],[41.0,-103.7]], label: 'S. Platte R.' },
  { points: [[39.25,-106.3],[38.53,-106.0],[38.44,-105.24],[38.26,-104.73],[38.05,-102.05]], label: 'Arkansas R.' },
  { points: [[37.85,-106.93],[37.47,-105.87],[37.0,-105.8]], label: 'Rio Grande' },
  { points: [[38.47,-107.33],[38.92,-108.36]], label: 'Gunnison R.' },
  { points: [[40.79,-106.96],[40.55,-108.55]], label: 'Yampa R.' },
]

const PEAKS = [
  [40.55,-105.65],[40.28,-105.6],[39.9,-105.58],[39.55,-105.56],[39.25,-105.62],[38.9,-105.48],
  [39.45,-106.38],[39.2,-106.45],[38.85,-106.55],
  [39.1,-107.05],[38.95,-107.15],[38.7,-107.0],
  [37.95,-107.62],[37.78,-107.88],[38.12,-107.42],[38.25,-107.52],[37.68,-106.95],[37.58,-107.12],[38.45,-107.68],
  [37.78,-105.48],[38.1,-105.52],[38.42,-105.46],[38.72,-105.52],
  [40.5,-106.72],[40.7,-106.82],[40.4,-106.65],
]

export default function ColoradoMap({ catches, onSelectWater, selectedWater }) {
  const [hovered, setHovered] = useState(null)

  const stateBorder = (() => {
    const tl = geo(41.0, -109.05)
    const tr = geo(41.0, -102.05)
    const br = geo(37.0, -102.05)
    const bl = geo(37.0, -109.05)
    return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
  })()

  return (
    <div style={{ width: '100%', height: '100%', background: '#b8cfe0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="terrain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#aec4d4" />
            <stop offset="38%"  stopColor="#b8c8a0" />
            <stop offset="65%"  stopColor="#cfc898" />
            <stop offset="100%" stopColor="#c8b87a" />
          </linearGradient>
          <radialGradient id="waterShimmer" cx="35%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#93c5fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </radialGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background */}
        <rect width={W} height={H} fill="url(#terrain)" />

        {/* State fill */}
        <polygon points={stateBorder} fill="#e8eed4" opacity="0.85" />

        {/* Mountain symbols */}
        {PEAKS.map(([lat, lng], i) => {
          const { x, y } = geo(lat, lng)
          return (
            <g key={i} opacity="0.4" style={{ pointerEvents: 'none' }}>
              <path d={`M ${x},${y - 10} L ${x - 8},${y + 2} L ${x + 8},${y + 2} Z`} fill="#5c7a40" />
              <path d={`M ${x},${y - 6} L ${x - 5},${y + 2} L ${x + 5},${y + 2} Z`} fill="white" opacity="0.5" />
            </g>
          )
        })}

        {/* Rivers */}
        {RIVERS.map((r, i) => (
          <path
            key={i}
            d={makePath(r.points)}
            fill="none"
            stroke="#5090c0"
            strokeWidth="1.6"
            opacity="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* State border */}
        <polygon
          points={stateBorder}
          fill="none"
          stroke="#1a3a5c"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.55"
        />

        {/* Water bodies */}
        {coloradoWaters.map(water => {
          const { x, y } = geo(water.lat, water.lng)
          const baseR = waterRx(water.area)
          const rx = baseR * 1.6
          const ry = baseR
          const catchCount = (catches[water.id] || []).length
          const isSelected = selectedWater?.id === water.id
          const isHovered = hovered === water.id
          const active = isSelected || isHovered

          const shortName = water.name
            .replace(' Reservoir', ' Res.')
            .replace('Lake ', 'Lk. ')
            .replace(' State Park Lake', ' SP')

          return (
            <g
              key={water.id}
              onClick={() => onSelectWater(water)}
              onMouseEnter={() => setHovered(water.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow halo */}
              {active && (
                <ellipse
                  cx={x} cy={y}
                  rx={rx + 10} ry={ry + 8}
                  fill={isSelected ? '#3b82f6' : '#93c5fd'}
                  opacity={isSelected ? 0.5 : 0.4}
                />
              )}

              {/* Water body shape */}
              <ellipse
                cx={x} cy={y}
                rx={rx} ry={ry}
                fill={isSelected ? '#1d4ed8' : isHovered ? '#2563eb' : '#3b82f6'}
                stroke={isSelected ? '#bfdbfe' : '#dbeafe'}
                strokeWidth={isSelected ? 2 : 1}
                filter={isSelected ? 'url(#shadow)' : undefined}
              />

              {/* Shimmer highlight */}
              <ellipse
                cx={x} cy={y}
                rx={rx} ry={ry}
                fill="url(#waterShimmer)"
                style={{ pointerEvents: 'none' }}
              />

              {/* Catch badge */}
              {catchCount > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={x + rx * 0.68} cy={y - ry * 0.7} r="7" fill="#dc2626" />
                  <text
                    x={x + rx * 0.68} y={y - ry * 0.7 + 4}
                    textAnchor="middle" fontSize="7" fontWeight="bold" fill="white"
                  >{catchCount > 9 ? '9+' : catchCount}</text>
                </g>
              )}

              {/* Label */}
              <text
                x={x} y={y + ry + 11}
                textAnchor="middle"
                fontSize={active ? 9 : 7.5}
                fontWeight={isSelected ? '700' : '600'}
                fill={isSelected ? '#1e3a8a' : '#1e3a5f'}
                stroke="rgba(232,238,212,0.8)"
                strokeWidth="2.5"
                paintOrder="stroke"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {shortName}
              </text>

              <title>{water.name} · {water.type} · {water.area} · {catchCount} catch{catchCount !== 1 ? 'es' : ''} logged</title>
            </g>
          )
        })}

        {/* Watermark */}
        <text
          x={W / 2} y={H / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="40" fontWeight="900" letterSpacing="10"
          fill="#1a3a5c" opacity="0.05"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >COLORADO</text>

        {/* Compass */}
        <g transform="translate(678, 38)" opacity="0.65">
          <circle cx="0" cy="0" r="16" fill="white" opacity="0.8" stroke="#1a3a5c" strokeWidth="0.5" />
          <text x="0" y="-6" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a3a5c">N</text>
          <path d="M 0,-13 L 2.5,-3 L 0,-6 L -2.5,-3 Z" fill="#dc2626" />
          <path d="M 0,13 L 2.5,3 L 0,6 L -2.5,3 Z" fill="#9ca3af" />
        </g>

        {/* Legend */}
        <g transform="translate(540, 398)">
          <rect x="-4" y="-14" width="162" height="44" rx="6" fill="white" opacity="0.75" />
          <ellipse cx="10" cy="0" rx="11" ry="7" fill="#3b82f6" stroke="#dbeafe" strokeWidth="1" />
          <text x="28" y="4" fontSize="9" fill="#1e3a5f" fontWeight="600">Water body — click to open</text>
          <circle cx="10" cy="20" r="6" fill="#dc2626" />
          <text x="10" y="24" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">3</text>
          <text x="28" y="24" fontSize="9" fill="#1e3a5f" fontWeight="600">Number of catches logged</text>
        </g>
      </svg>
    </div>
  )
}
