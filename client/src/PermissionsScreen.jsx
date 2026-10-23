// ponytail: UI only, camera + full screen buttons are not wired up yet
export default function PermissionsScreen({ onReady }) {
  return (
    <main className="card">
      <h1>Before you start</h1>
      <p className="muted">Both are required for the whole test.</p>

      <ul className="permissions">
        <li className="permission">
          <div className="permission-text">
            <h2>Camera</h2>
            <p className="muted">Used to take photos of you during the test.</p>
          </div>
          <button type="button">Allow camera</button>
        </li>

        <li className="permission">
          <div className="permission-text">
            <h2>Full screen</h2>
            <p className="muted">The test runs in full screen. Leaving it is recorded.</p>
          </div>
          <button type="button">Enter full screen</button>
        </li>
      </ul>

      <button type="button" className="primary" onClick={onReady}>
        Go to test
      </button>
    </main>
  )
}
