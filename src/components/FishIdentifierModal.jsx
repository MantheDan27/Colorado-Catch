import { useState, useRef, useCallback } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

async function identifyFishWithClaude(imageBase64, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
                data: imageBase64.split(',')[1],
              },
            },
            {
              type: 'text',
              text: `You are a fish identification expert for Colorado waters. Identify the fish species in this image.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "species": "Common Name of Fish",
  "scientificName": "Scientific name",
  "confidence": "high/medium/low",
  "description": "1-2 sentences about this fish and its presence in Colorado",
  "found_in_colorado": true/false
}

If you cannot identify a fish or the image doesn't contain a fish, respond:
{"error": "No fish detected or image unclear"}`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text.trim()
  return JSON.parse(text)
}

// True when running inside a Capacitor native wrapper (Android/iOS)
const isNative = () => !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.())

export default function FishIdentifierModal({ water, apiKey, onClose, onFishAdded }) {
  const [tab, setTab] = useState('upload') // 'upload' | 'camera'
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [identifying, setIdentifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [anglerName, setAnglerName] = useState('')
  const [notes, setNotes] = useState('')
  const [stream, setStream] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageDataUrl(ev.target.result)
      setResult(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  // Use Capacitor Camera plugin on native (Android/iOS), web APIs on browser/Electron
  const captureNativePhoto = async (source) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      })
      setImageDataUrl(photo.dataUrl)
      setResult(null)
      setError(null)
    } catch (e) {
      const msg = e?.message || ''
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('no image')) {
        setError('Could not access camera. Please check permissions and try again.')
      }
    }
  }

  const handleUploadArea = async () => {
    if (isNative()) {
      await captureNativePhoto(CameraSource.Photos)
      return
    }
    fileInputRef.current?.click()
  }

  const startCamera = async () => {
    if (isNative()) {
      await captureNativePhoto(CameraSource.Camera)
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
    } catch {
      setError('Camera access denied. Please use file upload instead.')
    }
  }

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setImageDataUrl(dataUrl)
    setResult(null)
    setError(null)
    stopCamera()
  }

  const handleIdentify = async () => {
    if (!imageDataUrl) return
    if (!apiKey) {
      setError('Please add your Anthropic API key in Settings (gear icon) to use fish identification.')
      return
    }
    setIdentifying(true)
    setError(null)
    try {
      const res = await identifyFishWithClaude(imageDataUrl, apiKey)
      if (res.error) {
        setError(res.error)
      } else {
        setResult(res)
      }
    } catch (e) {
      setError(e.message || 'Identification failed. Check your API key.')
    } finally {
      setIdentifying(false)
    }
  }

  const handleSubmit = () => {
    if (!result) return
    const entry = {
      id: Date.now(),
      species: result.species,
      scientificName: result.scientificName,
      confidence: result.confidence,
      description: result.description,
      image: imageDataUrl,
      angler: anglerName || 'Anonymous',
      notes,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
    }
    onFishAdded(water.id, entry)
    onClose()
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>🐟 Log a Catch — {water.name}</h3>
          <button className="btn-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Tab bar */}
          <div className="tab-bar" style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
            <button className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => { setTab('upload'); stopCamera() }}>
              📁 Upload Photo
            </button>
            <button className={`tab ${tab === 'camera' ? 'active' : ''}`} onClick={() => { setTab('camera'); setImageDataUrl(null); setResult(null) }}>
              📷 Take Photo
            </button>
          </div>

          {/* Upload tab */}
          {tab === 'upload' && (
            <>
              <div
                className={`upload-area ${imageDataUrl ? 'has-image' : ''}`}
                onClick={handleUploadArea}
              >
                {imageDataUrl ? (
                  <img src={imageDataUrl} alt="Fish catch" />
                ) : (
                  <>
                    <div className="upload-icon">🎣</div>
                    <div className="upload-text">
                      <strong>{isNative() ? 'Tap to choose from gallery' : 'Click to upload a photo'}</strong>
                      <p>JPG, PNG supported</p>
                    </div>
                  </>
                )}
              </div>
              {!isNative() && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              )}
            </>
          )}

          {/* Camera tab */}
          {tab === 'camera' && (
            <div className="camera-area">
              {imageDataUrl ? (
                <div className="upload-area has-image" style={{ cursor: 'default' }}>
                  <img src={imageDataUrl} alt="Captured fish" />
                </div>
              ) : isNative() ? (
                <div className="upload-area" onClick={startCamera}>
                  <div className="upload-icon">📷</div>
                  <div className="upload-text"><strong>Tap to open camera</strong></div>
                </div>
              ) : stream ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 10 }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={capturePhoto}>
                    📸 Capture Photo
                  </button>
                </>
              ) : (
                <div className="upload-area" onClick={startCamera}>
                  <div className="upload-icon">📷</div>
                  <div className="upload-text"><strong>Tap to open camera</strong></div>
                </div>
              )}
            </div>
          )}

          {/* Identify result */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, marginBottom: 14, color: '#991b1b', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          {identifying && (
            <div className="id-pending">
              <div style={{ marginBottom: 6 }}>🔍 Identifying fish with AI...</div>
              <div className="spinner" style={{ borderColor: 'rgba(146,64,14,0.3)', borderTopColor: '#92400e', margin: '0 auto' }} />
            </div>
          )}

          {result && (
            <div className="id-result">
              <h4>✅ {result.species}</h4>
              {result.scientificName && (
                <p style={{ fontStyle: 'italic', color: '#4b5563', fontSize: '0.82rem' }}>{result.scientificName}</p>
              )}
              <p style={{ marginTop: 4 }}>{result.description}</p>
              <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#6b7280' }}>
                Confidence: <strong>{result.confidence}</strong>
                {!result.found_in_colorado && ' · ⚠️ Uncommon in Colorado waters'}
              </div>
            </div>
          )}

          {/* Angler info */}
          {result && (
            <>
              <div className="form-group">
                <label className="form-label">Your Name (optional)</label>
                <input
                  className="form-input"
                  placeholder="Angler name"
                  value={anglerName}
                  onChange={e => setAnglerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g. 14 inches, caught at dawn..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          {!result ? (
            <button
              className="btn btn-primary"
              disabled={!imageDataUrl || identifying}
              onClick={handleIdentify}
            >
              {identifying ? <><span className="spinner" /> Identifying...</> : '🔍 Identify Fish'}
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit}>
              ✅ Add to Scoreboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
