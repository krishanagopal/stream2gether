

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* In-memory storage */
const rooms = {};

/* Health check */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* Create room */
app.post("/rooms", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }

  const id = Math.random().toString(36).substring(2, 8);

  rooms[id] = {
    id,
    host: name,
    approved: [{ name }],
    waiting: [],
  };

  res.json({ roomId: id });
});


/* Get room info */
app.get("/rooms/:id", (req, res) => {
  const room = rooms[req.params.id];

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json(room);
});

app.post("/rooms/:id/join", (req, res) => {
  const room = rooms[req.params.id];

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }

  // already approved?
  const inApproved = room.approved.find(p => p.name === name);
  if (inApproved) {
    return res.status(400).json({ error: "Already in room" });
  }

  // already waiting?
  const inWaiting = room.waiting.find(p => p.name === name);
  if (inWaiting) {
    return res.status(400).json({ error: "Already waiting for approval" });
  }

  // add to waiting list
  room.waiting.push({ name });

  res.json({ status: "waiting" });
});

app.post("/rooms/:id/approve", (req, res) => {
  const room = rooms[req.params.id];

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { name } = req.body;

  const index = room.waiting.findIndex(u => u.name === name);

  if (index === -1) {
    return res.status(400).json({ error: "User not in waiting list" });
  }

  // remove from waiting
  const [user] = room.waiting.splice(index, 1);

  // add to approved
  room.approved.push(user);

  res.json({ success: true });
});





app.listen(4000, () => {
  console.log("API running on http://localhost:4000");
});
