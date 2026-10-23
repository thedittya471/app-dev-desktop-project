const express = require("express");
const cors = require("cors");
const examRoutes = require("./routes/examRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" })); // screenshots arrive as large base64 strings

app.get("/", (req, res) => {
  res.json({ message: "Exam backend is running" });
});

app.use("/exam", examRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });
});

// Only listen when run directly (tests import the app instead)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Exam backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
