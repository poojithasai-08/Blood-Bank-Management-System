import { useState, useEffect } from "react";

// ── Color Configuration Tokens ───────────────────────
const COLORS = {
  red:      "#c0202a",
  redDark:  "#8b0000",
  redPale:  "#fff0f0",
  redMid:   "#ffcdd2",
  white:    "#ffffff",
  offWhite: "#fafafa",
  gray:     "#6b7280",
  grayL:    "#f3f4f6",
  dark:     "#1a1a2e",
  darkSoft: "#2d2d44",
};

// ── Reusable Section Header Component ────────────────
function SectionHeader({ badge, title, subtitle, isDark }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <div style={{
        display: "inline-block", padding: "6px 18px",
        background: isDark ? "rgba(192,32,42,0.3)" : COLORS.redPale, 
        borderRadius: 50, marginBottom: 14,
        border: `1px solid ${isDark ? "rgba(192,32,42,0.5)" : COLORS.redMid}`,
      }}>
        <span style={{ color: isDark ? "#ff8a80" : COLORS.red, fontWeight: 800, fontSize: 13 }}>
          {badge}
        </span>
      </div>
      <h2 style={{
        fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)",
        fontWeight: 900, color: isDark ? COLORS.white : COLORS.dark, marginBottom: 12,
      }}>{title}</h2>
      <p style={{ 
        color: isDark ? "rgba(255,255,255,0.6)" : COLORS.gray, fontSize: 15, 
        maxWidth: 500, margin: "0 auto", lineHeight: 1.7 
        }}>
        {subtitle}
      </p>
    </div>
  );
}

// ── Navbar Component ──────────────────────────────────
function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = ["Home", "Features", "Blood Info", "How It Works", "Contact"];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      boxShadow: scrolled ? "0 2px 20px rgba(192,32,42,0.12)" : "none",
      transition: "all 0.35s ease",
      padding: scrolled ? "10px 40px" : "18px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.redDark}, ${COLORS.red})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>❤️</div>
        <span style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18,
          color: scrolled ? COLORS.dark : COLORS.white, transition: "color 0.3s",
        }}>BloodBank<span style={{ color: COLORS.red }}>MS</span></span>
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
            onMouseEnter={() => setHoveredLink(l)} onMouseLeave={() => setHoveredLink(null)}
            style={{
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              color: hoveredLink === l ? COLORS.red : (scrolled ? COLORS.dark : "rgba(255,255,255,0.88)"),
              transition: "color 0.2s",
            }}>{l}</a>
        ))}
        <button onClick={onLoginClick} style={{
          padding: "9px 22px", background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
          color: COLORS.white, border: "none", borderRadius: 50, fontWeight: 800, fontSize: 14, cursor: "pointer",
          boxShadow: "0 3px 12px rgba(192,32,42,0.3)", transition: "all 0.2s", fontFamily: "inherit",
        }}>Login / Sign Up</button>
      </div>
    </nav>
  );
}

