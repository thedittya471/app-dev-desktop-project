const express = require('express');

const PORT = 4000;
const app = express();

app.use(express.json({ limit: '20mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
