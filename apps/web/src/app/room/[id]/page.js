export default async function RoomPage({ params }) {
    const{id}= await params;
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Room: {id}</h1>
      <p>Waiting room will be implemented here</p>
    </main>
  );
}
