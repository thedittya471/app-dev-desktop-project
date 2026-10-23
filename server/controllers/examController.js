const Question = require("../models/questionModel");
const Session = require("../models/sessionModel");

const CAPTURE_KINDS = ["webcam", "screen"];
const IMAGE_DATA_URL = /^data:image\/(png|jpeg);base64,.+$/;

function startExam(req, res) {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ message: "userId and name are required" });
  }

  const session = Session.create({ userId, name });
  res.status(201).json({ message: "Exam session started", sessionId: session.sessionId });
}

function getQuestions(req, res) {
  res.json(Question.findAll().map(Question.forStudent));
}

function getQuestion(req, res) {
  const question = Question.findById(req.params.id);

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(Question.forStudent(question));
}

function submitAnswer(req, res) {
  const { sessionId, questionId, selectedAnswer } = req.body;

  if (!sessionId || questionId === undefined || selectedAnswer === undefined) {
    return res.status(400).json({ message: "sessionId, questionId and selectedAnswer are required" });
  }

  const question = Question.findById(questionId);
  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  const session = Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }
  if (session.status !== "in-progress") {
    return res.status(400).json({ message: "Exam is already submitted" });
  }
  if (session.answers.some((answer) => answer.questionId === question.id)) {
    return res.status(400).json({ message: "Question already answered" });
  }

  const isCorrect = Number(selectedAnswer) === question.correctAnswer;

  session.answers.push({
    questionId: question.id,
    selectedAnswer: Number(selectedAnswer),
    isCorrect,
    answeredAt: new Date().toISOString(),
  });
  session.attempted += 1;
  if (isCorrect) session.correct += 1;
  else session.wrong += 1;

  Session.save(session);

  res.json({
    message: "Answer saved",
    isCorrect,
    attempted: session.attempted,
    correct: session.correct,
    wrong: session.wrong,
  });
}

function getSession(req, res) {
  const session = Session.findById(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  res.json(session);
}

function saveCapture(req, res) {
  const { sessionId, kind, image } = req.body;

  if (!CAPTURE_KINDS.includes(kind) || typeof image !== "string" || !IMAGE_DATA_URL.test(image)) {
    return res.status(400).json({ message: "kind must be webcam or screen, and image a png/jpeg data URL" });
  }

  const session = Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const file = Session.saveCapture(session.sessionId, kind, image);
  res.status(201).json({ message: "Capture saved", file });
}

// Proctoring events from Electron, e.g. "blur" or "leave-full-screen"
function logEvent(req, res) {
  const { sessionId, type } = req.body;

  if (!type || typeof type !== "string") {
    return res.status(400).json({ message: "type is required" });
  }

  const session = Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  (session.events ||= []).push({ type: type.slice(0, 100), at: new Date().toISOString() });
  Session.save(session);

  res.status(201).json({ message: "Event logged" });
}

function submitExam(req, res) {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required" });
  }

  const session = Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }
  if (session.status !== "in-progress") {
    return res.status(400).json({ message: "Exam is already submitted" });
  }

  session.status = "submitted";
  session.submittedAt = new Date().toISOString();
  Session.save(session);

  res.json({
    message: "Exam submitted successfully",
    result: { attempted: session.attempted, correct: session.correct, wrong: session.wrong },
  });
}

module.exports = {
  startExam,
  getQuestions,
  getQuestion,
  submitAnswer,
  getSession,
  saveCapture,
  logEvent,
  submitExam,
};
