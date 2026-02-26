"use client";

import { useState, useEffect,useRef  } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";


export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const hostName = searchParams.get("host");

  // state
  const [name, setName] = useState("");
  const [status, setStatus] = useState("enter-name");
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const peerConnectionsRef = useRef({});


  useEffect(() => {
  const savedName = localStorage.getItem(`watchparty-name-${params.id}`);

  if (!savedName) return;

  setName(savedName);

  async function rejoin() {
    try {
      const res = await fetch(`http://localhost:4000/rooms/${params.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: savedName }),
      });

      const data = await res.json();

      if (data.status === "waiting") {
        setStatus("waiting");
      } else {
        setStatus("joined");
      }
    } catch {
      setStatus("enter-name");
    }
  }

  rejoin();
}, [params.id]);

  /* ---------------- HOST AUTO JOIN ---------------- */
useEffect(() => {
  if (!socket) return;

  socket.on("room-state", (room) => {
    setParticipants(room.approved || []);
    setWaitingUsers(room.waiting || []);

const otherPeers = (room.approved || []).filter(
  user => user.name !== name
);

console.log("Peers I should connect to:", otherPeers);
otherPeers.forEach(async (peer) => {
  let pc = peerConnectionsRef.current[peer.socketId];

  if (!pc) {
    console.log("Creating RTCPeerConnection for:", peer.name);

    pc = new RTCPeerConnection();
    peerConnectionsRef.current[peer.socketId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          targetSocketId: peer.socketId,
          signalData: {
            type: "ice-candidate",
            candidate: event.candidate
          }
        });
      }
    };
  }

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("signal", {
    targetSocketId: peer.socketId,
    signalData: {
      type: "offer",
      sdp: offer
    }
  });

  console.log("Sent offer to:", peer.name);
});




    const isApproved = room.approved?.find(p => p.name === name);
    const isWaiting = room.waiting?.find(p => p.name === name);

    if (!name) return; // do nothing if user hasn't entered name yet
if (isApproved) {
  setStatus("joined");
} else if (isWaiting && status !== "joined") {
  setStatus("waiting");
}
  });

  return () => {
    socket.off("room-state");
  };
}, [socket, name]);


useEffect(() => {
  if (!socket) return;

  socket.on("signal", async ({ from, signalData }) => {
    console.log("Received signal from:", from);
    console.log("Signal data:", signalData);

    let pc = peerConnectionsRef.current[from];

    if (!pc) {
      pc = new RTCPeerConnection();
      peerConnectionsRef.current[from] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            targetSocketId: from,
            signalData: {
              type: "ice-candidate",
              candidate: event.candidate
            }
          });
        }
      };
    }

    if (signalData.type === "offer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(signalData.sdp)
      );

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("signal", {
        targetSocketId: from,
        signalData: {
          type: "answer",
          sdp: answer
        }
      });

      console.log("Sent answer to:", from);
    }

    if (signalData.type === "answer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(signalData.sdp)
      );

      console.log("Received answer from:", from);
    }

    if (signalData.type === "ice-candidate") {
      await pc.addIceCandidate(signalData.candidate);
    }
  });

  return () => {
    socket.off("signal");
  };
}, [socket]);


  useEffect(() => {
    if (!hostName) return;

    setName(hostName);
    setStatus("joined");
  }, [hostName]);

  /* ---------------- JOIN ROOM ---------------- */
  async function joinRoom() {
    setStatus("joining");
    setError("");

    try {
      // check room exists
      const check = await fetch(`http://localhost:4000/rooms/${params.id}`);
      if (!check.ok) {
        setError("Room expired. Create a new one.");
        setStatus("enter-name");
        return;
      }

      // request join
      const res = await fetch(`http://localhost:4000/rooms/${params.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        setStatus("enter-name");
        return;
      }

      if (data.status === "waiting") {
  localStorage.setItem(`watchparty-name-${params.id}`, name);
  setStatus("waiting");
} else {
  localStorage.setItem("watchparty-name", name);
  setStatus("joined");
}

    } catch {
      setError("Server unreachable");
      setStatus("enter-name");
    }
  }


  async function approveUser(name) {
  try {
    await fetch(`http://localhost:4000/rooms/${params.id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  } catch {}
}



useEffect(() => {
  if (!name) return;

  const s = io("http://localhost:4000");

s.on("connect", () => {
  console.log("My socket ID:", s.id);
  setMySocketId(s.id);
});

   

  s.emit("join-room", {
    roomId: params.id,
    name,
  });

  setSocket(s);

  return () => {
    s.disconnect();
  };
}, [params.id, name]);

  /* ---------------- POLLING PARTICIPANTS ---------------- */



  /* ---------------- UI STATES ---------------- */

  if (status === "enter-name") {
    return (
      <main style={{ padding: 40 }}>
        <h1>Enter your name</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={{ padding: 8, fontSize: 16 }}
        />

        <br /><br />

        <button onClick={joinRoom} disabled={!name}>
          Join Room
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </main>
    );
  }

  if (status === "joining") {
    return <p style={{ padding: 40 }}>Joining...</p>;
  }

  if (status === "waiting") {
    return (
      <main style={{ padding: 40 }}>
        <h2>Waiting for host approval...</h2>
        <p>The host will let you in soon.</p>
      </main>
    );
  }

  return (
  <main style={{ padding: 40 }}>
    <h1>Room: {params.id}</h1>

    <h3>Participants:</h3>
    <ul>
      {participants.map((p, i) => (
        <li key={i}>{p.name}</li>
      ))}
    </ul>

    {hostName && (
      <>
        <h3>Waiting Requests:</h3>
        <ul>
  {waitingUsers.map((u, i) => (
    <li key={i}>
      {u.name}{" "}
      <button onClick={() => approveUser(u.name)}>
        Approve
      </button>
    </li>
  ))}
</ul>

      </>
    )}
  </main>
);

}

