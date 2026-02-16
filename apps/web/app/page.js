"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  async function createRoom() {
    if (!name) return;

    const res = await fetch("http://localhost:4000/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    router.push(`/room/${data.roomId}?host=${name}`);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>WatchParty</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{ padding: 8 }}
      />

      <br /><br />

      <button onClick={createRoom} disabled={!name}>
        Create Room
      </button>
    </main>
  );
}

