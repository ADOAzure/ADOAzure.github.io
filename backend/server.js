// backend/server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const DATA_FILE = path.join(__dirname, 'state.json');

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ activeTaskId: "1", completed: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

app.get('/api/active-task', (req, res) => {
  const state = loadState();
  res.json({ activeTaskId: state.activeTaskId });
});

app.post('/api/active-task', (req, res) => {
  const { activeTaskId, completed } = req.body;
  if (!activeTaskId) return res.status(400).json({ error: 'activeTaskId is required' });

  const state = loadState();
  state.activeTaskId = activeTaskId;
  if (completed) state.completed = completed;
  saveState(state);

  res.json({ message: `Task ${activeTaskId} is now active.` });
});

app.get('/api/completed-tasks', (req, res) => {
  const state = loadState();
  res.json({ completed: state.completed || [] });
});

app.post('/api/reset', (req, res) => {
  const defaultState = { activeTaskId: "1", completed: [] };
  saveState(defaultState);
  res.json({ message: 'Task state reset.' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
