import { useState } from 'react'
import PermissionsScreen from './PermissionsScreen.jsx'
import TestScreen from './TestScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('home') // home | permissions | test

  function startTest() {
    window.api.lockTest()
    setScreen('test')
  }

  if (screen === 'permissions') return <PermissionsScreen onReady={startTest} />

  if (screen === 'test') return <TestScreen />

  return (
    <main className="card">
      <h1>Proctored Test</h1>
      <p className="muted">This test is monitored. Before you begin, please note:</p>
      <ul className="rules">
        <li>Your camera takes a photo of you at regular intervals.</li>
        <li>Your screen is captured at regular intervals.</li>
        <li>Once the test starts, the app stays in full screen and you can't switch apps or close it until you submit.</li>
      </ul>
      <button type="button" className="primary" onClick={() => setScreen('permissions')}>
        Take test
      </button>
    </main>
  )
}
