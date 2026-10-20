# Proctoring Test App — Tasks

Small desktop proctoring app: **Electron** (desktop shell + screen capture), **React** (UI, via Vite), **Express** (local backend).

Flow: open app → grant camera + screen permission → Start test → fullscreen + periodic webcam/screen captures → answer questions → Submit → app exits.

```
app-dev-desktop/
  server/      # Express backend (index.js, questions.json, data/)
  electron/    # main.js, preload.js
  client/      # React app (Vite)
```

---

## 1. Project setup
- [x] `npm init -y` at the root; add scripts: `server`, `client` (Vite dev), `start` (Electron).
- [x] Install: `express`, `electron` (dev), and create the React app with `npm create vite@latest client -- --template react`.
- [x] Add `.gitignore` (`node_modules`, `server/data`).

## 2. Express backend (`server/index.js`, port 4000)
- [ ] `questions.json` with 3–5 multiple-choice questions (`id`, `text`, `options`, `answer`).
- [ ] Enable CORS (one small middleware) and `express.json({ limit: '20mb' })`.
- [ ] `POST /session` → create `server/data/<timestamp>/`, return `{ sessionId }`.
- [ ] `GET /questions` → return questions **without** the `answer` field.
- [ ] `POST /capture` `{ sessionId, kind: 'webcam' | 'screen', image }` → save base64 image as `<kind>-<time>.jpg|png` in the session folder.
- [ ] `POST /event` `{ sessionId, type }` → append to `events.log` (e.g. window blur, fullscreen exit).
- [ ] `POST /submit` `{ sessionId, answers }` → save `answers.json`.
- [ ] Validate `sessionId` is digits only before using it in a file path.
- [ ] Test with `curl` before moving on.

## 3. Electron main process (`electron/main.js` + `preload.js`)
- [ ] Create `BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`, preload script); load the Vite dev URL (`http://localhost:5173`).
- [ ] IPC `request-permissions`:
  - Camera → `systemPreferences.askForMediaAccess('camera')`.
  - Screen → `systemPreferences.getMediaAccessStatus('screen')`; if not granted, call `desktopCapturer.getSources` once to trigger the macOS prompt (user enables it in System Settings and relaunches).
  - Return `{ camera, screen }`.
- [ ] IPC `start-test(sessionId)` → `win.setKiosk(true)` and start a screen-capture timer (every 30s):
  `desktopCapturer.getSources({ types: ['screen'], thumbnailSize })` → `thumbnail.toDataURL()` → `POST /capture`.
- [ ] On window `blur` / `leave-full-screen` during the test → `POST /event`.
- [ ] IPC `quit` → stop timer, `app.quit()`.
- [ ] `preload.js`: expose `window.api = { requestPermissions, startTest, quit }` via `contextBridge`.

## 4. React UI (`client/src/`)
- [ ] **PermissionScreen**: "Allow camera" and "Allow screen recording" buttons with ✓ status; camera preview via `getUserMedia({ video: true })`. "Start test" enabled only when both are granted.
- [ ] On Start: `POST /session` → `window.api.startTest(sessionId)` → `GET /questions`.
- [ ] **TestScreen**: render questions as radio-button groups; keep answers in state.
- [ ] Webcam snapshot every 30s: draw hidden `<video>` to `<canvas>` → `toDataURL('image/jpeg', 0.7)` → `POST /capture`.
- [ ] **Submit**: `POST /submit` → on success `window.api.quit()`; on failure show an error and keep the app open.

## 5. Run & verify
- [ ] Terminal 1: `npm run server` · Terminal 2: `npm run client` · Terminal 3: `npm start`.
- [ ] Grant both permissions → Start → window goes fullscreen.
- [ ] After ~1 min, `server/data/<id>/` has `webcam-*.jpg` and `screen-*.png`.
- [ ] Cmd+Tab away → `events.log` gets a line.
- [ ] Submit → `answers.json` saved, app closes.

---

**Out of scope for now:** login, timer/countdown, scoring, database, cloud upload, face detection, packaging (electron-builder).
