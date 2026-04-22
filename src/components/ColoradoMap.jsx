import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { coloradoWaters } from '../data/coloradoWaters'

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function makeIcon(catchCount) {
  const color = catchCount > 20 ? '#dc2626' : catchCount > 10 ? '#ea580c' : catchCount > 0 ? '#2d7a3e' : '#1a6fa8'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <ellipse cx="18" cy="38" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/>
      <path d="M18 2 C10 2 4 8 4 16 C4 26 18 38 18 38 C18 38 32 26 32 16 C32 8 26 2 18 2Z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="16" r="8" fill="white" opacity="0.9"/>
      <text x="18" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">🐟</text>
    </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
    className: '',
  })
}

export default function ColoradoMap({ catches, onSelectWater, selectedWater }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    if (mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [39.0, -105.5],
      zoom: 7,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    // Colorado state outline (approximate bounding box shading)
    const coloradoBounds = [
      [37.0, -109.05],
      [41.0, -109.05],
      [41.0, -102.05],
      [37.0, -102.05],
    ]
    L.polygon(coloradoBounds, {
      color: '#1a6fa8',
      weight: 2,
      fill: false,
      dashArray: '6 4',
      opacity: 0.4,
    }).addTo(map)

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}

    coloradoWaters.forEach(water => {
      const catchCount = (catches[water.id] || []).length
      const icon = makeIcon(catchCount)

      const marker = L.marker([water.lat, water.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:1rem">${water.name}</strong>
            <div style="color:#6b7280;font-size:0.8rem;margin:2px 0">${water.type} · ${water.elevation}</div>
            <div style="margin-top:6px;font-size:0.85rem">
              🐟 <strong>${catchCount}</strong> catch${catchCount !== 1 ? 'es' : ''} logged
            </div>
            <button
              onclick="window._selectWater('${water.id}')"
              style="margin-top:8px;width:100%;padding:6px;background:#1a6fa8;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem"
            >View Scoreboard →</button>
          </div>
        `, { maxWidth: 240 })

      marker.on('click', () => {
        onSelectWater(water)
      })

      markersRef.current[water.id] = marker
    })

    window._selectWater = (id) => {
      const water = coloradoWaters.find(w => w.id === id)
      if (water) onSelectWater(water)
    }
  }, [catches, onSelectWater])

  // Pulse selected marker
  useEffect(() => {
    if (!selectedWater) return
    const marker = markersRef.current[selectedWater.id]
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedWater.lat, selectedWater.lng], 10, { animate: true })
      marker.openPopup()
    }
  }, [selectedWater])

  return <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
