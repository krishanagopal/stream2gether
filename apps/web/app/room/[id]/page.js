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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isHost = !!hostName;
  const mediaReadyRef = useRef(false);



  useEffect(() => {
      if (!isHost) return;
  async function getMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      window.localStream = stream;
      mediaReadyRef.current = true;
      socket?.emit("media-ready");

    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  }

  getMedia();
}, [isHost]);

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

//room state
if (!isHost) return;

if (!mediaReadyRef.current) {
  console.log("Waiting for media readiness");
  return;
}

otherPeers.forEach(async (peer) => {
 let pc = peerConnectionsRef.current[peer.socketId];

if (
  pc &&
  pc.connectionState !== "failed" &&
  pc.connectionState !== "closed"
) {
  console.log("Already connected:", peer.name);
  return;
}

  console.log("Creating RTCPeerConnection for:", peer.name);

  pc = new RTCPeerConnection();
pc.ontrack = (event) => {
  console.log("Host received remote stream");
};
  
  pc.onconnectionstatechange = () => {
  if (
    pc.connectionState === "failed" ||
    pc.connectionState === "disconnected" ||
    pc.connectionState === "closed"
  ) {
    delete peerConnectionsRef.current[peer.socketId];
  }
};
  pc.onnegotiationneeded = async () => {
  console.log("Negotiation triggered");
};

  peerConnectionsRef.current[peer.socketId] = pc;

  if (window.localStream) {
    const stream = window.localStream;

stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});
await new Promise(r => setTimeout(r, 0));

  }

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

  const handler = async ({ from, signalData }) => {

    let pc = peerConnectionsRef.current[from];

    if (!pc || pc.connectionState === "closed") {
      console.log("Creating PC for incoming signal");

      pc = new RTCPeerConnection();
      peerConnectionsRef.current[from] = pc;
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

     pc.ontrack = (event) => {
  console.log("Guest received stream");

  if (remoteVideoRef.current) {
    const video = remoteVideoRef.current;

    video.srcObject = event.streams[0];

    video.onloadedmetadata = () => {
      video.play().catch(err =>
        console.log("Autoplay prevented:", err)
      );
    };
  }
};

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

    // ✅ OFFER RECEIVED (guest side)
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

      console.log("Answer sent");
    }

    // ✅ ANSWER RECEIVED (host side)
    if (signalData.type === "answer") {
      await pc.setRemoteDescription(
        new RTCSessionDescription(signalData.sdp)
      );

      console.log("Answer received");
    }

    // ✅ ICE
    if (signalData.type === "ice-candidate") {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(signalData.candidate);
        }
      } catch {
        console.log("ICE skipped");
      }
    }
  };

  socket.on("signal", handler);

  return () => {
    socket.off("signal", handler);
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


    <h3>My Video</h3>
<video
  ref={localVideoRef}
  autoPlay
  playsInline
  muted
  style={{ width: 300 }}
/>


<h3>Host Stream</h3>
<video
  ref={remoteVideoRef}
  autoPlay
  playsInline
  muted
  style={{ width: 400 }}
/>

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


