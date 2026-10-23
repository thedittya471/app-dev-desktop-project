import { useEffect, useRef, useState } from 'react'
import { request } from './api.js'
import useCaptures from './useCaptures.js'

export default function TestScreen() {
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const startedFor = useRef(-1)
  const saved = useRef(new Set()) // question ids the server already has, so retries don't resend them

  useCaptures(sessionId)

  // Start a session and load questions. StrictMode runs effects twice in dev, so guard per attempt.
  useEffect(() => {
    if (startedFor.current === attempt) return
    startedFor.current = attempt

    // ponytail: placeholder identity until there is a name/login step
    const candidate = { userId: `user-${Date.now()}`, name: 'Candidate' }
    Promise.all([request('/exam/start', candidate), request('/exam/mcq')])
      .then(([session, list]) => {
        setSessionId(session.sessionId)
        setQuestions(list)
      })
      .catch((err) => setError(err.message))
  }, [attempt])

  if (!questions) {
    return (
      <main className="card">
        <h1>Test</h1>
        {error ? (
          <>
            <p className="error" role="alert">{error}</p>
            <button type="button" className="primary spaced" onClick={() => { setError(''); setAttempt((n) => n + 1) }}>
              Try again
            </button>
          </>
        ) : (
          <p className="muted">Loading questions…</p>
        )}
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="card">
        <h1>Test</h1>
        <p className="muted">There are no questions in this test.</p>
      </main>
    )
  }

  const question = questions[index]
  const isLast = index === questions.length - 1

  async function next(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (!saved.current.has(question.id)) {
        await request('/exam/answer', { sessionId, questionId: question.id, selectedAnswer: selected })
        saved.current.add(question.id)
      }
      if (isLast) {
        await request('/exam/submit', { sessionId })
        await window.api.quit()
        return
      }
      setIndex(index + 1)
      setSelected(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="card">
      <p className="muted">Question {index + 1} of {questions.length}</p>
      <progress className="progress" value={index + 1} max={questions.length} />

      <form onSubmit={next}>
        <fieldset className="question" disabled={busy}>
          <legend><h1>{question.question}</h1></legend>
          <div className="options">
            {question.options.map((option, i) => (
              <label key={i} className="option">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary spaced" disabled={selected === null || busy}>
          {busy ? 'Saving…' : isLast ? 'Submit' : 'Next'}
        </button>
      </form>
    </main>
  )
}
