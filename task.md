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

## 2. Express backend (`server/`, MVC, port `PORT` or 3000, routes under `/exam`)
- [x] `data/questions.json` with 5 MCQs (`id`, `question`, `options`, `correctAnswer` index).
- [x] `cors` + `express.json({ limit: '20mb' })`; sessions stored in `data/sessions.json`.
- [x] `POST /exam/start` `{ userId, name }` → `{ sessionId }`.
- [x] `GET /exam/mcq` and `GET /exam/mcq/:id` → questions **without** `correctAnswer`.
- [x] `POST /exam/answer` `{ sessionId, questionId, selectedAnswer }` → scores it; no duplicates, none after submit.
- [x] `GET /exam/session/:sessionId` → session progress.
- [x] `POST /exam/capture` `{ sessionId, kind: 'webcam' | 'screen', image }` → `data/captures/<sessionId>/<kind>-<time>.jpg|png`.
- [x] `POST /exam/event` `{ sessionId, type }` → appended to the session's `events` (e.g. blur, fullscreen exit).
- [x] `POST /exam/submit` `{ sessionId }` → final result; can only submit once.
- [x] Tests: `npm test` (`server/exam.test.js`).

## 3. Electron main process (`electron/main.js` + `preload.js`)
- [ ] Create `BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`, preload script); load the Vite dev URL (`http://localhost:5173`).
- [ ] IPC `request-permissions`:
  - Camera → `systemPreferences.askForMediaAccess('camera')`.
  - Screen → `systemPreferences.getMediaAccessStatus('screen')`; if not granted, call `desktopCapturer.getSources` once to trigger the macOS prompt (user enables it in System Settings and relaunches).
  - Return `{ camera, screen }`.
- [ ] IPC `start-test(sessionId)` → `win.setKiosk(true)` and start a screen-capture timer (every 30s):
  `desktopCapturer.getSources({ types: ['screen'], thumbnailSize })` → `thumbnail.toDataURL()` → `POST /exam/capture`.
- [ ] On window `blur` / `leave-full-screen` during the test → `POST /exam/event`.
- [ ] IPC `quit` → stop timer, `app.quit()`.
- [ ] `preload.js`: expose `window.api = { requestPermissions, startTest, quit }` via `contextBridge`.

## 4. React UI (`client/src/`)
- [ ] **PermissionScreen**: "Allow camera" and "Allow screen recording" buttons with ✓ status; camera preview via `getUserMedia({ video: true })`. "Start test" enabled only when both are granted.
- [ ] On Start: `POST /exam/start` → `window.api.startTest(sessionId)` → `GET /exam/mcq`.
- [ ] **TestScreen**: render questions as radio-button groups; send each pick with `POST /exam/answer`.
- [ ] Webcam snapshot every 30s: draw hidden `<video>` to `<canvas>` → `toDataURL('image/jpeg', 0.7)` → `POST /exam/capture`.
- [ ] **Submit**: `POST /exam/submit` → on success `window.api.quit()`; on failure show an error and keep the app open.

## 5. Run & verify
- [ ] Terminal 1: `npm run server` · Terminal 2: `npm run client` · Terminal 3: `npm start`.
- [ ] Grant both permissions → Start → window goes fullscreen.
- [ ] After ~1 min, `server/data/captures/<sessionId>/` has `webcam-*.jpg` and `screen-*.png`.
- [ ] Cmd+Tab away → the session's `events` in `sessions.json` gets a `blur` entry.
- [ ] Submit → session status is `submitted`, app closes.

---

**Out of scope for now:** login, timer/countdown, scoring, database, cloud upload, face detection, packaging (electron-builder).
