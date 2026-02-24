const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});



const cors = require("cors");


app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {

  socket.on("join-room", ({ roomId, name }) => {
    // If user had a pending removal, cancel it
if (pendingRemovals[name]) {
  clearTimeout(pendingRemovals[name]);
  delete pendingRemovals[name];
}
    
    socket.join(roomId);

    socket.data.roomId = roomId;
    socket.data.name = name;

    console.log(`Socket ${socket.id} joined room ${roomId} as ${name}`);

    const room = rooms[roomId];
    if (room) {
      socket.emit("room-state", room);
    }
  });

 socket.on("disconnect", () => {
  const { roomId, name } = socket.data;

  if (!roomId || !name) return;

  pendingRemovals[name] = setTimeout(() => {
    const room = rooms[roomId];
    if (!room) return;

    room.approved = room.approved.filter(u => u.name !== name);
    room.waiting = room.waiting.filter(u => u.name !== name);

    console.log(`${name} permanently removed from room ${roomId}`);

    broadcastRoom(roomId);
    delete pendingRemovals[name];
  }, 5000); // 5 second grace period
});
});




/* In-memory storage */
const rooms = {};
const pendingRemovals = {};
function broadcastRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("room-state", room);
}

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
  return res.json({ status: "joined" });
}

  // already waiting?
  const inWaiting = room.waiting.find(p => p.name === name);
  if (inWaiting) {
    return res.status(400).json({ error: "Already waiting for approval" });
  }

  // add to waiting list
  room.waiting.push({ name });
 broadcastRoom(req.params.id);

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
   broadcastRoom(req.params.id);
  res.json({ success: true });
});





server.listen(4000, () => {
  console.log("API running on http://localhost:4000");
});

