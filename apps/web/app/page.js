"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();

  // Create Room State
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Join Room State
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [openFaq, setOpenFaq] = useState(null);

  // Custom Cursor trailing effect
  const cursorRef = useRef(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);

    // Scroll Animation Observer Setup
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    revealElements.forEach((el) => observer.observe(el));

    // Custom Cursor tracking
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        // Adding a slight delay/smoothness to the follower
        cursorRef.current.animate({
          left: `${e.clientX}px`,
          top: `${e.clientY}px`
        }, { duration: 500, fill: "forwards", easing: "ease-out" });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      window.removeEventListener('mousemove', handleMouseMove);
    };
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
      const check = await fetch(`http://localhost:4000/rooms/${roomId}`);
      if (!check.ok) {
        setJoinError("Room Not Found! Check the ID.");
        setIsJoining(false);
        return;
      }
      
      localStorage.setItem(`watchparty-name-${roomId}`, guestName);
      router.push(`/room/${roomId}`);
    } catch (err) {
      setJoinError("Failed to connect to the server.");
      setIsJoining(false);
    }
  }

  const toggleFaq = (index) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  return (
    <div className="relative min-h-screen text-[var(--color-newspaper-ink)] selection:bg-[var(--color-newspaper-rust)] selection:text-[var(--color-newspaper-bg)] overflow-x-hidden font-sans burnt-edges px-4 py-4 md:px-8 md:py-8 transition-all cursor-crosshair">
      
      {/* CUSTOM CURSOR FOLLOWER - Inky glowing spotlight effect */}
      <div 
        ref={cursorRef} 
        className="fixed pointer-events-none z-[999] w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-multiply opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(139,58,32,0.8) 0%, rgba(43,29,20,0) 70%)' }}
      />

      {/* Wrapper to contain content within the burnt edges */}
      <div className="relative z-10 w-full max-w-7xl mx-auto border-4 border-[var(--color-newspaper-ink)] p-1 md:p-2 bg-transparent shadow-[8px_8px_0_var(--color-newspaper-burn)] backdrop-blur-[2px]">
        <div className="border-2 border-[var(--color-newspaper-ink)] border-dashed p-4 md:p-8 bg-transparent">

          {/* NEWSPAPER HEADER */}
          <header className="w-full flex flex-col items-center justify-center border-b-4 border-double border-[var(--color-newspaper-ink)] pb-6 mb-12">
            <div className="flex justify-between w-full text-sm font-bold uppercase tracking-widest border-b-2 border-[var(--color-newspaper-ink)] pb-2 mb-6">
               <span>Vol. I — No. 1</span>
               <span className="font-[family-name:var(--font-typewriter)]">Est. 2026</span>
               <span>The Daily Sync</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight flex items-center gap-1 group mb-4 uppercase hover:scale-105 transition-transform duration-500" style={{ textShadow: "4px 4px 0px var(--color-newspaper-rust)"}}>
              <span className="group-hover:motion-preset-wobble motion-duration-500">Watch</span>
              <span className="text-[var(--color-newspaper-burn)]">Party</span>
            </h1>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-xl font-bold uppercase tracking-widest border-y-2 border-[var(--color-newspaper-ink)] py-3 w-full">
              <a href="#features" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-1 transition-transform relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
              <span>★</span>
              <a href="#how-it-works" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-1 transition-transform relative group">
                How it Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
              <span>★</span>
              <a href="#faq" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-1 transition-transform relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
            </div>
          </header>

          <main className="w-full flex flex-col items-center">
            
            {/* ================= HERO SECTION ================= */}
            <section className="relative w-full px-2 pt-10 pb-20 flex flex-col items-center text-center">
              
              {/* FLOATERS (Ink splats / stars) */}
              <div className="absolute top-0 left-[15%] text-4xl motion-preset-oscillate motion-duration-2000 opacity-60 z-0 hover:scale-150 transition-transform">★</div>
              <div className="absolute top-20 right-[10%] text-5xl motion-preset-bounce motion-duration-3000 opacity-70 z-0 delay-150 rusty-text hover:rotate-90 transition-transform cursor-pointer">❀</div>
              <div className="absolute top-[50%] left-[5%] text-3xl motion-preset-pulse motion-duration-2000 opacity-60 z-0">✦</div>
              <div className="absolute bottom-0 right-[20%] text-6xl motion-preset-wobble motion-duration-2000 opacity-80 z-0 delay-300">✶</div>

              {/* HEADLINE */}
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 motion-preset-slide-up motion-duration-1000 z-10" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.2)" }}>
                Watch Together. <br className="md:hidden" /> Feel Together.
              </h2>
              
              {/* SUBHEADLINE */}
              <p className="text-2xl font-bold mb-12 max-w-2xl motion-preset-fade motion-delay-300 motion-duration-1000 z-10 border-l-4 border-[var(--color-newspaper-rust)] pl-6 text-left" style={{ fontStyle: "italic" }}>
                "Sync movies, chat live, and share reactions in real time." — <span className="font-[family-name:var(--font-typewriter)] text-lg">The Editors</span>
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-6 mb-20 z-10 motion-preset-slide-up motion-delay-500 motion-duration-1000">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-[var(--color-newspaper-ink)] text-[#e2d1b3] text-3xl font-bold sketch-border hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-newspaper-rust)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide group"
                >
                  <span className="group-hover:motion-preset-shake">Create a Room</span>
                </button>
                <button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-8 py-4 bg-transparent border-4 border-dashed border-[var(--color-newspaper-ink)] text-[var(--color-newspaper-ink)] text-3xl font-bold hover:bg-[rgba(43,29,20,0.05)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-wide group"
                >
                  <span className="group-hover:motion-preset-pulse">Join with Code</span>
                </button>
              </div>

              {/* STYLIZED MOCKUP - Newspaper Ad Style */}
              <div className="w-full max-w-4xl bg-transparent sketch-border-heavy overflow-hidden motion-preset-slide-up motion-delay-700 motion-duration-1000 relative group z-10 p-2 shadow-[10px_10px_0_var(--color-newspaper-ink)] hover:shadow-[15px_15px_0_var(--color-newspaper-rust)] transition-shadow duration-500">
                 <div className="border-4 border-double border-[var(--color-newspaper-ink)] h-full backdrop-blur-[1px]">
                   {/* Browser Bar */}
                   <div className="h-12 border-b-4 border-[var(--color-newspaper-ink)] flex items-center px-4 gap-4 bg-[rgba(43,29,20,0.05)]">
                      <div className="flex gap-2">
                        <div className="w-4 h-4 bg-[var(--color-newspaper-ink)] rounded-full border-2 border-[var(--color-newspaper-bg)] group-hover:scale-125 transition-transform"></div>
                        <div className="w-4 h-4 bg-[var(--color-newspaper-ink)] rounded-full border-2 border-[var(--color-newspaper-bg)] group-hover:scale-125 transition-transform delay-75"></div>
                        <div className="w-4 h-4 bg-[var(--color-newspaper-ink)] rounded-full border-2 border-[var(--color-newspaper-bg)] group-hover:scale-125 transition-transform delay-150"></div>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="h-8 border-2 border-[var(--color-newspaper-ink)] w-full max-w-[300px] flex items-center px-3 font-[family-name:var(--font-typewriter)] text-sm font-bold bg-transparent shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
                          http://watch.party
                        </div>
                      </div>
                   </div>
                   
                   {/* App Interface Mockup */}
                   <div className="flex flex-col md:flex-row h-[300px] md:h-[400px]">
                      {/* Video Area */}
                      <div className="flex-1 border-r-4 border-[var(--color-newspaper-ink)] relative flex items-center justify-center p-6 bg-transparent cursor-pointer">
                        <div className="absolute inset-4 border-2 border-dashed border-[var(--color-newspaper-ink)] flex items-center justify-center group-hover:bg-[rgba(43,29,20,0.05)] transition-colors">
                           {/* Play Button */}
                           <div className="w-24 h-24 border-4 border-[var(--color-newspaper-ink)] rounded-full flex items-center justify-center z-10 group-hover:scale-125 transition-transform duration-500 text-5xl bg-transparent shadow-[4px_4px_0_var(--color-newspaper-rust)] group-hover:shadow-[8px_8px_0_var(--color-newspaper-ink)]">
                              ▶
                           </div>
                        </div>
                      </div>
                      
                      {/* Chat/Participants Area */}
                      <div className="w-full md:w-64 flex flex-col hidden sm:flex bg-transparent relative">
                         <div className="p-4 border-b-4 border-double border-[var(--color-newspaper-ink)] text-center font-bold uppercase tracking-widest bg-[var(--color-newspaper-ink)] text-[#e2d1b3]">
                           Online Now
                         </div>
                         <div className="flex flex-col p-4 gap-6 flex-1 overflow-hidden group-hover:[&>div]:translate-x-2 [&>div]:transition-transform">
                           <div className="flex items-center gap-3 delay-100">
                             <div className="w-12 h-12 border-2 border-[var(--color-newspaper-ink)] rounded-full flex items-center justify-center text-2xl shadow-[2px_2px_0_var(--color-newspaper-ink)] bg-transparent hover:rotate-12 transition-transform">😃</div>
                             <div className="h-2 border-y border-[var(--color-newspaper-ink)] w-24"></div>
                           </div>
                           <div className="flex items-center gap-3 delay-200">
                             <div className="w-12 h-12 border-2 border-[var(--color-newspaper-ink)] rounded-full flex items-center justify-center text-2xl shadow-[2px_2px_0_var(--color-newspaper-rust)] bg-transparent hover:rotate-12 transition-transform">🎧</div>
                             <div className="h-2 border-y border-[var(--color-newspaper-ink)] w-20"></div>
                           </div>
                           <div className="flex items-center gap-3 delay-300">
                             <div className="w-12 h-12 border-2 border-[var(--color-newspaper-ink)] rounded-full flex items-center justify-center text-2xl shadow-[2px_2px_0_var(--color-newspaper-ink)] bg-transparent hover:rotate-12 transition-transform">😎</div>
                             <div className="h-2 border-y border-[var(--color-newspaper-ink)] w-28"></div>
                           </div>
                         </div>
                         <div className="absolute bottom-0 left-0 w-full h-16 border-t-4 border-[var(--color-newspaper-ink)] p-3 bg-[rgba(43,29,20,0.05)]">
                            <div className="w-full h-full border-2 border-[var(--color-newspaper-ink)] bg-transparent shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] group-hover:bg-[rgba(139,58,32,0.1)] transition-colors text-center font-bold font-[family-name:var(--font-typewriter)] flex items-center justify-center opacity-50">
                               Message...
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>

              {/* Social Proof */}
              <div className="mt-16 flex flex-col items-center motion-preset-fade motion-delay-1000 motion-duration-1000 reveal">
                <p className="text-2xl font-bold uppercase tracking-widest mb-2 border-b-2 border-[var(--color-newspaper-ink)] pb-1">Testimonials</p>
                <div className="flex items-center gap-2 text-3xl mt-4">
                  <span className="hover:motion-preset-burst">★★★★★</span> <span className="text-xl font-bold ml-4 lowercase font-[family-name:var(--font-typewriter)]">— Loved by 10K+ users</span>
                </div>
              </div>
            </section>

            <div className="w-full flex items-center my-12 reveal">
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
               <div className="px-4 text-3xl hover:rotate-180 transition-transform duration-1000 bg-transparent">✾</div>
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
            </div>

            {/* ================= FEATURES SECTION ================= */}
            <section id="features" className="w-full px-2 py-10 text-center">
              <h3 className="text-6xl font-bold mb-20 uppercase tracking-tight reveal" style={{ textShadow: "2px 2px 0px var(--color-newspaper-rust)"}}>What is WatchParty?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Feature 1 */}
                <div className="flex flex-col items-center text-center group cursor-pointer border-2 border-dashed border-[var(--color-newspaper-ink)] p-6 hover:bg-[rgba(43,29,20,0.03)] transition-colors reveal">
                  <div className="w-full h-48 border-4 border-[var(--color-newspaper-ink)] bg-[var(--color-newspaper-bg)] mb-8 flex items-center justify-center text-6xl shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-2 group-hover:shadow-[10px_10px_0_var(--color-newspaper-rust)] transition-all overflow-hidden p-2">
                     <img src="/feature_watch.png" alt="Laptop & Couch" className="w-full h-full object-contain mix-blend-multiply group-hover:motion-preset-wobble motion-duration-500 opacity-90" />
                  </div>
                  <h4 className="text-3xl font-bold mb-4 uppercase inline-block border-b-2 border-[var(--color-newspaper-ink)]">Watch With Friends</h4>
                  <p className="text-xl font-bold">Enjoy movies & shows together no matter the distance.</p>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-center text-center group cursor-pointer border-2 border-dashed border-[var(--color-newspaper-ink)] p-6 hover:bg-[rgba(43,29,20,0.03)] transition-colors reveal" style={{ transitionDelay: '100ms' }}>
                  <div className="w-full h-48 border-4 border-[var(--color-newspaper-ink)] bg-[var(--color-newspaper-bg)] mb-8 flex items-center justify-center text-6xl shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-2 group-hover:shadow-[10px_10px_0_var(--color-newspaper-rust)] transition-all overflow-hidden p-2">
                     <img src="/feature_chat.png" alt="Emojis & Speech bubbles" className="w-full h-full object-contain mix-blend-multiply group-hover:motion-preset-oscillate motion-duration-500 opacity-90" />
                  </div>
                  <h4 className="text-3xl font-bold mb-4 uppercase inline-block border-b-2 border-[var(--color-newspaper-ink)]">Live Chat & Reactions</h4>
                  <p className="text-xl font-bold">Chat in real-time, share emojis & react together.</p>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-center text-center group cursor-pointer border-2 border-dashed border-[var(--color-newspaper-ink)] p-6 hover:bg-[rgba(43,29,20,0.03)] transition-colors reveal" style={{ transitionDelay: '200ms' }}>
                  <div className="w-full h-48 border-4 border-[var(--color-newspaper-ink)] bg-[var(--color-newspaper-bg)] mb-8 flex flex-col items-center justify-center shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-2 group-hover:shadow-[10px_10px_0_var(--color-newspaper-rust)] transition-all relative overflow-hidden p-2">
                     <img src="/feature_sync.png" alt="Perfect Sync Playback" className="w-full h-full object-contain mix-blend-multiply group-hover:motion-preset-pulse opacity-90" />
                  </div>
                  <h4 className="text-3xl font-bold mb-4 uppercase inline-block border-b-2 border-[var(--color-newspaper-ink)]">Perfect Sync Playback</h4>
                  <p className="text-xl font-bold">Watch videos in perfect sync with friends easily.</p>
                </div>

              </div>
            </section>

            <div className="w-full flex items-center my-12 reveal">
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
               <div className="px-4 text-3xl hover:rotate-180 transition-transform duration-1000 bg-transparent">✾</div>
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
            </div>

            {/* ================= HOW IT WORKS SECTION ================= */}
            <section id="how-it-works" className="w-full max-w-5xl mx-auto px-2 py-10 text-center">
              <h3 className="text-5xl font-bold mb-20 uppercase tracking-widest border-y-4 border-[var(--color-newspaper-ink)] py-4 inline-block reveal">How It Works</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between relative gap-12 md:gap-0">
                {/* Step 1 */}
                <div className="flex-1 flex flex-col items-center group cursor-default reveal">
                  <div className="text-5xl font-black mb-6 font-[family-name:var(--font-typewriter)] text-[var(--color-newspaper-bg)] bg-[var(--color-newspaper-ink)] w-24 h-24 flex items-center justify-center rounded-full border-4 border-[var(--color-newspaper-bg)] outline outline-4 outline-[var(--color-newspaper-ink)] shadow-[4px_4px_0_var(--color-newspaper-rust)] group-hover:shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-1 transition-all">
                    1
                  </div>
                  <h4 className="text-3xl font-bold uppercase mb-2">Create</h4>
                  <p className="text-xl font-bold">Start a room with a click</p>
                </div>

                {/* Connecting Arrow */}
                <div className="hidden md:block text-5xl font-black reveal" style={{ transitionDelay: '100ms' }}>➼</div>

                {/* Step 2 */}
                <div className="flex-1 flex flex-col items-center group cursor-default reveal" style={{ transitionDelay: '200ms' }}>
                  <div className="text-5xl font-black mb-6 font-[family-name:var(--font-typewriter)] text-[var(--color-newspaper-bg)] bg-[var(--color-newspaper-ink)] w-24 h-24 flex items-center justify-center rounded-full border-4 border-[var(--color-newspaper-bg)] outline outline-4 outline-[var(--color-newspaper-ink)] shadow-[4px_4px_0_var(--color-newspaper-rust)] group-hover:shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-1 transition-all">
                    2
                  </div>
                  <h4 className="text-3xl font-bold uppercase mb-2">Invite</h4>
                  <p className="text-xl font-bold">Share your invite link</p>
                </div>

                {/* Connecting Arrow */}
                <div className="hidden md:block text-5xl font-black reveal" style={{ transitionDelay: '300ms' }}>➼</div>

                {/* Step 3 */}
                <div className="flex-1 flex flex-col items-center group cursor-default reveal" style={{ transitionDelay: '400ms' }}>
                  <div className="text-5xl font-black mb-6 font-[family-name:var(--font-typewriter)] text-[var(--color-newspaper-bg)] bg-[var(--color-newspaper-ink)] w-24 h-24 flex items-center justify-center rounded-full border-4 border-[var(--color-newspaper-bg)] outline outline-4 outline-[var(--color-newspaper-ink)] shadow-[4px_4px_0_var(--color-newspaper-rust)] group-hover:shadow-[6px_6px_0_var(--color-newspaper-ink)] group-hover:-translate-y-1 transition-all">
                    3
                  </div>
                  <h4 className="text-3xl font-bold uppercase mb-2">Enjoy</h4>
                  <p className="text-xl font-bold">Watch & have fun!</p>
                </div>
              </div>
            </section>

            <div className="w-full flex items-center my-12 reveal">
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
               <div className="px-4 text-3xl hover:rotate-180 transition-transform duration-1000 bg-transparent">✾</div>
               <div className="flex-1 border-t-4 border-double border-[var(--color-newspaper-ink)]"></div>
            </div>

            {/* ================= FAQ SECTION ================= */}
            <section id="faq" className="w-full max-w-5xl mx-auto px-2 py-10">
              <h3 className="text-6xl font-bold mb-16 text-center uppercase tracking-tight reveal" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}>Classifieds FAQ</h3>
              
              <div className="flex flex-col gap-6">
                 {[
                   { q: "Is WatchParty free?", a: "Yes! Creating and joining rooms is completely free. No subscription required." },
                   { q: "How does syncing work?", a: "We use peer-to-peer WebRTC data channels to instantly sync play, pause, and seek commands securely between all users in the room." },
                   { q: "Can I invite a large group?", a: "Because connections are peer-to-peer, performance depends on the host's internet connection. Typical rooms of 5-10 people work flawlessly." },
                   { q: "Does it work on mobile?", a: "Yes, WatchParty works perfectly in any modern mobile browser." },
                 ].map((faq, i) => (
                   <div key={i} className="border-4 border-[var(--color-newspaper-ink)] bg-[var(--color-newspaper-bg)] shadow-[6px_6px_0_var(--color-newspaper-ink)] hover:-translate-y-1 transition-all overflow-hidden group reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                     <button 
                       onClick={() => toggleFaq(i)}
                       className="w-full text-left px-8 py-6 flex items-center justify-between font-bold group-hover:bg-[rgba(43,29,20,0.05)] transition-colors"
                     >
                       <span className="text-2xl uppercase group-hover:text-[var(--color-newspaper-rust)] transition-colors">{faq.q}</span>
                       <span className="text-4xl leading-none font-black">{openFaq === i ? "−" : "+"}</span>
                     </button>
                     {openFaq === i && (
                       <div className="px-8 pb-6 pt-0 text-xl font-[family-name:var(--font-typewriter)] font-bold motion-preset-slide-down motion-duration-300 border-t-2 border-dashed border-[var(--color-newspaper-ink)] mt-2 mx-8 pt-4">
                         {faq.a}
                       </div>
                     )}
                   </div>
                 ))}
              </div>
            </section>

          </main>
          
          {/* ================= FOOTER ================= */}
          <footer className="w-full border-t-4 border-double border-[var(--color-newspaper-ink)] pt-12 mt-20 flex flex-col items-center text-center reveal">
            
            <h1 className="text-5xl font-black uppercase tracking-tight mb-8 hover:scale-105 transition-transform cursor-pointer" style={{ textShadow: "2px 2px 0px var(--color-newspaper-rust)"}}>
              WatchParty
            </h1>

            <div className="flex flex-wrap justify-center gap-6 text-xl font-bold uppercase tracking-widest mb-10">
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] transition-colors relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
              <span>/</span>
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] transition-colors relative group">
                Privacy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
              <span>/</span>
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] transition-colors relative group">
                Terms
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
              <span>/</span>
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] transition-colors relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-newspaper-rust)] transition-all group-hover:w-full"></span>
              </a>
            </div>

            <div className="flex gap-8 text-4xl mb-12">
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-2 hover:rotate-12 transition-all">✉</a>
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-2 hover:-rotate-12 transition-all">✆</a>
              <a href="#" className="hover:text-[var(--color-newspaper-rust)] hover:-translate-y-2 hover:motion-preset-wobble transition-all">✍</a>
            </div>
            
            <div className="w-full bg-[var(--color-newspaper-ink)] text-[var(--color-newspaper-bg)] py-2 font-[family-name:var(--font-typewriter)] font-bold text-sm tracking-widest uppercase">
               Printed locally • Copr. 2026
            </div>
          </footer>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      
      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(43,29,20,0.8)] backdrop-blur-sm motion-preset-fade motion-duration-200">
          <div className="border-4 border-[var(--color-newspaper-ink)] p-1 w-full max-w-md shadow-[15px_15px_0_var(--color-newspaper-ink)] motion-preset-slide-up-sm motion-duration-300 relative burnt-edges" style={{ backgroundColor: 'rgba(226, 209, 179, 0.88)' }}>
            <div className="border-2 border-dashed border-[var(--color-newspaper-ink)] p-8">
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-4xl font-black hover:text-[var(--color-newspaper-rust)] hover:rotate-90 transition-transform">
                ✕
              </button>
              <h3 className="text-4xl font-black uppercase mb-2 border-b-4 border-double border-[var(--color-newspaper-ink)] pb-2 inline-block">Host Session</h3>
              <p className="text-xl font-bold mt-4 mb-8 font-[family-name:var(--font-typewriter)]">Create a new lobby and telegraph the link.</p>
              
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="ENTER ALIAS"
                  maxLength={20}
                  required
                  className="w-full bg-transparent border-b-4 border-[var(--color-newspaper-ink)] px-2 py-3 text-2xl font-bold uppercase placeholder-[rgba(43,29,20,0.4)] focus:outline-none focus:border-[var(--color-newspaper-rust)] transition-colors text-center"
                />
                <button
                  type="submit"
                  disabled={!hostName || isCreating}
                  className="w-full bg-[var(--color-newspaper-ink)] text-[var(--color-newspaper-bg)] font-black text-3xl px-4 py-4 uppercase tracking-widest hover:bg-[var(--color-newspaper-rust)] transition-colors disabled:opacity-50 shadow-[6px_6px_0_var(--color-newspaper-burn)] active:translate-y-1 active:shadow-none"
                >
                  {isCreating ? "Connecting..." : "Start Party"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(43,29,20,0.8)] backdrop-blur-sm motion-preset-fade motion-duration-200">
          <div className="border-4 border-[var(--color-newspaper-ink)] p-1 w-full max-w-md shadow-[15px_15px_0_var(--color-newspaper-ink)] motion-preset-slide-up-sm motion-duration-300 relative burnt-edges" style={{ backgroundColor: 'rgba(226, 209, 179, 0.88)' }}>
            <div className="border-2 border-dashed border-[var(--color-newspaper-ink)] p-8">
              <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-6 right-6 text-4xl font-black hover:text-[var(--color-newspaper-rust)] hover:rotate-90 transition-transform">
                ✕
              </button>
              <h3 className="text-4xl font-black uppercase mb-2 border-b-4 border-double border-[var(--color-newspaper-ink)] pb-2 inline-block">Join Session</h3>
              <p className="text-xl font-bold mt-4 mb-8 font-[family-name:var(--font-typewriter)]">Enter a room code to enter the lobby.</p>
              
              <form onSubmit={handleJoinRoom} className="space-y-6">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="ENTER ALIAS"
                  maxLength={20}
                  required
                  className="w-full bg-transparent border-b-4 border-[var(--color-newspaper-ink)] px-2 py-3 text-2xl font-bold uppercase placeholder-[rgba(43,29,20,0.4)] focus:outline-none focus:border-[var(--color-newspaper-rust)] transition-colors text-center"
                />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ENTER CODE"
                  maxLength={10}
                  required
                  className="w-full bg-transparent border-b-4 border-[var(--color-newspaper-ink)] px-2 py-3 text-2xl font-bold uppercase placeholder-[rgba(43,29,20,0.4)] focus:outline-none focus:border-[var(--color-newspaper-rust)] transition-colors text-center"
                />
                {joinError && (
                  <p className="text-[var(--color-newspaper-rust)] text-xl font-black motion-preset-shake text-center border-2 border-[var(--color-newspaper-rust)] py-2 bg-[rgba(139,58,32,0.1)]">{joinError}</p>
                )}
                <button
                  type="submit"
                  disabled={!roomId || !guestName || isJoining}
                  className="w-full bg-[var(--color-newspaper-bg)] text-[var(--color-newspaper-ink)] border-4 border-[var(--color-newspaper-ink)] font-black text-3xl px-4 py-4 uppercase tracking-widest hover:bg-[var(--color-newspaper-ink)] hover:text-[var(--color-newspaper-bg)] transition-colors disabled:opacity-50 shadow-[6px_6px_0_var(--color-newspaper-ink)] active:translate-y-1 active:shadow-none"
                >
                  {isJoining ? "Connecting..." : "Join Party"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
