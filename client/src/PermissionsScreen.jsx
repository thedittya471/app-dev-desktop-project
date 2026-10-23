import { useEffect, useRef, useState } from 'react'

const DEVICES = {
  camera: { name: 'Camera', constraints: { video: true } },
  microphone: { name: 'Microphone', constraints: { audio: true } },
}

const blockedMessage = (name) =>
  `${name} access is blocked. Allow it in System Settings → Privacy & Security → ${name}, then restart the app.`

function deviceErrorMessage(name, err) {
  if (err.name === 'NotAllowedError') return blockedMessage(name)
  if (err.name === 'NotFoundError') return `No ${name.toLowerCase()} was found. Connect one and try again.`
  return `Could not start the ${name.toLowerCase()}. Close other apps using it and try again.`
}

export default function PermissionsScreen({ onReady }) {
  const [status, setStatus] = useState({ camera: 'idle', microphone: 'idle' }) // idle | pending | granted | denied
  const [errors, setErrors] = useState({ camera: '', microphone: '' })
  const [fullscreen, setFullscreen] = useState(false)
  const videoRef = useRef(null)
  const streamsRef = useRef({})

  // window.api only exists inside Electron (see electron/preload.js)
  const api = window.api

  // Electron tells us when full screen starts or stops (Esc, green button, etc.)
  useEffect(() => {
    const unsubscribe = api?.onFullscreenChange(setFullscreen)
    const streams = streamsRef.current // same object for the component's life; allow() fills it in
    return () => {
      unsubscribe?.()
      Object.values(streams).forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
    }
  }, [api])

  useEffect(() => {
    if (status.camera === 'granted' && videoRef.current) videoRef.current.srcObject = streamsRef.current.camera
  }, [status.camera])

  async function allow(kind) {
    const { name, constraints } = DEVICES[kind]
    setStatus((s) => ({ ...s, [kind]: 'pending' }))
    setErrors((e) => ({ ...e, [kind]: '' }))
    try {
      if (!(await api.requestMediaAccess(kind))) throw new DOMException(blockedMessage(name), 'NotAllowedError')
      streamsRef.current[kind] = await navigator.mediaDevices.getUserMedia(constraints)
      setStatus((s) => ({ ...s, [kind]: 'granted' }))
    } catch (err) {
      setStatus((s) => ({ ...s, [kind]: 'denied' }))
      setErrors((e) => ({ ...e, [kind]: deviceErrorMessage(name, err) }))
    }
  }

  async function enterFullscreen() {
    if (await api.enterFullscreen()) setFullscreen(true)
  }

  if (!api) {
    return (
      <main className="card">
        <h1>Open the desktop app</h1>
        <p className="muted">Camera, microphone and full screen checks only work in the app. Run <code>npm start</code>.</p>
      </main>
    )
  }

  const ready = status.camera === 'granted' && status.microphone === 'granted' && fullscreen

  function deviceAction(kind) {
    const { name } = DEVICES[kind]
    if (status[kind] === 'granted') return <p className="granted">{name} allowed</p>
    return (
      <button type="button" onClick={() => allow(kind)} disabled={status[kind] === 'pending'}>
        {status[kind] === 'pending'
          ? 'Waiting…'
          : status[kind] === 'denied'
            ? `Try ${name.toLowerCase()} again`
            : `Allow ${name.toLowerCase()}`}
      </button>
    )
  }

  return (
    <main className="card">
      <h1>Before you start</h1>
      <p className="muted">All three are required for the whole test.</p>

      <ul className="permissions">
        <li className="permission">
          <div className="permission-text">
            <h2>Camera</h2>
            <p className="muted">Used to take photos of you during the test.</p>
            {errors.camera && <p className="error" role="alert">{errors.camera}</p>}
          </div>
          {deviceAction('camera')}
          {status.camera === 'granted' && (
            <video ref={videoRef} className="preview" autoPlay muted playsInline aria-label="Camera preview" />
          )}
        </li>

        <li className="permission">
          <div className="permission-text">
            <h2>Microphone</h2>
            <p className="muted">Must stay on during the test.</p>
            {errors.microphone && <p className="error" role="alert">{errors.microphone}</p>}
          </div>
          {deviceAction('microphone')}
        </li>

        <li className="permission">
          <div className="permission-text">
            <h2>Full screen</h2>
            <p className="muted">The test runs in full screen. Leaving it is recorded.</p>
          </div>
          {fullscreen ? (
            <p className="granted">Full screen on</p>
          ) : (
            <button type="button" onClick={enterFullscreen}>Enter full screen</button>
          )}
        </li>
      </ul>

      <button type="button" className="primary" onClick={onReady} disabled={!ready}>
        Go to test
      </button>
      {!ready && <p className="muted hint">Allow the camera and microphone, and enter full screen to continue.</p>}
    </main>
  )
}
