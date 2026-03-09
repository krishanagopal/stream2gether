"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

  // Cinematic Surfing Reveal Effect
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.retro-reveal-left, .retro-reveal-right, .retro-reveal-up, .scroll-signal-loss');
    hiddenElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
    <>
      {/* Global Cinematic Filter Overlay */}
      <div className="film-overlay"></div>
      
      <div className="newspaper-container">
      {/* NAVBAR */}
      <nav className="newspaper-nav retro-reveal-up">
        <div className="thin-divider"></div>
        <div className="thin-divider" style={{ marginTop: '2px', marginBottom: '10px' }}></div>
        <h1 className="masthead-title">𝔗𝔥𝔢 𝔇𝔞𝔦𝔩𝔶 𝔚𝔢𝔟𝔭𝔞𝔤𝔢</h1>
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
        <h2 className="hero-headline retro-reveal-up" style={{ transitionDelay: "0.1s" }}>Welcome to Our Website!</h2>
        <div className="cursive-subline retro-reveal-up" style={{ transitionDelay: "0.3s" }}>The Best Place on the Internet!</div>
        <div className="thick-line retro-reveal-up" style={{ marginTop: '20px', transitionDelay: "0.5s" }}></div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="newspaper-grid">

        
        {/* LEFT COLUMN: CREATE ROOM (VINTAGE TV) */}
        <div className="vintage-tv-set scroll-signal-loss" style={{ transitionDelay: "0.1s" }}>
          <div className="tv-screen">
            <div className="section-title-inverted latest-news-title">
              <h3>LATEST NEWS!</h3>
            </div>
            <h4 className="sub-headline">= Read All About It! =</h4>
            
            <div className="graphic-placeholder">
              <Image src="/vintage_megaphone.png" alt="Vintage Megaphone" width={300} height={200} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            </div>
            
            <p className="body-text" style={{ fontStyle: "italic", textAlign: "center", marginBottom: "0" }}>
              Exciting Updates & Information<br/>Start your own private broadcast today.
            </p>
          </div>
          
          <div className="tv-controls">
            <form className="vintage-form" onSubmit={handleCreateRoom} style={{ width: '100%' }}>
              <input
                className="input-vintage"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter Host Name..."
                maxLength={20}
                required
              />
              <button className="btn-vintage" type="submit" disabled={!hostName || isCreating} style={{ width: '90%' }}>
                {isCreating ? "TUNING..." : "BROADCAST"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: JOIN ROOM (VINTAGE TV) */}
        <div className="vintage-tv-set scroll-signal-loss" style={{ transitionDelay: "0.3s" }}>
          <div className="tv-screen">
            <div className="section-title-wanted">
              <h3>WANTED</h3>
            </div>
            <h4 className="sub-headline">= JOIN US NOW! =</h4>
            <p className="cursive-subline" style={{ fontSize: "1.8rem", margin: "0", color: "#fff", textShadow: "0 0 5px rgba(255,255,255,0.5)" }}>Become a Member!</p>
            
            <div className="graphic-placeholder">
              <Image src="/wanted_cowboy.png" alt="Wanted Cowboy" width={300} height={200} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            </div>
          </div>

          <div className="tv-controls">
            <form className="vintage-form" onSubmit={handleJoinRoom} style={{ width: '100%' }}>
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
                placeholder="Channel ID..."
                maxLength={10}
                required
              />
              
              {joinError && <p style={{ color: "darkred", margin: "5px 0" }}>{joinError}</p>}
              
              <button className="btn-vintage" type="submit" disabled={!roomId || !guestName || isJoining} style={{ width: '90%' }}>
                {isJoining ? "CONNECTING..." : "TUNE IN"}
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM LEFT: SPECIAL OFFERS */}
        <section className="newspaper-section retro-reveal-left" style={{ transitionDelay: "0.1s" }}>
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
        <section className="newspaper-section mystery-bg retro-reveal-right" style={{ transitionDelay: "0.3s" }}>
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

      {/* RUSTY PRODUCT DEMO & ROADMAP SECTION */}
      <section className="newspaper-container" style={{ paddingTop: 0, minHeight: 'auto', background: 'none', boxShadow: 'none', border: 'none', position: 'relative', zIndex: 1 }}>
        <div className="rusty-panel retro-reveal-up">
          <div className="rivet tl"></div>
          <div className="rivet tr"></div>
          <div className="rivet bl"></div>
          <div className="rivet br"></div>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 className="glowing-text" style={{ fontSize: '3rem', margin: 0, letterSpacing: '4px' }}>VIDEO SHARE</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--glow-red)', fontFamily: 'Courier Prime, monospace', fontWeight: 'bold' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--glow-red)', boxShadow: '0 0 8px var(--glow-red)' }}></div>
              REC
            </div>
          </div>

          <div className="faq-row" style={{ marginBottom: '25px', borderBottom: '2px solid rgba(0,0,0,0.5)', paddingBottom: '20px' }}>
            <button className="vintage-button-heavy">CREATE ROOM</button>
            <button className="vintage-button-heavy">SHARE LINK</button>
            <button className="vintage-button-heavy">WATCH TOGETHER</button>
          </div>

          {/* Core Demo Screen */}
          <div className="demo-screen">
            <h3 className="demo-title glowing-text">RETRO DRIVE-IN</h3>
            <p className="demo-tagline">Experience the magic of shared viewing.</p>
            <div style={{ height: '250px', background: 'url(/vintage_megaphone.png) center/cover no-repeat', filter: 'sepia(0.8) hue-rotate(-30deg) saturate(2) brightness(0.6) contrast(1.2)', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.1)', marginBottom: '15px' }}>
              {/* Fallback image style since we don't have the exact drive in pic */}
            </div>
            <div className="demo-stats">
              <span>Host: Unknown</span>
              <span>Guests: 4/10</span>
              <span style={{ color: 'var(--glow-orange)' }}>LIVE 00:04:32</span>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'left' }}>
              <h4 style={{ fontFamily: 'Ultra, serif', fontSize: '1.5rem', margin: '0 0 5px 0', color: 'var(--paper-bg-light)' }}>Classic Drive-In Experience!</h4>
              <p style={{ fontFamily: 'Libre Baskerville, serif', fontStyle: 'italic', margin: 0, color: '#aaa' }}>by VintageFan87 | 284K views | 2 days ago</p>
            </div>
          </div>

          <div className="section-divider-metal"></div>

          {/* Roadmap / Recommended Videos Style List */}
          <h3 className="metallic-header">Upcoming Features</h3>
          <div className="roadmap-list">
            <div className="roadmap-item">
              <div className="roadmap-icon">V2</div>
              <div className="roadmap-content">
                <h4>Voice Chat Integration</h4>
                <p>Talk with your friends while watching, just like the old days.</p>
              </div>
            </div>
            <div className="roadmap-item">
              <div className="roadmap-icon">HQ</div>
              <div className="roadmap-content">
                <h4>High Definition Printing</h4>
                <p>Support for crystal clear 1080p and 4K video sharing streams.</p>
              </div>
            </div>
            <div className="roadmap-item">
              <div className="roadmap-icon">TV</div>
              <div className="roadmap-content">
                <h4>Custom Room Themes</h4>
                <p>Decorate your viewing parlor with vintage wallpaper and borders.</p>
              </div>
            </div>
          </div>

          <div className="section-divider-metal"></div>

          {/* FAQ Area (Bottom Buttons) */}
           <h3 className="metallic-header" style={{ textAlign: 'center' }}>Frequently Asked Questions</h3>
           <div className="faq-row">
            <button className="vintage-button-heavy">How To Use?</button>
            <button className="vintage-button-heavy">Is It Free?</button>
            <button className="vintage-button-heavy">Support</button>
          </div>

        </div>
      </section>

      {/* FOOTER: CONTACT US */}
      <footer className="newspaper-footer retro-reveal-up">
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
    </>
  );
}

