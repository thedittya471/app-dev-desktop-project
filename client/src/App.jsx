import { useState } from 'react'
import PermissionsScreen from './PermissionsScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('home') // home | permissions | test

  if (screen === 'permissions') return <PermissionsScreen onReady={() => setScreen('test')} />

  // ponytail: placeholder until the test UI (questions, captures, submit) is built
  if (screen === 'test') {
    return (
      <main className="card">
        <h1>Test</h1>
        <p className="muted">Questions will appear here.</p>
      </main>
    )
  }

  return (
    <main className="card">
      <h1>Proctored Test</h1>
      <p className="muted">This test is monitored. Before you begin, please note:</p>
      <ul className="rules">
        <li>Your camera takes a photo of you at regular intervals.</li>
        <li>Your microphone must stay on during the test.</li>
        <li>Your screen is captured at regular intervals.</li>
        <li>The test runs in full screen. Leaving it is recorded.</li>
        <li>The app closes when you submit.</li>
      </ul>
      <button type="button" className="primary" onClick={() => setScreen('permissions')}>
        Take test
      </button>
    </main>
  )
}
