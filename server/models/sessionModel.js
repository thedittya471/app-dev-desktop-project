const fs = require("fs");
const path = require("path");

// STORAGE_DIR lets tests write somewhere other than server/data
const storageDir = process.env.STORAGE_DIR || path.join(__dirname, "..", "data");
const sessionsPath = path.join(storageDir, "sessions.json");
const snapshotsDir = path.join(__dirname, "..", "..", "snapshots");
const KIND_FOLDERS = { webcam: "camera", screen: "screen" };

// ponytail: whole file is read/written on every request; fine for one user, use a DB for many
function readSessions() {
  if (!fs.existsSync(sessionsPath)) return [];
  return JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));
}

function saveSessions(sessions) {
  fs.mkdirSync(storageDir, { recursive: true });
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
}

function findById(sessionId) {
  return readSessions().find((item) => item.sessionId === sessionId);
}

function create({ userId, name }) {
  const session = {
    sessionId: `session-${Date.now()}`,
    userId,
    name,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    status: "in-progress",
    attempted: 0,
    correct: 0,
    wrong: 0,
    answers: [],
    events: [],
  };
  saveSessions([...readSessions(), session]);
  return session;
}

function save(session) {
  saveSessions(readSessions().map((item) => (item.sessionId === session.sessionId ? session : item)));
}

// Saves to snapshots/<sessionId>/<camera|screen>/<time>.jpg
// Only call with a sessionId that came from findById, so it can't escape snapshotsDir
function saveCapture(sessionId, kind, dataUrl) {
  const [, type, base64] = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  const dir = path.join(snapshotsDir, sessionId, KIND_FOLDERS[kind]);
  const file = `${new Date().toISOString().replace(/[:.]/g, "-")}.${type === "jpeg" ? "jpg" : "png"}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), Buffer.from(base64, "base64"));
  return file;
}

module.exports = { findById, create, save, saveCapture };
