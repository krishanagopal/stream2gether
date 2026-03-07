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
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, status]);
  const peerConnectionsRef = useRef({});
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isHost = !!hostName;
  const mediaReadyRef = useRef(false);
const latestRoomRef = useRef(null);

 const hostPlaybackRef = useRef({
  playing: false,
  time: 0,
  updatedAt: 0,
});

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
      connectHostToPeers();
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

    latestRoomRef.current = room;

    setParticipants(room.approved || []);
    setWaitingUsers(room.waiting || []);

    /* ================= STATUS CONTROL (FIXED) ================= */

    const isApproved = room.approved?.find(p => p.name === name);
    const isWaiting = room.waiting?.find(p => p.name === name);

    if (!name) return;

    if (isApproved) {
      setStatus("joined");   // ✅ guest enters instantly after approval
    } 
    else if (isWaiting) {
      setStatus("waiting");
    }

    /* ================= HOST CONNECTION LOGIC ================= */
    if (isHost && mediaReadyRef.current) {
      connectHostToPeers();
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

      pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionsRef.current[from] = pc;

      pc.ontrack = (event) => {
        console.log("Guest received stream track", event.track.kind);
        setRemoteStream((prev) => {
          if (prev) {
            prev.addTrack(event.track);
            return new MediaStream(prev.getTracks());
          }
          return new MediaStream([event.track]);
        });
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
  if (!socket) return;

  /* ---------------- LIVE PLAYBACK SYNC ---------------- */

 const watchHandler = (action) => {
  console.log("Guest received:", action);

  const video = remoteVideoRef.current;
  if (!video) return;

  if (action.type === "play") {
    video.play().catch(() => {});
  }

  if (action.type === "pause") {
    video.pause();
  }

  if (action.type === "seek") {
    const delay =
      (Date.now() - action.updatedAt) / 1000;

    video.currentTime = action.time + delay;
  }
};

  socket.on("watchparty-action", watchHandler);


  /* ---------------- STEP 5: HOST RESPONDS ---------------- */

  socket.on("sync-requested", (targetId) => {
    if (!isHost) return;

    socket.emit("sync-state", {
      targetId,
      state: hostPlaybackRef.current,
    });
  });


  /* ---------------- STEP 6: GUEST APPLIES ---------------- */

  socket.on("sync-state", (state) => {
    if (isHost) return;

    const video = remoteVideoRef.current;
    if (!video) return;

    const delay =
      (Date.now() - state.updatedAt) / 1000;

    video.currentTime = state.time + delay;

    if (state.playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }

    console.log("Late join synced");
  });


  return () => {
    socket.off("watchparty-action", watchHandler);
    socket.off("sync-requested");
    socket.off("sync-state");
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

s.emit("request-sync", {
  roomId: params.id,
});

 

  return () => {
    s.disconnect();
  };
}, [params.id, name]);


useEffect(() => {
  if (!isHost) return;

  const video = localVideoRef.current;
  if (!video) return;

  let lastTime = video.currentTime;

  const interval = setInterval(() => {
    if (!video) return;

    const diff = Math.abs(video.currentTime - lastTime);

    // detect manual seek (big jump)
    if (diff > 1.5) {
      console.log("Host seek detected");

      hostPlaybackRef.current = {
        playing: !video.paused,
        time: video.currentTime,
        updatedAt: Date.now(),
      };

      socket.emit("watchparty-action", {
        roomId: params.id,
        action: {
          type: "seek",
          time: video.currentTime,
          updatedAt: hostPlaybackRef.current.updatedAt,
        },
      });
    }

    lastTime = video.currentTime;

  }, 500);

  return () => clearInterval(interval);

}, [socket, isHost]);


// replaced guest-ready handling entirely with automatic host pairing on room-state
  /* ---------------- POLLING PARTICIPANTS ---------------- */

 async function startScreenShare() {
  try {
    const screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

    const screenTrack =
      screenStream.getVideoTracks()[0];

    // show locally
    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        screenStream;
    }

    // 🔥 update window.localStream for new guests
    if (window.localStream) {
      const oldVideoTrack = window.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        window.localStream.removeTrack(oldVideoTrack);
      }
      window.localStream.addTrack(screenTrack);
    }

    // 🔥 replace track for ALL guests
    Object.values(peerConnectionsRef.current)
      .forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

    console.log("Screen sharing started");

  } catch (err) {
    console.log("Screen share cancelled");
  }
}

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

  function connectHostToPeers() {
  if (!isHost) return;
  if (!mediaReadyRef.current) return;

  const room = latestRoomRef.current;
  if (!room) return;

  const otherPeers =
    (room.approved || []).filter(
      u => u.name !== name
    );

  otherPeers.forEach(async (peer) => {

    let pc =
      peerConnectionsRef.current[
        peer.socketId
      ];

    if (pc && pc.connectionState !== "closed")
      return;

    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnectionsRef.current[
      peer.socketId
    ] = pc;

    window.localStream
      .getTracks()
      .forEach(track =>
        pc.addTrack(track,
          window.localStream)
      );

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", {
          targetSocketId:
            peer.socketId,
          signalData:{
            type:"ice-candidate",
            candidate:e.candidate
          }
        });
      }
    };

    const offer =
      await pc.createOffer();

    await pc.setLocalDescription(
      offer
    );

    socket.emit("signal",{
      targetSocketId:
        peer.socketId,
      signalData:{
        type:"offer",
        sdp:offer
      }
    });
  });
}

function sendWatchAction(type) {
  if (!socket) return;

  const video = localVideoRef.current;

  hostPlaybackRef.current = {
    playing: type === "play",
    time: video?.currentTime || 0,
    updatedAt: Date.now(),
  };

  socket.emit("watchparty-action", {
    roomId: params.id,
    action: {
      type,
      time: hostPlaybackRef.current.time,
      updatedAt: hostPlaybackRef.current.updatedAt,
    },
  });
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
{isHost && (
  <button
    onClick={startScreenShare}
    style={{ marginTop: 10 }}
  >
    Share Screen / YouTube
  </button>
)}
{isHost && (
  <div style={{ marginTop: 20 }}>
    <button onClick={() => sendWatchAction("play")}>
      Play
    </button>

    <button onClick={() => sendWatchAction("pause")}>
      Pause
    </button>
  </div>
)}

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


