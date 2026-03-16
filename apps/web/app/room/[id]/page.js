"use client";

import { useState, useEffect,useRef  } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";


export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const hostName = searchParams.get("host");

  const [name, setName] = useState("");
  const [joinedName, setJoinedName] = useState("");
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

  async function connectHostToPeers(manualParticipants = null) {
    if (!isHost || !mediaReadyRef.current || !socket) return;

    const targetList = manualParticipants || latestRoomRef.current?.approved || participants;

    targetList.forEach((p) => {
      if (p.name === name) return; // skip self
      if (!p.socketId) return; // skip if no socket yet

      let pc = peerConnectionsRef.current[p.socketId];
      if (pc && pc.connectionState !== "closed") return;

      console.log("Connecting host to guest:", p.name);

      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.queuedIceCandidates = [];
      peerConnectionsRef.current[p.socketId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            targetSocketId: p.socketId,
            signalData: {
              type: "ice-candidate",
              candidate: event.candidate,
            },
          });
        }
      };

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, window.localStream);
        });
      }

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit("signal", {
          targetSocketId: p.socketId,
          signalData: {
            type: "offer",
            sdp: offer,
          },
        });
      });
    });
  }

  function sendWatchAction(type) {
    if (!isHost) return;

    const video = localVideoRef.current;
    if (!video) return;

    const action = {
      type,
      time: video.currentTime,
      updatedAt: Date.now(),
    };

    hostPlaybackRef.current = {
      playing: type === "play",
      time: action.time,
      updatedAt: action.updatedAt,
    };

    socket.emit("watchparty-action", {
      roomId: params.id,
      action,
    });
  }

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
        setJoinedName(savedName);
        setStatus("waiting");
      } else {
        setJoinedName(savedName);
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
      connectHostToPeers(room.approved);
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
      pc.queuedIceCandidates = [];
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

      if (pc.queuedIceCandidates) {
        for (let candidate of pc.queuedIceCandidates) {
          try { await pc.addIceCandidate(candidate); } catch(e) { console.error("ICE Error", e); }
        }
        pc.queuedIceCandidates = [];
      }

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

      if (pc.queuedIceCandidates) {
        for (let candidate of pc.queuedIceCandidates) {
          try { await pc.addIceCandidate(candidate); } catch(e) { console.error("ICE Error", e); }
        }
        pc.queuedIceCandidates = [];
      }

      console.log("Answer received");
    }

    // ✅ ICE
    if (signalData.type === "ice-candidate") {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(signalData.candidate);
        } else {
          console.log("Queueing ICE candidate");
          if (!pc.queuedIceCandidates) pc.queuedIceCandidates = [];
          pc.queuedIceCandidates.push(signalData.candidate);
        }
      } catch (e) {
        console.log("ICE Error", e);
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
    setJoinedName(hostName);
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
  setJoinedName(name);
  setStatus("waiting");
} else {
  localStorage.setItem("watchparty-name", name);
  setJoinedName(name);
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
  if (!joinedName) return;

  const s = io("http://localhost:4000");

s.on("connect", () => {
  console.log("My socket ID:", s.id);
  setMySocketId(s.id);
});

   

  s.emit("join-room", {
    roomId: params.id,
    name: joinedName,
  });

  setSocket(s);

s.emit("request-sync", {
  roomId: params.id,
});

 

  return () => {
    s.disconnect();
  };
}, [params.id, joinedName]);


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

  const pageContainer = "relative min-h-screen text-[var(--color-anime-dark)] overflow-hidden font-sans selection:bg-[#ff8fb7] selection:text-white flex flex-col";
  const bgElements = (
    <>
      {/* FULL ANIMATED BACKGROUND - Surfing through Anime */}
      <div className="fixed inset-0 z-[-2] bg-scroll-anime opacity-[0.85] pointer-events-none scale-105 motion-preset-fade motion-duration-2000" />
      
      {/* Fog/Cloud Overlay - Clears over time to reveal the crisp background */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-[#f8fcfd] via-[#f8fcfd]/80 to-white pointer-events-none motion-preset-slide-up motion-duration-3000 relative">
         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#f8fcfd]" />
      </div>
    </>
  );

  if (status === "enter-name") {
    return (
      <div className={`${pageContainer} items-center justify-center`}>
        {bgElements}
        <div className="anime-card p-8 bg-white max-w-md w-full motion-preset-slide-up motion-duration-1000 text-center">
          <h1 className="text-4xl font-black mb-6 text-[var(--color-anime-dark)] tracking-tighter uppercase">Identify Yourself 🌸</h1>
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your alias"
              maxLength={20}
              className="w-full bg-gray-50 border-4 border-[var(--color-anime-dark)] rounded-2xl px-6 py-4 mb-6 text-xl font-bold placeholder-gray-400 focus:outline-none focus:bg-white transition-colors shadow-[inner_0_0_10px_rgba(0,0,0,0.05)]"
            />
          </div>
          <button 
            onClick={joinRoom} 
            disabled={!name}
            className="w-full bg-[var(--color-anime-primary)] text-white font-black text-2xl rounded-2xl px-6 py-4 border-4 border-[var(--color-anime-dark)] shadow-[4px_4px_0px_var(--color-anime-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-anime-dark)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-anime-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:motion-preset-pop hover:motion-duration-300"
          >
            Access Terminal
          </button>
          {error && <p className="text-[#ff003c] text-lg font-black mt-4 motion-preset-shake py-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (status === "joining") {
    return (
      <div className={`${pageContainer} items-center justify-center`}>
         {bgElements}
         <div className="flex flex-col items-center motion-preset-fade">
           <div className="w-20 h-20 rounded-full border-8 border-[var(--color-anime-secondary)]/30 border-t-[var(--color-anime-primary)] motion-preset-spin motion-duration-1000 mb-6 drop-shadow-xl" />
           <p className="text-2xl text-[var(--color-anime-dark)] font-black tracking-widest animate-pulse">ESTABLISHING UPLINK...</p>
         </div>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className={`${pageContainer} items-center justify-center`}>
        {bgElements}
        <div className="anime-card bg-white p-10 max-w-lg w-full text-center motion-preset-pop motion-duration-700">
          <div className="w-24 h-24 mx-auto bg-[#ffd900] rounded-full flex items-center justify-center border-4 border-[var(--color-anime-dark)] mb-6 motion-preset-pulse motion-duration-2000 shadow-[4px_4px_0px_var(--color-anime-dark)]">
            <svg className="w-12 h-12 text-[var(--color-anime-dark)]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-[var(--color-anime-dark)] mb-2 uppercase tracking-wide">Awaiting Clearance 🗝️</h2>
          <p className="font-bold text-gray-500 text-lg">The host has been notified of your arrival. Please maintain signal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageContainer}>
      {bgElements}
      
      {/* Navbar */}
      <nav className="w-full bg-white border-b-4 border-[var(--color-anime-dark)] py-4 px-6 flex justify-between items-center z-10 motion-preset-slide-down shadow-md">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-[var(--color-anime-primary)] border-2 border-[var(--color-anime-dark)] shadow-[2px_2px_0px_var(--color-anime-dark)] motion-preset-spin motion-duration-3000" />
           <h1 className="text-2xl font-black tracking-wider text-[var(--color-anime-dark)] uppercase">CHANNEL <span className="text-[var(--color-anime-secondary)]">{params.id}</span></h1>
         </div>
         <div className="text-lg font-bold text-gray-500">
           Logged in as <span className="text-[var(--color-anime-primary)]">{joinedName}</span>
           {isHost && <span className="ml-2 px-3 py-1 rounded-full bg-[#ffd900] text-[var(--color-anime-dark)] border-2 border-[var(--color-anime-dark)] shadow-[2px_2px_0px_var(--color-anime-dark)]">HOST 👑</span>}
         </div>
      </nav>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 xl:grid-cols-4 gap-8 z-10">
        
        {/* LEFT/CENTER: MAIN VIDEO & CONTROLS */}
        <div className="xl:col-span-3 flex flex-col gap-6 motion-preset-slide-right motion-duration-1000">
          
          {/* Main Host Stream */}
          <div className="anime-card overflow-hidden relative aspect-video flex flex-col items-center justify-center bg-[#1a1a2e] group">
             {/* Glowing backlight effect for video */}
             <div className="absolute inset-x-20 inset-y-10 bg-[var(--color-anime-primary)]/20 blur-[100px] pointer-events-none group-hover:bg-[var(--color-anime-secondary)]/30 transition-colors duration-700" />
             
             <video
               ref={remoteVideoRef}
               autoPlay
               playsInline
               muted={isHost} // Host shouldn't hear themselves via remote
               className="w-full h-full object-contain relative z-10"
             />
             
             {!remoteStream && !isHost && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-0">
                 <svg className="w-20 h-20 mb-4 opacity-80 motion-preset-pulse motion-duration-2000 text-[#ffd900]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                 <p className="text-2xl font-black tracking-widest uppercase">Awaiting Broadcast Signal... 📺</p>
               </div>
             )}
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="anime-card p-4 flex flex-wrap gap-4 items-center justify-center motion-preset-slide-up motion-delay-300">
               <button
                 onClick={startScreenShare}
                 className="flex items-center gap-2 bg-[var(--color-anime-secondary)] text-white font-black px-6 py-3 rounded-xl border-4 border-[var(--color-anime-dark)] shadow-[4px_4px_0px_var(--color-anime-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-anime-dark)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-anime-dark)] transition-all"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                 Share Display
               </button>
               
               <div className="w-1 h-10 bg-[var(--color-anime-dark)] mx-2 hidden sm:block rounded-full" />
               
               <button 
                 onClick={() => sendWatchAction("play")}
                 className="flex items-center gap-2 bg-[var(--color-anime-primary)] text-white font-black px-8 py-3 rounded-xl border-4 border-[var(--color-anime-dark)] shadow-[4px_4px_0px_var(--color-anime-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-anime-dark)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-anime-dark)] transition-all"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                 Play
               </button>
               
               <button 
                 onClick={() => sendWatchAction("pause")}
                 className="flex items-center gap-2 bg-[#ffd900] text-[var(--color-anime-dark)] font-black px-8 py-3 rounded-xl border-4 border-[var(--color-anime-dark)] shadow-[4px_4px_0px_var(--color-anime-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-anime-dark)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-anime-dark)] transition-all"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                 Pause
               </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: PARTICIPANTS & LOCAL VIDEO */}
        <div className="flex flex-col gap-6 motion-preset-slide-left motion-duration-1000 motion-delay-200">
          
          {/* Local Video Thumbnail (Host Only or if we support guest webcams later) */}
          <div className="anime-card p-4 relative overflow-hidden hidden xl:block">
            <h3 className="text-sm font-black text-[var(--color-anime-dark)] uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-[#ff003c] border-2 border-black motion-preset-pulse motion-duration-1000" /> LOCAL SENSOR 👀
            </h3>
            <div className="bg-[#1a1a2e] rounded-xl overflow-hidden aspect-video border-4 border-[var(--color-anime-dark)] relative shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!mediaReadyRef.current && isHost && (
                 <div className="absolute inset-0 flex items-center justify-center font-bold text-white">Initializing...</div>
              )}
            </div>
          </div>

          {/* Network Roster */}
          <div className="anime-card p-5 flex-1 flex flex-col max-h-[500px]">
             <h3 className="text-xl font-black text-[var(--color-anime-dark)] uppercase tracking-widest mb-4 border-b-4 border-[var(--color-anime-dark)] pb-3">Active Network 🟢</h3>
             
             <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {participants.map((p, i) => (
                 <li key={i} className="bg-gray-50 border-2 border-[var(--color-anime-dark)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-[2px_2px_0px_var(--color-anime-dark)] motion-preset-slide-right-sm">
                   <div className="w-3 h-3 rounded-full bg-[var(--color-anime-secondary)] border-2 border-[var(--color-anime-dark)]" />
                   <span className="font-black text-[var(--color-anime-dark)] text-lg truncate">{p.name}</span>
                 </li>
               ))}
               {participants.length === 0 && (
                 <li className="text-gray-500 font-bold py-2">No active participants.</li>
               )}
             </ul>
          </div>

          {/* Access Requests (Host Only) */}
          {hostName && waitingUsers.length > 0 && (
            <div className="anime-card p-5 border-[var(--color-anime-primary)] motion-preset-pop">
              <h3 className="text-lg font-black text-[var(--color-anime-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-anime-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-[var(--color-anime-dark)] bg-[var(--color-anime-primary)]"></span>
                  </span>
                 Access Requests 🛎️
              </h3>
              <ul className="space-y-3">
                {waitingUsers.map((u, i) => (
                  <li key={i} className="flex items-center justify-between bg-white border-2 border-[var(--color-anime-dark)] rounded-xl p-3 motion-preset-slide-right-sm shadow-[2px_2px_0px_var(--color-anime-dark)]">
                    <span className="font-black text-[var(--color-anime-dark)] truncate pr-2">{u.name}</span>
                    <button 
                      onClick={() => approveUser(u.name)}
                      className="bg-[#ffd900] text-[var(--color-anime-dark)] font-black px-4 py-2 rounded-lg text-sm border-2 border-[var(--color-anime-dark)] hover:-translate-y-1 hover:shadow-[3px_3px_0px_var(--color-anime-dark)] transition-transform"
                    >
                      LET IN!
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}


