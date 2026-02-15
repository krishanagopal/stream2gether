"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function createRoom() {
    const res = await fetch("http://localhost:4000/rooms", {
      method: "POST",
    });

    const data = await res.json();
    router.push(`/room/${data.roomId}`);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>WatchParty</h1>
      <button onClick={createRoom}>Create Room</button>
    </main>
  );
}
