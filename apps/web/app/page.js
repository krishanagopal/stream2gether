"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  
  // Create Room State
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Join Room State
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!hostName) return;
    setIsCreating(true);

    try {
      const res = await fetch("http://localhost:4000/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hostName }),
      });
      const data = await res.json();
      router.push(`/room/${data.roomId}?host=${hostName}`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  }

  async function handleJoinRoom(e) {
    e.preventDefault();
    setJoinError("");
    if (!roomId || !guestName) return;
    setIsJoining(true);

    try {
      // Just check if room exists before routing
      const check = await fetch(`http://localhost:4000/rooms/${roomId}`);
      if (!check.ok) {
        setJoinError("Room Not Found! Check the ID.");
        setIsJoining(false);
        return;
      }
      
      // Store name for the waiting room flow in page.js
      localStorage.setItem(`watchparty-name-${roomId}`, guestName);
      router.push(`/room/${roomId}`);
    } catch (err) {
      setJoinError("Failed to reach telegraph office.");
      setIsJoining(false);
    }
  }

  return (
    <div className="newspaper-container">
      {/* NAVBAR */}
      <nav className="newspaper-nav">
        <div className="thin-divider"></div>
        <div className="thin-divider" style={{ marginTop: '2px', marginBottom: '10px' }}></div>
        <h1 className="masthead-title">THE DAILY WEBPAGE</h1>
        <div className="thin-divider"></div>
        <div className="nav-sub">
          <span>AUTHENTIC SITE!</span>
          <span>★</span>
          <span>EST. {new Date().getFullYear()}</span>
          <span>★</span>
          <span>WORLD WIDE WEB</span>
        </div>
        <div className="thick-line" style={{ marginTop: '10px' }}></div>
      </nav>

      {/* HERO SECTION */}
      <header className="newspaper-hero">
        <h2 className="hero-headline">WELCOME TO OUR WEBSITE!</h2>
        <div className="cursive-subline">The Best Place on the Internet!</div>
        <div className="thick-line" style={{ marginTop: '20px' }}></div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="newspaper-grid">

        
        {/* LEFT COLUMN: CREATE ROOM */}
        <section className="newspaper-section">
          <div className="section-title-inverted latest-news-title">
            <h3>LATEST NEWS!</h3>
          </div>
          <h4 className="sub-headline">= Read All About It! =</h4>
          
          <div className="graphic-placeholder">
            <Image src="/vintage_megaphone.png" alt="Vintage Megaphone" width={300} height={200} style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          
          <p className="body-text" style={{ fontStyle: "italic", textAlign: "center" }}>
            Exciting Updates & Information<br/>Start your own private broadcast today.
          </p>
          
          <form className="vintage-form" onSubmit={handleCreateRoom}>
            <input
              className="input-vintage"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Enter Host Name..."
              maxLength={20}
              required
            />
            <button className="btn-vintage" type="submit" disabled={!hostName || isCreating}>
              {isCreating ? "PRINTING..." : "READ MORE"}
            </button>
          </form>
        </section>

        {/* RIGHT COLUMN: JOIN ROOM */}
        <section className="newspaper-section">
          <div className="section-title-wanted">
            <h3>WANTED</h3>
          </div>
          <h4 className="sub-headline">= JOIN US NOW! =</h4>
          <p className="cursive-subline" style={{ fontSize: "1.8rem", margin: "0" }}>Become a Member!</p>
          
          <div className="graphic-placeholder">
            <Image src="/wanted_cowboy.png" alt="Wanted Cowboy" width={300} height={200} style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>

          <form className="vintage-form" onSubmit={handleJoinRoom}>
            <input
              className="input-vintage"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your Alias..."
              maxLength={20}
              style={{ marginBottom: "10px" }}
              required
            />
            <input
              className="input-vintage"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Secret Room ID..."
              maxLength={10}
              required
            />
            
            {joinError && <p style={{ color: "darkred", margin: "5px 0" }}>{joinError}</p>}
            
            <button className="btn-vintage" type="submit" disabled={!roomId || !guestName || isJoining}>
              {isJoining ? "RIDING..." : "SIGN UP TODAY!"}
            </button>
          </form>
        </section>

        {/* BOTTOM LEFT: SPECIAL OFFERS */}
        <section className="newspaper-section">
          <div className="divider-line" style={{ width: "80%", marginBottom: "15px" }}></div>
          <div className="section-title-standard">
            <h3>SPECIAL OFFERS!</h3>
          </div>
          <h4 className="sub-headline">= Don't Miss Out! =</h4>
          <p className="cursive-subline" style={{ fontSize: "1.8rem", margin: "10px 0" }}>Big Deals & Discounts</p>
          <div className="graphic-placeholder">
            <Image src="/special_offers_badge.png" alt="Special Offers Badge" width={200} height={150} style={{ objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.2)' }} />
          </div>
          <button className="btn-small-vintage" type="button" style={{ border: "3px solid var(--ink-color)", borderRadius: "8px", padding: "8px 25px", marginTop: "auto" }}>SEE OFFERS</button>
        </section>

        {/* BOTTOM RIGHT: MYSTERY SECTION */}
        <section className="newspaper-section mystery-bg">
          <div className="section-title-standard">
            <h3>MYSTERY SECTION</h3>
          </div>
          <h4 className="sub-headline">= Secret Content Inside! =</h4>
          <p className="cursive-subline" style={{ fontSize: "1.8rem", margin: "10px 0" }}>Uncover the Unknown</p>
          <div className="graphic-placeholder">
            <Image src="/mystery_magnifying_glass.png" alt="Mystery Magnifying Glass" width={200} height={150} style={{ objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.2)' }} />
          </div>
          <button className="btn-small-vintage" type="button" style={{ border: "3px solid var(--ink-color)", borderRadius: "8px", padding: "8px 25px", marginTop: "auto" }}>DISCOVER MORE</button>
        </section>

      </main>

      {/* FOOTER: CONTACT US */}
      <footer className="newspaper-footer">
        <div className="footer-banner">
          <div className="thin-divider" style={{ borderColor: "var(--paper-bg)" }}></div>
          <h2 className="footer-headline">CONTACT US TODAY!</h2>
          <div className="thin-divider" style={{ borderColor: "var(--paper-bg)" }}></div>
        </div>
        
        <div className="footer-columns">
          <div className="footer-col">
            <h4>EMAIL US!</h4>
            <div className="divider-line"></div>
            <p>info@example.com</p>
          </div>
          <div className="footer-col" style={{ borderLeft: "2px solid var(--ink-color)", borderRight: "2px solid var(--ink-color)" }}>
            <h4>FOLLOW US!</h4>
            <div className="divider-line"></div>
            <p>Facebook | Twitter | Instagram</p>
          </div>
          <div className="footer-col">
            <h4>CALL NOW!</h4>
            <div className="divider-line"></div>
            <p>(123) 456-7890</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