// ── Hero Section Component (FIXED CLICK CLICKABLE OVERLAYS) ──
function HeroSection({ onLoginClick }) {
  const bloodGroups = ["A+", "B+", "O-", "AB+", "O+", "B-"];

  return (
    <section id="home" style={{
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.redDark} 0%, ${COLORS.red} 45%, #e53935 100%)`,
      display: "flex", alignItems: "center", padding: "100px 40px 60px", position: "relative", overflow: "hidden",
    }}>
      {/* Background patterns made un-clickable so they don't capture button click coordinates */}
      <div style={{ 
        position: "absolute", inset: 0, opacity: 0.06, 
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" 
        }}/>
      <div style={{
         position: "absolute", width: 300, height: 300, 
         top: "-80px", right: "-60px", 
         background: "rgba(255,255,255,0.06)", borderRadius: "50%", pointerEvents: "none" 
         }}/>
      <div style={{ 
        position: "absolute", width: 200, height: 200, 
        bottom: "40px", left: "-40px", 
        background: "rgba(255,255,255,0.06)", borderRadius: "50%", pointerEvents: "none" 
        }}/>

      <div style={{
         maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", 
         gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" 
         }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 22, border: "1px solid rgba(255,255,255,0.25)",
          }}>
            <span>🔴</span>
            <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>Live Blood Management System</span>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 900, color: COLORS.white, lineHeight: 1.1, marginBottom: 20 }}>
            Donate Blood.<br/><span style={{ color: COLORS.white }}>Save Lives.</span>
          </h1>

          <p style={{ 
            color: "rgba(255,255,255,0.85)", fontSize: 16, 
            lineHeight: 1.8, marginBottom: 32, maxWidth: 440 
            }}>
            A smart blood bank platform connecting donors and hospitals in real-time. Book donations, check blood availability, and respond to emergency requests — all in one place.
          </p>

          {/* Elevated zIndex ensures buttons stay completely on top of all surrounding layouts */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", position: "relative", zIndex: 10 }}>
            <button onClick={onLoginClick} 
            style={{
               padding: "14px 32px", background: COLORS.white, color: COLORS.red, border: "none",
                borderRadius: 50, fontWeight: 800, fontSize: 15, cursor: "pointer", 
                boxShadow: "0 6px 20px rgba(0,0,0,0.2)", fontFamily: "inherit" 
                }}>
              🩸 Donate Now
            </button>
            <button onClick={onLoginClick} 
            style={{ 
              padding: "14px 32px", background: "rgba(255,255,255,0.15)", 
              color: COLORS.white, border: "2px solid rgba(255,255,255,0.5)", 
              borderRadius: 50, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit"
               }}>
              🏥 Hospital Login
            </button>
          </div>
        </div>

        {/* Beautiful Circular Orbit Graphics */}
        <div style={{ 
          position: "relative", height: 420 
          }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.3)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 52 }}>🩸</div>
            <div style={{ color: COLORS.white, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, marginTop: 6 }}>Blood Bank</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>Management System</div>
          </div>

          {bloodGroups.map((bg, i) => {
            const angle = (i / 6) * 2 * Math.PI;
            const x = Math.cos(angle) * 170;
            const y = Math.sin(angle) * 160;
            return (
              <div key={bg} style={{
                position: "absolute", top: `calc(50% + ${y}px - 22px)`, left: `calc(50% + ${x}px - 22px)`,
                width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.95)",
                color: COLORS.red, fontWeight: 900, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}>{bg}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Features Section Component ─────────────────────────
function FeaturesSection() {
  const features = [
    { 
      icon: "📅", title: "Appointment Booking", desc: "Donors can view available time slots, book donation appointments, and receive instant confirmation messages.", color: "#fff0f0", accent: COLORS.red
     },
    {
       icon: "🌦️", title: "Weather Safety Filter", desc: "Live weather API integration disables donation slots during extreme weather to protect donor health and safety.", color: "#e3f2fd", accent: "#1565c0"
       },
    { 
      icon: "🔬", title: "Blood Compatibility Checker", desc: "Enter a patient's blood group to instantly find compatible donors and available units in the inventory.", color: "#f3e5f5", accent: "#7b1fa2" 
    },
    { 
      icon: "⏰", title: "Expiry Management", desc: "Near-expiry blood units are highlighted in red with a 'Use First' priority list to prevent wastage.", color: "#fff8e1", accent: "#f57f17" 
    },
    { 
      icon: "📊", title: "Admin Dashboard", desc: "Real-time dashboard showing total donors, blood stock levels, expiring units, and donation statistics.", color: "#e8f5e9", accent: "#2e7d32" 
    },
    { 
      icon: "📍", title: "Geo Donor Finder", desc: "GPS-based feature to locate nearby compatible blood donors using Maps API for emergency situations.", color: "#fce4ec", accent: "#c2185b" 
    },
  ];

  return (
    <section id="features" style={{
       padding: "80px 40px", 
       background: `linear-gradient(180deg, ${COLORS.offWhite} 0%, ${COLORS.white} 100%)` 
       }}>
      <div style={{ 
        maxWidth: 1100, margin: "0 auto"
         }}>
        <SectionHeader badge="⚡ Smart Features" title="Everything You Need, In One Place" subtitle="From donation booking to emergency blood requests — our platform handles it all intelligently." isDark={false} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, color, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "28px 24px", borderRadius: 18, background: hov ? 
        color : COLORS.white,
        border: `1.5px solid ${hov ? "rgba(192,32,42,0.2)" : COLORS.grayL}`,
        boxShadow: hov ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease", 
        transform: hov ? "translateY(-4px)" : "none", 
        cursor: "default",
      }}>
      <div style={{ 
        width: 52, height: 52, 
        borderRadius: 14, background: color, display: "flex", 
        alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ 
        fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800,
         color: COLORS.dark, marginBottom: 8 }}>{title}</h3>
      <p style={{ 
        color: COLORS.gray, fontSize: 13.5, lineHeight: 1.7 
      }}>{desc}</p>
      <div style={{ 
        marginTop: 16, fontSize: 13, fontWeight: 700, color: accent,
         opacity: hov ? 1 : 0, transition: "opacity 0.2s" 
         }}>Learn more →</div>
    </div>
  );
}

// ── Blood Inventory Section Component ─────────────────
function BloodInfoSection() {
  // 1. Prepare for dynamic data fetching
  const [bloodInventory, setBloodInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Here you will eventually add your API call
    // Example: fetch('/api/blood-inventory').then(res => res.json()).then(data => setBloodInventory(data))
    
    // Simulating an empty state or loading state for now
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <section style={{ padding: "80px 40px", background: COLORS.dark, textAlign: "center", color: "white" }}>
        <p>Loading inventory data...</p>
      </section>
    );
  }

  return (
    <section id="blood-info" style={{ padding: "80px 40px", background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.darkSoft} 100%)` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader badge="🩸 Live Inventory" title="Blood Availability" subtitle="Real-time stock levels" isDark={true} />
        
        {bloodInventory.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            <p>No blood inventory data currently available.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {/* Inventory cards will map here once data is fetched */}
          </div>
        )}
      </div>
    </section>
  );
}

// ── How It Works Section Component ────────────────────
function HowItWorksSection({ onLoginClick }) {
  const stepsData = {
    donor: [
      { n: "01", icon: "📝", title: "Register", desc: "Create your donor profile with blood group and health details." },
      { n: "02", icon: "📅", title: "Book Slot", desc: "Choose a safe donation slot based on live weather conditions." },
      { n: "03", icon: "🩸", title: "Donate", desc: "Visit the blood bank and complete your donation appointment." },
      { n: "04", icon: "🏅", title: "Track Impact", desc: "View your donation history and see how many lives you've saved." },
    ],
    hospital: [
      { n: "01", icon: "🏥", title: "Register Hospital", desc: "Sign up with your hospital license ID for verified access." },
      { n: "02", icon: "🔍", title: "Check Inventory", desc: "View real-time blood availability across all blood groups." },
      { n: "03", icon: "📨", title: "Request Blood", desc: "Submit urgent blood requests and find compatible donors nearby." },
      { n: "04", icon: "📊", title: "Manage Records", desc: "Track requests, manage inventory, and view expiry alerts." },
    ]
  };

  const [tab, setTab] = useState("donor");

  return (
    <section id="how-it-works" style={{ padding: "80px 40px", background: COLORS.white }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader badge="📋 Simple Process" title="How It Works" subtitle="" isDark={false} />
        
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 44 }}>
          {["donor", "hospital"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 28px", 
              background: tab === t ? COLORS.red : COLORS.grayL,
              color: tab === t ? COLORS.white : COLORS.gray, border: "none", borderRadius: 50,
              fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s",
              boxShadow: tab === t ? "0 4px 14px rgba(192,32,42,0.25)" : "none",
            }}>
              {t === "donor" ? "🩸 For Donors" : "🏥 For Hospitals"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {stepsData[tab].map((s, i) => (
            <div key={i} style={{ padding: "24px 20px", borderRadius: 18, background: COLORS.offWhite, position: "relative", border: `1px solid ${COLORS.grayL}` }}>
              <div style={{
                position: "absolute", top: -14, left: 20, background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 13, padding: "4px 12px",
                borderRadius: 50, boxShadow: "0 3px 10px rgba(192,32,42,0.25)",
              }}>STEP {s.n}</div>
              <div style={{ fontSize: 32, marginBottom: 12, marginTop: 8 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: COLORS.dark, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: COLORS.gray, fontSize: 13.5, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button onClick={onLoginClick} style={{
            padding: "15px 40px", background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            color: COLORS.white, border: "none", borderRadius: 50, fontWeight: 800, fontSize: 16,
            cursor: "pointer", boxShadow: "0 6px 24px rgba(192,32,42,0.3)", fontFamily: "inherit",
          }}>🩸 Get Started Today</button>
        </div>
      </div>
    </section>
  );
}

// ── Footer Component ──────────────────────────────────
function Footer() {
  return (
    <footer id="contact" style={{ background: COLORS.dark, padding: "50px 40px 30px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", 
                background: `linear-gradient(135deg, ${COLORS.redDark}, ${COLORS.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>❤️</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: COLORS.white }}>BloodBank<span style={{ color: COLORS.red }}>MS</span></span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", 
              fontSize: 13.5, lineHeight: 1.8, maxWidth: 280 }}>
              A smart blood bank management platform connecting donors and hospitals to save lives efficiently and safely.
            </p>
          </div>

          <div>
            <h4 style={{ color: COLORS.white, fontWeight: 800, marginBottom: 16, fontSize: 14 }}>Quick Links</h4>
            {["Home", "Features", "Blood Info", "How It Works"].map(l => (
              <div key={l} style={{ marginBottom: 10 }}>
                <a href={`#${l.toLowerCase().replace(" ", "-")}`} style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, textDecoration: "none" }}>→ {l}</a>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ color: COLORS.white, fontWeight: 800, marginBottom: 16, fontSize: 14 }}>Contact</h4>
            {[
              { icon: "📧", text: "bloodbank@klh.edu.in" },
              { icon: "📞", text: "+91 98765 43210" },
              { icon: "📍", text: "KLH University, Hyderabad" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <span>{c.icon}</span><span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 
          }}>
          <p style={{ 
            color: "rgba(255,255,255,0.3)", fontSize: 12 }}>© 2026 BloodBankMS · KLH University</p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page Component ───────────────────────────────
export default function HomePage({ onLoginClick }) {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: COLORS.white }}>
      {showAuth && (
        <div onClick={() => setShowAuth(false)} style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: COLORS.white, borderRadius: 24, padding: 32, maxWidth: 420, width: "100%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.3)", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🩸</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: COLORS.dark, marginBottom: 8 }}>Ready to Make a Difference?</h2>
            <p style={{ color: COLORS.gray, fontSize: 14, marginBottom: 24 }}>Choose how you'd like to continue with the Blood Bank System.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => { setShowAuth(false); if(onLoginClick) onLoginClick(); }}
               style={{ 
                padding: "13px", background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, color: COLORS.white, border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" 
                }}>
                🩸 Continue as Donor
              </button>
              <button onClick={() => { setShowAuth(false); if(onLoginClick) onLoginClick(); }} 
              style={{
                 padding: "13px", background: "linear-gradient(135deg, #1565c0, #0d3b8e)", color: COLORS.white, border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" 
                 }}>
                🏥 Continue as Hospital
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar onLoginClick={() => setShowAuth(true)} />
      <HeroSection onLoginClick={() => setShowAuth(true)} />
      <FeaturesSection />
      <BloodInfoSection />
      <HowItWorksSection onLoginClick={() => setShowAuth(true)} />
      <Footer />
    </div>
  );
}