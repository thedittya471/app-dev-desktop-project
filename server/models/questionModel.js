const fs = require("fs");
const path = require("path");

const questionsPath = path.join(__dirname, "..", "data", "questions.json");

function findAll() {
  return JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
}

function findById(id) {
  return findAll().find((item) => item.id === Number(id));
}

// Never send correctAnswer to the student
function forStudent(question) {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
  };
}

module.exports = { findAll, findById, forStudent };
