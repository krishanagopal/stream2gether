"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

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


  /* ---------------- HOST AUTO JOIN ---------------- */
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
        setStatus("waiting");
      } else {
        setStatus("joined");
      }

    } catch {
      setError("Server unreachable");
      setStatus("enter-name");
    }
  }

  /* ---------------- POLLING PARTICIPANTS ---------------- */
  useEffect(() => {
    if (status !== "joined") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:4000/rooms/${params.id}`);
        if (!res.ok) return;

        const data = await res.json();
        setParticipants(data.approved || []);
        setWaitingUsers(data.waiting || []);

      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [status, params.id]);

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
            <li key={i}>{u.name}</li>
          ))}
        </ul>
      </>
    )}
  </main>
);

}

