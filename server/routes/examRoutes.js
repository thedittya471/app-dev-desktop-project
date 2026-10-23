const express = require("express");
const exam = require("../controllers/examController");

const router = express.Router();

router.post("/start", exam.startExam);
router.get("/mcq", exam.getQuestions);
router.get("/mcq/:id", exam.getQuestion);
router.post("/answer", exam.submitAnswer);
router.get("/session/:sessionId", exam.getSession);
router.post("/capture", exam.saveCapture);
router.post("/event", exam.logEvent);
router.post("/submit", exam.submitExam);

module.exports = router;
