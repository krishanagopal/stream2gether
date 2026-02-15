

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
  const id = Math.random().toString(36).substring(2, 8);

  rooms[id] = {
    id,
    createdAt: Date.now(),
    participants:[]
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

app.post("/rooms/:id/join",(req,res)=>{
  const room =rooms[req.params.id];

  if(!room){
    return res.status(404).json({error:"room not found"});
  }
  const{name}=req.body;
room.participants.push({name});

res.json({success:true,participants:room.participants});
})



app.listen(4000, () => {
  console.log("API running on http://localhost:4000");
});
