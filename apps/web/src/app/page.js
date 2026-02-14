"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function createRoom() {
    try {
      const res = await fetch("http://localhost:4000/rooms", {
        method: "POST",
      });

      const data = await res.json();

      router.push(`/room/${data.roomId}`);
    } catch (err) {
      console.error("Failed to create room", err);
      alert("Server error");
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>WatchParty</h1>
      <p>Private watch party platform</p>

      <button
        onClick={createRoom}
        style={{
          padding: "10px 18px",
          fontSize: 16,
          marginTop: 20,
          cursor: "pointer"
        }}
      >
        Create Room
      </button>
    </main>
  );
}




