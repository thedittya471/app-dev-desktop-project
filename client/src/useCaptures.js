import { useEffect } from 'react'
import { request } from './api.js'

const MIN_DELAY_MS = 5_000
const MAX_DELAY_MS = 30_000
const randomDelay = () => MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)

// While the test runs, send a webcam photo and screenshots to the server,
// each on its own random 5–30 s timer so the timing can't be predicted.
export default function useCaptures(sessionId) {
  useEffect(() => {
    if (!sessionId) return

    let stopped = false
    const timers = {}
    let cameraStream
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true

    // Turn the camera on now rather than at the first photo: a camera needs a second or two
    // to adjust to the light, and the first photo comes at least MIN_DELAY_MS later.
    async function openCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (stopped) {
        // The test ended while the camera was starting
        stream.getTracks().forEach((track) => track.stop())
        return false
      }
      cameraStream = stream
      video.srcObject = stream
      await video.play()
      return true
    }

    // Shared by every photo; reset on failure so the next photo tries again
    let cameraReady = null
    function startCamera() {
      cameraReady ??= openCamera().catch((err) => {
        cameraReady = null
        throw err
      })
      return cameraReady
    }
    startCamera().catch(() => {}) // a failure is retried and logged when the first photo is due

    async function cameraPhotos() {
      if (!(await startCamera())) return []
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      return [canvas.toDataURL('image/jpeg', 0.7)]
    }

    function schedule(kind, takeImages) {
      timers[kind] = setTimeout(async () => {
        try {
          for (const image of await takeImages()) {
            if (stopped) return
            await request('/exam/capture', { sessionId, kind, image })
          }
        } catch (err) {
          // ponytail: failures are only logged; report them to /exam/event if missed captures must be visible
          console.error(`${kind} capture failed:`, err)
        }
        if (!stopped) schedule(kind, takeImages)
      }, randomDelay())
    }

    schedule('webcam', cameraPhotos)
    schedule('screen', window.api.captureScreens)

    return () => {
      stopped = true
      Object.values(timers).forEach(clearTimeout)
      cameraStream?.getTracks().forEach((track) => track.stop())
    }
  }, [sessionId])
}
