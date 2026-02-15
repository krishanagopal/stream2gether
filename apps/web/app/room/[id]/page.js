async function getRoom(id) {
  try {
    const res = await fetch(`http://localhost:4000/rooms/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export default async function RoomPage({ params }) {
  const { id } = await params;

  const room = await getRoom(id);

  if (!room) {
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Room not found</h1>
        <p>This link is invalid or expired.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Room: {id}</h1>
      <p>Waiting room will be implemented here</p>
    </main>
  );
}
