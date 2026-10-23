const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// GET when there's no body, POST JSON otherwise. Throws an Error with the server's message.
export async function request(path, body) {
  let res
  try {
    res = await fetch(API_URL + path, body && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error("Can't reach the exam server. Make sure it's running, then try again.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}
