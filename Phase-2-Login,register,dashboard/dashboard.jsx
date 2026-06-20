import { useState, useEffect } from "react";

// ── COLOR CONFIGURATION SYSTEM ────────────────────────
const COLORS = {
  red:       "#c0202a",
  redDark:   "#8b0000",
  redPale:   "#fff0f0",
  redMid:    "#ffcdd2",
  white:     "#ffffff",
  offWhite:  "#fafafa",
  gray:      "#6b7280",
  grayL:     "#f3f4f6",
  dark:      "#1a1a2e",
  darkSoft:  "#2d2d44",
  green:     "#2e7d32",
  greenL:    "#e8f5e9",
  orange:    "#f57f17",
  orangeL:   "#fff8e1",
};

// ── COMPATIBILITY MAP DATA ENGINE ────────────────────
const COMPATIBILITY_MAP = {
  "A+":  { give: ["A+", "AB+"],          receive: ["A+", "A-", "O+", "O-"] },
  "A-":  { give: ["A+", "A-", "AB+", "AB-"], receive: ["A-", "O-"] },
  "B+":  { give: ["B+", "AB+"],          receive: ["B+", "B-", "O+", "O-"] },
  "B-":  { give: ["B+", "B-", "AB+", "AB-"], receive: ["B-", "O-"] },
  "AB+": { give: ["AB+"],                receive: ["All Blood Types"] },
  "AB-": { give: ["AB+", "AB-"],          receive: ["A-", "B-", "AB-", "O-"] },
  "O+":  { give: ["A+", "B+", "O+", "AB+"], receive: ["O+", "O-"] },
  "O-":  { give: ["All Blood Types"],    receive: ["O-"] },
};

// ── GLOBAL GEOSPATIAL DONOR REGISTRY ─────────────────
const MOCK_DONORS_DB = [
  { id: 101, name: "Rahul Sharma", bloodGroup: "O-", lat: 17.3850, lng: 78.4867, phone: "+91 98765 43210", city: "Hyderabad" },
  { id: 102, name: "Priya Patel", bloodGroup: "A+", lat: 17.4020, lng: 78.4520, phone: "+91 87654 32109", city: "Hyderabad" },
  { id: 103, name: "Ananya Reddy", bloodGroup: "O-", lat: 17.3600, lng: 78.5000, phone: "+91 76543 21098", city: "Hyderabad" },
  { id: 104, name: "Amit Verma", bloodGroup: "B+", lat: 17.4400, lng: 78.3800, phone: "+91 65432 10987", city: "Hyderabad" },
  { id: 105, name: "Vikram Sai", bloodGroup: "AB+", lat: 17.4210, lng: 78.4320, phone: "+91 99887 76655", city: "Hyderabad" }
];

// ════════════════════════════════════════════════════════
// LOCAL STORAGE PERSISTENCE LAYER (New)
// ════════════════════════════════════════════════════════
// Key used for hospital records
const HOSPITALS_KEY = "bloodbank_hospitals";
// Key used for donor registration / donation records, each tagged with hospitalId
const DONATIONS_KEY = "bloodbank_donations";

const readStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify any other mounted panels in this tab to refresh themselves
    window.dispatchEvent(new Event("bloodbank-sync"));
  } catch {
    // Storage write failed silently; UI still reflects in-memory state
  }
};

export default function App() {
  const [session, setSession] = useState({ loggedIn: false, role: null });
  const [activeFormTab, setActiveFormTab] = useState("donor"); // 'donor' or 'hospital'

  // Hospitals registered so far (loaded once on startup, kept fresh via sync event)
  const [hospitals, setHospitals] = useState(() => readStore(HOSPITALS_KEY, []));

  useEffect(() => {
    const onSync = () => setHospitals(readStore(HOSPITALS_KEY, []));
    window.addEventListener("bloodbank-sync", onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener("bloodbank-sync", onSync);
      window.removeEventListener("storage", onSync);
    };
  }, []);

  // Refined states matching image input structures precisely
  const [donorProfile, setDonorProfile] = useState({
    name: "", email: "", phone: "", dob: "", gender: "", bloodGroup: "A+", city: "",
    lastDonationDate: "", eligibilityStatus: "Eligible", address: "", emergencyName: "", emergencyPhone: "",
    hospitalName: ""
  });

  const [hospitalProfile, setHospitalProfile] = useState({
    hospitalName: "", adminName: "", hospitalId: "", city: "", email: "", phone: "", lat: 17.3850, lng: 78.4867
  });

  // Global Weather Context Matrix (Initialized to safe medium, user/admin modifiable)
  const [liveWeather, setLiveWeather] = useState({ temp: 28, condition: "Partly Cloudy" });

  // ── Register donor → save into bloodbank_donations, tagged to matched hospital ──
  const handleDonorRegister = () => {
    if (!donorProfile.name || !donorProfile.email) {
      alert("Please fill in Name and Email fields to enter.");
      return;
    }
    if (!donorProfile.hospitalName.trim()) {
      alert("Please enter the name of the Hospital you're registering with.");
      return;
    }

    // Match the typed hospital name against registered hospitals, case-insensitive,
    // so the donor's free-text entry still links to the correct hospitalId.
    const typedName = donorProfile.hospitalName.trim().toLowerCase();
    const matchedHospital = hospitals.find(h => h.hospitalName.trim().toLowerCase() === typedName);

    const record = {
      id: Date.now(),
      name: donorProfile.name,
      email: donorProfile.email,
      phone: donorProfile.phone,
      dob: donorProfile.dob,
      gender: donorProfile.gender,
      bloodGroup: donorProfile.bloodGroup,
      city: donorProfile.city,
      // If a registered hospital matches the typed name, link by its hospitalId so the
      // hospital dashboard filter (which keys off hospitalId) picks this record up.
      // Otherwise fall back to the typed name itself so the record isn't lost.
      hospitalId: matchedHospital ? matchedHospital.hospitalId : donorProfile.hospitalName.trim(),
      hospitalName: matchedHospital ? matchedHospital.hospitalName : donorProfile.hospitalName.trim(),
      registeredAt: new Date().toISOString(),
      status: "Registered"
    };

    const existingDonations = readStore(DONATIONS_KEY, []);
    writeStore(DONATIONS_KEY, [record, ...existingDonations]);

    setSession({ loggedIn: true, role: "donor" });
  };

  // ── Register hospital → save into bloodbank_hospitals ──
  const handleHospitalRegister = () => {
    if (!hospitalProfile.hospitalName || !hospitalProfile.hospitalId) {
      alert("Please fill in Facility Name and License Key.");
      return;
    }

    const existingHospitals = readStore(HOSPITALS_KEY, []);
    const alreadyExists = existingHospitals.some(h => h.hospitalId === hospitalProfile.hospitalId);
    if (alreadyExists) {
      alert("A hospital with this License Key is already registered. Please use a different ID or log in.");
      return;
    }

    const record = { ...hospitalProfile, registeredAt: new Date().toISOString() };
    const updated = [record, ...existingHospitals];
    writeStore(HOSPITALS_KEY, updated);
    setHospitals(updated);

    setSession({ loggedIn: true, role: "hospital" });
  };

  if (!session.loggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.darkSoft} 100%)`, fontFamily: "system-ui, sans-serif", padding: "20px" }}>
        
        {/* TOP SIGNUP NAVIGATION GATEWAY BAR */}
        <div style={{ 
          background: COLORS.red, padding: "12px 24px", borderRadius: "50px", display: "flex", gap: "16px", marginBottom: "30px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", width: "100%", maxWidth: "480px", justifyContent: "center", alignItems: "center" 
          }}>
          <button onClick={() => setActiveFormTab("donor")} style={{ padding: "10px 24px", borderRadius: "30px", border: "none", background: activeFormTab === "donor" ? COLORS.white : "transparent", color: activeFormTab === "donor" ? COLORS.redDark : COLORS.white, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
            Directly 🩸 Donate Now
          </button>
          <button onClick={() => setActiveFormTab("hospital")} style={{ padding: "10px 24px", borderRadius: "30px", border: activeFormTab === "hospital" ? `2px solid ${COLORS.white}` : "1px solid rgba(255,255,255,0.4)", background: activeFormTab === "hospital" ? "rgba(255,255,255,0.15)" : "transparent", color: COLORS.white, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
            🏥 Hospital Login / Signup
          </button>
        </div>

        {/* SIGNUP FORM WINDOW WRAPPER FRAME */}
        <div style={{ background: COLORS.white, padding: "32px", borderRadius: "20px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "36px" }}>🩸</span>
            <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "8px 0 0", color: COLORS.dark }}>Blood Bank System</h2>
          </div>

          {/* Inline Selection Tabs Control */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
            <button onClick={() => setActiveFormTab("donor")} style={{ padding: "10px", borderRadius: "8px", border: activeFormTab === "donor" ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.grayL}`, background: COLORS.white, color: activeFormTab === "donor" ? COLORS.red : COLORS.gray, fontWeight: "700", cursor: "pointer" }}>
              DONOR
            </button>
            <button onClick={() => setActiveFormTab("hospital")} style={{ padding: "10px", borderRadius: "8px", border: activeFormTab === "hospital" ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.grayL}`, background: COLORS.white, color: activeFormTab === "hospital" ? COLORS.red : COLORS.gray, fontWeight: "700", cursor: "pointer" }}>
              HOSPITAL
            </button>
          </div>

          {/* DYNAMIC FIELD GENERATOR CHANNEL */}
          {activeFormTab === "donor" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>👤</span>Full Name</label>
                <input type="text" placeholder="e.g. Poojitha Sai" value={donorProfile.name} onChange={e => setDonorProfile({...donorProfile, name: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>✉️</span>Email Address</label>
                <input type="email" placeholder="you@email.com" value={donorProfile.email} onChange={e => setDonorProfile({...donorProfile, email: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>📱</span>Phone Number</label>
                <input type="text" placeholder="10-digit number" value={donorProfile.phone} onChange={e => setDonorProfile({...donorProfile, phone: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>🎂</span>Date of Birth</label>
                  <input type="date" value={donorProfile.dob} onChange={e => setDonorProfile({...donorProfile, dob: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>⚧</span>Gender</label>
                  <select value={donorProfile.gender} onChange={e => setDonorProfile({...donorProfile, gender: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, background: COLORS.white, boxSizing: "border-box" }}>
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>🩸</span>Blood Group</label>
                  <select value={donorProfile.bloodGroup} onChange={e => setDonorProfile({...donorProfile, bloodGroup: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, background: COLORS.white, boxSizing: "border-box" }}>
                    {Object.keys(COMPATIBILITY_MAP).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>📍</span>City</label>
                  <input type="text" placeholder="Your city" value={donorProfile.city} onChange={e => setDonorProfile({...donorProfile, city: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
                </div>
              </div>

              {/* NEW: Hospital selection — links this donor record to one hospital (plain text for now) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}><span style={{ marginRight: "4px" }}>🏥</span>Select Hospital</label>
                <input type="text" placeholder="e.g. Apollo Hospital Central" value={donorProfile.hospitalName} onChange={e => setDonorProfile({...donorProfile, hospitalName: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>

              <button onClick={handleDonorRegister} style={{ width: "100%", padding: "14px", background: COLORS.red, color: COLORS.white, border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "15px", marginTop: "12px", cursor: "pointer" }}>
                Register Account
              </button>
            </div>
          ) : (
            /* HOSPITAL SIGNUP STRUCT */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}>🏥 Hospital Institution Name</label>
                <input type="text" placeholder="e.g. Apollo Hospital Central" value={hospitalProfile.hospitalName} onChange={e => setHospitalProfile({...hospitalProfile, hospitalName: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}>👤 Administrator Executive Name</label>
                <input type="text" placeholder="e.g. Dr. R. K. Prasad" value={hospitalProfile.adminName} onChange={e => setHospitalProfile({...hospitalProfile, adminName: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}>🛡️ Facility License Key / ID</label>
                <input type="text" placeholder="e.g. APH-HYD-2026" value={hospitalProfile.hospitalId} onChange={e => setHospitalProfile({...hospitalProfile, hospitalId: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.dark }}>📍 Operational City</label>
                <input type="text" placeholder="e.g. Hyderabad" value={hospitalProfile.city} onChange={e => setHospitalProfile({...hospitalProfile, city: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>

              <button onClick={handleHospitalRegister} style={{ width: "100%", padding: "14px", background: COLORS.red, color: COLORS.white, border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "15px", marginTop: "12px", cursor: "pointer" }}>
                Register Facility Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return session.role === "donor" ? (
    <DonorPanel profile={donorProfile} setProfile={setDonorProfile} weather={liveWeather} setWeather={setLiveWeather} onLogout={() => setSession({ loggedIn: false, role: null })} />
  ) : (
    <HospitalPanel profile={hospitalProfile} weather={liveWeather} setWeather={setLiveWeather} onLogout={() => setSession({ loggedIn: false, role: null })} />
  );
}

// ============================================================================
//   GENERIC INTERFACE LAYOUT CORE
// ============================================================================
function SharedDashboardShell({ systemNodeRole, panelTitle, subtitle, tabs, activeTab, onTabChange, onLogout, children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.offWhite, fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 280, background: COLORS.dark, color: COLORS.white, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🩸</div>
          <div>
            <span style={{ fontWeight: "800", fontSize: 15 }}>BloodBankMS</span>
            <div style={{ fontSize: 10, color: COLORS.gray, fontWeight: 700, letterSpacing: 0.5 }}>{systemNodeRole} GATEWAY</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTabChange(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "none",
              background: activeTab === t.id ? `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})` : "transparent",
              color: activeTab === t.id ? COLORS.white : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left"
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "#ff8a80", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            🚪 Terminate Session
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 280, padding: "40px" }}>
        <header style={{ marginBottom: 30, borderBottom: `1px solid ${COLORS.grayL}`, paddingBottom: 15 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: COLORS.dark, margin: 0 }}>{panelTitle}</h1>
          <p style={{ color: COLORS.gray, fontSize: 13, marginTop: 4, margin: 0 }}>{subtitle}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

// ============================================================================
//   1. DONOR DASHBOARD DOMAIN
// ============================================================================
function DonorPanel({ profile, setProfile, weather, setWeather, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("09:00 AM - 11:30 AM");
  const [bookCenter, setBookCenter] = useState("");
  const [compatQuery, setCompatQuery] = useState(profile.bloodGroup);

  // Core Dynamic Weather Safety Logic
  const isHighTemperatureClimate = parseFloat(weather.temp) >= 38;

  const donorTabs = [
    { id: "overview", label: "Dashboard Quick Stats", icon: "📊" },
    { id: "profile", label: "My Profile Management", icon: "👤" },
    { id: "appointments", label: "Appointment Center", icon: "📅" },
    { id: "history", label: "Donation Logs Ledger", icon: "📜" },
    { id: "medical", label: "Verification Tools", icon: "🔬" }
  ];

  return (
    <SharedDashboardShell
      systemNodeRole="DONOR_CELL"
      panelTitle={`Welcome, ${profile.name || "Verified Donor"}`}
      subtitle={`City Context: ${profile.city || "Not Specified"} · Factor Group: ${profile.bloodGroup}`}
      tabs={donorTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
    >
      {/* DASHBOARD QUICK STATS */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* WEATHER CAUTION ALERT RIBBON */}
          <div style={{ background: isHighTemperatureClimate ? COLORS.redPale : COLORS.greenL, border: isHighTemperatureClimate ? `1.5px solid ${COLORS.red}` : `1.5px solid ${COLORS.green}`, padding: "20px", borderRadius: "14px", display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>{isHighTemperatureClimate ? "🥵" : "☀️"}</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", color: COLORS.dark }}>Weather Status Monitor: {weather.temp}°C · {weather.condition}</h4>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: COLORS.gray, lineHeight: "1.4" }}>
                {isHighTemperatureClimate 
                  ? "CRITICAL ALERT: Environmental temperatures are too high for safe whole blood extraction. Appointment scheduling has been frozen to protect donor recovery health metrics." 
                  : "STATUS STABLE: Outdoor thermal metrics are optimal. Booking slot allocation operations are active."}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>AGGREGATE DONATIONS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.red, marginTop: 4 }}>{profile.lastDonationDate ? "1 Unit" : "0 Units"}</div>
            </div>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>PATIENTS ASSISTED</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.green, marginTop: 4 }}>{profile.lastDonationDate ? "3 Patients" : "0 Patients"}</div>
            </div>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>NEXT ALLOCATED TIMEFRAME</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginTop: 6, color: isHighTemperatureClimate ? COLORS.red : COLORS.dark }}>
                {isHighTemperatureClimate ? "🔒 LOCKED (HIGH TEMP)" : (appointments.length > 0 ? appointments[0].date : "No active pipeline schedules")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MANAGEMENT MODULE */}
      {activeTab === "profile" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, maxWidth: "600px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>👤 Personal Parameters Registry</h3>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              style={{ padding: "6px 14px", background: COLORS.dark, color: COLORS.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              {isEditing ? "Commit Changes" : "Modify Record Data Fields"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>FULL NAME</label>
              <input type="text" disabled={!isEditing} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: !isEditing ? COLORS.offWhite : COLORS.white, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>EMAIL ADDRESS</label>
              <input type="email" disabled={!isEditing} value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: !isEditing ? COLORS.offWhite : COLORS.white, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>PHONE NUMBER</label>
              <input type="text" disabled={!isEditing} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: !isEditing ? COLORS.offWhite : COLORS.white, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>CITY</label>
                <input type="text" disabled={!isEditing} value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: !isEditing ? COLORS.offWhite : COLORS.white, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>DATE OF BIRTH (LOCKED)</label>
                <input type="text" disabled value={profile.dob || "Not Provided"} style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: COLORS.offWhite, color: COLORS.gray, boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT INTERLOCK RESERVATION CONTROLS */}
      {activeTab === "appointments" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>📅 Reserve Donation Session</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: COLORS.gray }}>System environment matrices dictate booking engine availability limits.</p>
            
            <form onSubmit={e => {
              e.preventDefault();
              if (isHighTemperatureClimate) return; 
              setAppointments([{ id: Date.now(), date: bookDate, time: bookTime, center: bookCenter, status: "Ready Queue" }, ...appointments]);
              setBookDate(""); setBookCenter("");
            }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} disabled={isHighTemperatureClimate} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, opacity: isHighTemperatureClimate ? 0.5 : 1, width: "100%", boxSizing: "border-box" }} required />
              <select value={bookTime} onChange={e => setBookTime(e.target.value)} disabled={isHighTemperatureClimate} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: COLORS.white, opacity: isHighTemperatureClimate ? 0.5 : 1, width: "100%", boxSizing: "border-box" }}>
                <option>09:00 AM - 11:30 AM</option>
                <option>02:00 PM - 04:30 PM</option>
              </select>
              <input type="text" placeholder="Collection Center Location Facility" value={bookCenter} onChange={e => setBookCenter(e.target.value)} disabled={isHighTemperatureClimate} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, opacity: isHighTemperatureClimate ? 0.5 : 1, width: "100%", boxSizing: "border-box" }} required />
              
              {isHighTemperatureClimate ? (
                <div style={{ padding: "12px", background: COLORS.redPale, color: COLORS.red, borderRadius: "6px", fontSize: "12px", fontWeight: "700", textAlign: "center", border: `1px solid ${COLORS.red}` }}>
                  🚨 OPERATIONS LOCKED: Registration is blocked due to excessive high temperatures ({weather.temp}°C).
                </div>
              ) : (
                <button type="submit" style={{ padding: "12px", background: COLORS.green, color: COLORS.white, border: "none", borderRadius: 6, fontWeight: "700", cursor: "pointer" }}>
                  Confirm Booking Slot Allocation
                </button>
              )}
            </form>
          </div>

          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 15px", fontSize: 15, fontWeight: 800 }}>📋 Registered Dynamic Schedules Matrix</h3>
            {appointments.length === 0 ? <p style={{ color: COLORS.gray, fontSize: 13 }}>No items allocated in tracking queue.</p> : (
              appointments.map(a => (
                <div key={a.id} style={{ border: `1px solid ${COLORS.grayL}`, padding: "12px", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: "700", fontSize: 13 }}>{a.date} · {a.time}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>📍 Center Node: {a.center}</div>
                  <button onClick={() => setAppointments(appointments.filter(x => x.id !== a.id))} style={{ color: COLORS.red, background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "8px 0 0", fontWeight: "700" }}>Cancel Slot</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DONATION LOGS LEDGER */}
      {activeTab === "history" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
          <h3 style={{ margin: "0 0 15px", fontSize: 15, fontWeight: 800 }}>📜 Whole Blood Storage Entry Logs Ledger</h3>
          <input type="date" value={profile.lastDonationDate} onChange={e => setProfile({...profile, lastDonationDate: e.target.value})} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, marginBottom: "15px" }} />
          {profile.lastDonationDate ? (
            <p style={{ fontSize: "13px", color: COLORS.green, fontWeight: "700" }}>✓ Registered Last Session Target Date Record: {profile.lastDonationDate}</p>
          ) : <p style={{ fontSize: "12px", color: COLORS.gray }}>No historic baseline logs specified yet on this profile token signature.</p>}
        </div>
      )}

      {/* MEDICAL VERIFICATION TOOLS */}
      {activeTab === "medical" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 15px", fontSize: 15, fontWeight: 800 }}>🧪 Cross-Match Factor Solver Matrix</h3>
          <input type="text" value={compatQuery} onChange={e => setCompatQuery(e.target.value.toUpperCase())} style={{ padding: "8px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, textTransform: "uppercase", width: "120px" }} />
          {COMPATIBILITY_MAP[compatQuery] ? (
            <div style={{ marginTop: 15, display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div><strong style={{ color: COLORS.red }}>Compatible Output Recipient Channels:</strong> {COMPATIBILITY_MAP[compatQuery].give.join(", ")}</div>
              <div><strong style={{ color: COLORS.green }}>Compatible Input Transfusion Vectors:</strong> {COMPATIBILITY_MAP[compatQuery].receive.join(", ")}</div>
            </div>
          ) : <p style={{ fontSize: "11px", color: COLORS.gray }}>Input validation string token factor properly.</p>}
        </div>
      )}
    </SharedDashboardShell>
  );
}

// ============================================================================
//   2. HOSPITAL / ADMIN CONTROL HUB (UPDATED WITH ALL SECTIONS)
// ============================================================================
function HospitalPanel({ profile, weather, setWeather, onLogout }) {
  // Configured default tracking to section 8 summary dashboard
  const [activeTab, setActiveTab] = useState("adminDashboard");
  
  // Storage inventory data matrix structure tracking volume, decay parameters and identifiers
  const [inventory, setInventory] = useState([
    { group: "A+",  units: 25, expiryDays: 3,  batch: "B-201" }, 
    { group: "A-",  units: 12, expiryDays: 14, batch: "B-202" }, 
    { group: "B+",  units: 40, expiryDays: 2,  batch: "B-203" }, 
    { group: "B-",  units: 8,  expiryDays: 24, batch: "B-204" },
    { group: "AB+", units: 18, expiryDays: 1,  batch: "B-205" }, 
    { group: "AB-", units: 5,  expiryDays: 19, batch: "B-206" }, 
    { group: "O+",  units: 55, expiryDays: 32, batch: "B-207" }, 
    { group: "O-",  units: 22, expiryDays: 4,  batch: "B-208" }
  ]);

  const [requests, setRequests] = useState([]);
  const [reqGroup, setReqGroup] = useState("O-");
  const [reqUnits, setReqUnits] = useState("");

  // Section 6 Compatibility state parameters
  const [patientBloodGroup, setPatientBloodGroup] = useState("A+");

  // Section 9 GPS Search Radius state constraints
  const [gpsRadiusKm, setGpsRadiusKm] = useState(10);
  const [locatedDonors, setLocatedDonors] = useState([]);
  const [isSearchingGps, setIsSearchingGps] = useState(false);

  // ── NEW: Donor registrations scoped to THIS hospital only ──────────────
  // Reads bloodbank_donations and filters to records belonging to this hospital.
  // Matches by hospitalId (exact) OR hospitalName (case-insensitive) so that
  // donors who typed the hospital name as free text still resolve correctly.
  const belongsToThisHospital = (d) => {
    if (d.hospitalId === profile.hospitalId) return true;
    if (d.hospitalName && profile.hospitalName) {
      return d.hospitalName.trim().toLowerCase() === profile.hospitalName.trim().toLowerCase();
    }
    return false;
  };

  const [myDonors, setMyDonors] = useState(() =>
    readStore(DONATIONS_KEY, []).filter(belongsToThisHospital)
  );

  // Re-read from storage whenever a donor registers anywhere (same tab via custom
  // event, or a different tab/window via the native "storage" event), so the
  // hospital dashboard updates instantly without needing a manual refresh.
  useEffect(() => {
    const refreshDonors = () => {
      setMyDonors(readStore(DONATIONS_KEY, []).filter(belongsToThisHospital));
    };
    window.addEventListener("bloodbank-sync", refreshDonors);
    window.addEventListener("storage", refreshDonors);
    return () => {
      window.removeEventListener("bloodbank-sync", refreshDonors);
      window.removeEventListener("storage", refreshDonors);
    };
  }, [profile.hospitalId, profile.hospitalName]);

  const handleUpdateStock = (group, val) => {
    setInventory(inventory.map(i => i.group === group ? { ...i, units: Math.max(0, parseInt(val) || 0) } : i));
  };

  // Section 9 Haversine Geometry Calculations Engine
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const executeGeoSpatialScan = () => {
    setIsSearchingGps(true);
    setTimeout(() => {
      const filtered = MOCK_DONORS_DB.map(donor => {
        const distance = calculateHaversineDistance(profile.lat || 17.3850, profile.lng || 78.4867, donor.lat, donor.lng);
        return { ...donor, distance: parseFloat(distance.toFixed(2)) };
      }).filter(donor => donor.distance <= gpsRadiusKm);
      setLocatedDonors(filtered);
      setIsSearchingGps(false);
    }, 600);
  };

  // Section 8 Summary Variables Aggregations
  // NOTE: total registered donors now reflects this hospital's own real
  // localStorage-backed registrations instead of a hardcoded figure.
  const totalDonorsSystemCount = myDonors.length;
  const totalActiveStockUnits = inventory.reduce((acc, curr) => acc + curr.units, 0);
  const totalExpiredUnitsCount = 6; // Evaluated simulation metric

  // Section 6 Mapping vectors
  const eligibleTransfusionSources = COMPATIBILITY_MAP[patientBloodGroup]?.receive || [];
  const compatibleInventoryBatches = inventory.filter(item => eligibleTransfusionSources.includes(item.group) || eligibleTransfusionSources.includes("All Blood Types"));

  const adminTabs = [
    { id: "adminDashboard", label: "Admin Dashboard Summary", icon: "📊" },
    { id: "donorRegistry", label: "Registered Donors", icon: "👥" },
    { id: "inventory", label: "Inventory Warehouse Stock", icon: "🩸" },
    { id: "compatibility", label: "Compatibility Checker", icon: "🔬" },
    { id: "expiry", label: "Expiry Management", icon: "⏳" },
    { id: "geoFinder", label: "Geo Location Finder", icon: "📍" },
    { id: "requests", label: "Allocation Requests Pipeline", icon: "📨" },
    { id: "weatherAdmin", label: "Weather Simulation Control", icon: "🌦️" }
  ];

  return (
    <SharedDashboardShell
      systemNodeRole="ADMIN_HOSPITAL"
      panelTitle={profile.hospitalName || "Apollo Hospital Central"}
      subtitle={`Administrator Executive Signature: ${profile.adminName || "Dr. R. K. Prasad"}`}
      tabs={adminTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
    >
      
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 8: ADMIN DASHBOARD VIEW                                       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "adminDashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Executive Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, borderLeft: `5px solid ${COLORS.dark}`, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>TOTAL REGISTERED DONORS</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.dark, marginTop: 4 }}>{totalDonorsSystemCount}</div>
            </div>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, borderLeft: `5px solid ${COLORS.green}`, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>AVAILABLE WAREHOUSE STOCK</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.green, marginTop: 4 }}>{totalActiveStockUnits} Units</div>
            </div>
            <div style={{ background: COLORS.white, padding: "20px", borderRadius: 12, borderLeft: `5px solid ${COLORS.red}`, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>EXPIRED UNITS INDEX (MONTHLY)</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.red, marginTop: 4 }}>{totalExpiredUnitsCount} Units</div>
            </div>
          </div>

          {/* Graphical Representation Matrices */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800 }}>📈 Distribution Volume Chart</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "160px", paddingBottom: "10px", borderBottom: `2px solid ${COLORS.grayL}` }}>
                {inventory.map(item => (
                  <div key={item.group} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", height: `${Math.min(130, (item.units / 60) * 130)}px`, background: item.expiryDays <= 5 ? COLORS.red : `linear-gradient(to top, ${COLORS.redDark}, ${COLORS.red})`, borderRadius: "4px 4px 0 0", transition: "all 0.3s" }} />
                    <span style={{ fontSize: "11px", fontWeight: "700", marginTop: "6px", color: COLORS.dark }}>{item.group}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800 }}>📊 Storage Category Ratio Breakdown</h3>
              <div style={{ display: "flex", gap: "6px", height: "30px", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ width: "45%", background: COLORS.redDark }} />
                <div style={{ width: "35%", background: COLORS.red }} />
                <div style={{ width: "20%", background: COLORS.orange }} />
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "16px", fontSize: "11px", fontWeight: "700", color: COLORS.gray }}>
                <div><span style={{ color: COLORS.redDark }}>●</span> Critical Type O (45%)</div>
                <div><span style={{ color: COLORS.red }}>●</span> Type A/B Stable (35%)</div>
                <div><span style={{ color: COLORS.orange }}>●</span> Alert Near-Expiry (20%)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* NEW SECTION: REGISTERED DONORS (scoped to this hospital only)        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "donorRegistry" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>👥 Registered Donor Registry</h3>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: COLORS.gray }}>
            Donors who registered with <strong>{profile.hospitalName || "this hospital"}</strong>, retrieved from persistent local storage. Other hospitals cannot see these records.
          </p>
          {myDonors.length === 0 ? (
            <p style={{ color: COLORS.gray, fontSize: 13 }}>No donors have registered with this hospital yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myDonors.map(d => (
                <div key={d.id} style={{ border: `1px solid ${COLORS.grayL}`, borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.dark }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>{d.city || "—"} · {d.phone || "—"} · {d.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ padding: "4px 10px", background: COLORS.redPale, color: COLORS.red, borderRadius: 4, fontSize: 12, fontWeight: 800 }}>{d.bloodGroup}</span>
                    <span style={{ fontSize: 11, color: COLORS.gray }}>{new Date(d.registeredAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY STATIONS BLOCK */}
      {activeTab === "inventory" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>📦 Raw Inventory Allocation Nodes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {inventory.map(i => (
              <div key={i.group} style={{ padding: 16, borderRadius: 8, background: COLORS.offWhite, border: `1px solid ${COLORS.grayL}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{i.group} Factor</span>
                  <span style={{ padding: "2px 8px", background: COLORS.white, borderRadius: 4, fontSize: 12, fontWeight: 800, color: COLORS.red }}>{i.units} Units</span>
                </div>
                <input type="number" value={i.units} onChange={e => handleUpdateStock(i.group, e.target.value)} style={{ width: "100%", padding: "6px", marginTop: 10, borderRadius: 4, border: `1px solid ${COLORS.grayL}`, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 6: COMPATIBILITY CHECKER                                      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "compatibility" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>🔬 Emergency Transfusion Cross-Match Diagnostic Solver</h3>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: COLORS.gray }}>Select blood type profile vectors to filter matching units inside the vault space.</p>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <label style={{ fontSize: "13px", fontWeight: "800", color: COLORS.dark }}>PATIENT BLOOD GROUP ENTER:</label>
            <select value={patientBloodGroup} onChange={e => setPatientBloodGroup(e.target.value)} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${COLORS.grayL}`, background: COLORS.white, fontWeight: "800", color: COLORS.red }}>
              {Object.keys(COMPATIBILITY_MAP).map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <div style={{ background: COLORS.grayL, padding: "14px 20px", borderRadius: "8px", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", color: COLORS.dark }}>🧬 Allowed Match Vectors for Patient <strong>{patientBloodGroup}</strong>: </span>
            {eligibleTransfusionSources.map(v => <span key={v} style={{ background: COLORS.white, padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "800", marginLeft: "6px", border: `1px solid ${COLORS.redMid}`, color: COLORS.redDark }}>{v}</span>)}
          </div>

          <h4 style={{ fontSize: "13px", fontWeight: "800", color: COLORS.gray, margin: "0 0 10px" }}>COMPATIBLE BLOOD UNITS INSTANT VIEW</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {compatibleInventoryBatches.map(item => (
              <div key={item.group} style={{ background: item.units > 0 ? COLORS.greenL : COLORS.offWhite, padding: "16px", borderRadius: "8px", border: item.units > 0 ? `1px solid ${COLORS.green}` : `1px solid ${COLORS.grayL}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: "900" }}>{item.group}</span>
                  <span style={{ padding: "2px 8px", background: COLORS.white, borderRadius: "4px", fontSize: "12px", fontWeight: "800" }}>{item.units} Units</span>
                </div>
                <div style={{ fontSize: "11px", color: COLORS.gray, marginTop: "8px" }}>Batch: {item.batch} · Expiry: {item.expiryDays} days</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 7: EXPIRY MANAGEMENT                                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "expiry" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Wastage Prevention Alerts */}
          <div style={{ background: COLORS.orangeL, border: `1.5px solid ${COLORS.orange}`, padding: "16px 20px", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", color: COLORS.dark }}>Wastage Prevention Alert Protocol Activated</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: COLORS.gray }}>Biological materials with less than 5 shelf days remain flagged below for mandatory immediate routing.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Near-Expiry Highlights */}
            <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800 }}>⏳ Storage Life Expiry Log Track</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {inventory.map(item => {
                  const isNearExpiry = item.expiryDays <= 5;
                  return (
                    <div key={item.group} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", background: isNearExpiry ? COLORS.redPale : COLORS.offWhite, border: isNearExpiry ? `1px solid ${COLORS.red}` : `1px solid ${COLORS.grayL}` }}>
                      <div>
                        <strong style={{ fontSize: "14px", color: isNearExpiry ? COLORS.redDark : COLORS.dark }}>{item.group} ({item.batch})</strong>
                        <div style={{ fontSize: "11px", color: COLORS.gray }}>Available: {item.units} Units</div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "800", color: isNearExpiry ? COLORS.redDark : COLORS.green }}>
                        {isNearExpiry ? `🚨 CRITICAL: ${item.expiryDays} DAYS LEFT` : `${item.expiryDays} Days Remaining`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Use First" Priority List */}
            <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>⚡ "Use First" Priority Dispensation Pipeline</h3>
              <p style={{ margin: "0 0 15px", fontSize: 12, color: COLORS.gray }}>Dynamically ordered by structural decay rate indicators.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {inventory.filter(i => i.units > 0).sort((a, b) => a.expiryDays - b.expiryDays).map((item, index) => (
                  <div key={item.group} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: COLORS.grayL, borderRadius: "6px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: index === 0 ? COLORS.red : COLORS.dark, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>{index + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: "800" }}>Dispense Priority: Group {item.group}</div>
                      <div style={{ fontSize: "11px", color: COLORS.gray }}>Batch: {item.batch} · Shelf Life: {item.expiryDays} Days</div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: COLORS.red }}>RANK {10 - index}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 9: GEO LOCATION BASED DONOR FINDER                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "geoFinder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800 }}>📍 Haversine GPS Distance Extraction Array</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: COLORS.gray }}>Utilizes mathematical GPS calculations to locate compatible responders instantly.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <select value={gpsRadiusKm} onChange={e => setGpsRadiusKm(parseInt(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: COLORS.white }}>
                <option value={5}>Within 5 Kilometers Radius Range</option>
                <option value={10}>Within 10 Kilometers Radius Range</option>
                <option value={25}>Within 25 Kilometers Radius Range</option>
              </select>
              <button onClick={executeGeoSpatialScan} disabled={isSearchingGps} style={{ padding: "12px", background: COLORS.dark, color: COLORS.white, border: "none", borderRadius: 6, fontWeight: "800", cursor: "pointer" }}>
                {isSearchingGps ? "Connecting Live Maps APIs Grid..." : "🛰️ Query Live GPS Coordinates"}
              </button>
              <div style={{ height: "140px", background: "#e3f2fd", borderRadius: "10px", border: `1px dashed ${COLORS.gray}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#1565c0" }}>📍 Hospital Anchor Node Reference: Lat 17.3850 / Lng 78.4867</span>
              </div>
            </div>
          </div>
          
          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 15px", fontSize: 14, fontWeight: 800 }}>👥 Nearby Identified Target Responders Map</h3>
            {locatedDonors.length === 0 ? <p style={{ color: COLORS.gray, fontSize: 12 }}>Trigger GPS scanner grid arrays above to fetch values.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {locatedDonors.map(donor => (
                  <div key={donor.id} style={{ padding: "12px", border: `1px solid ${COLORS.grayL}`, borderRadius: "8px", background: COLORS.offWhite, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>{donor.name} <span style={{ color: COLORS.red }}>({donor.bloodGroup})</span></strong>
                      <div style={{ fontSize: "11px", color: COLORS.gray }}>Secure Mobile Node: {donor.phone}</div>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: COLORS.green }}>{donor.distance} km away</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALLOCATION REQUESTS PIPELINE */}
      {activeTab === "requests" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>📨 Generate Allocation Order</h3>
            <form onSubmit={e => {
              e.preventDefault();
              setRequests([{ id: Date.now(), group: reqGroup, units: reqUnits, status: "Pending Verification" }, ...requests]);
              setReqUnits("");
            }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <select value={reqGroup} onChange={e => setReqGroup(e.target.value)} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, background: COLORS.white }}>
                {inventory.map(i => <option key={i.group} value={i.group}>{i.group}</option>)}
              </select>
              <input type="number" placeholder="Requested Units Amount" value={reqUnits} onChange={e => setReqUnits(e.target.value)} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}` }} required />
              <button type="submit" style={{ padding: "12px", background: COLORS.red, color: COLORS.white, border: "none", borderRadius: 6, fontWeight: "700", cursor: "pointer" }}>Broadcast Demand Stream</button>
            </form>
          </div>
          
          <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 15px", fontSize: 15, fontWeight: 800 }}>📋 Active Allocation Logs</h3>
            {requests.length === 0 ? <p style={{ color: COLORS.gray, fontSize: 13 }}>No entries in request pool.</p> : requests.map(r => (
              <div key={r.id} style={{ border: `1px solid ${COLORS.grayL}`, padding: "12px", borderRadius: 8, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: 13 }}>Factor Type: {r.group}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>Required Volumetric Metric: {r.units} Units</div> </div>
                <span style={{ fontSize: 11, background: COLORS.orangeL, color: COLORS.orange, padding: "4px 8px", borderRadius: 4, fontWeight: "700" }}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLIMATE SIMULATION CENTRAL HUB */}
      {activeTab === "weatherAdmin" && (
        <div style={{ background: COLORS.white, padding: "24px", borderRadius: 12, maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800 }}>🌦️ Weather Safety Simulation Core</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: COLORS.gray }}>Modify simulation variables below to evaluate global extraction safety interlocks.</p>
          <input type="number" value={weather.temp} onChange={e => setWeather({...weather, temp: parseInt(e.target.value) || 0})} style={{ padding: "10px", borderRadius: 6, border: `1px solid ${COLORS.grayL}`, width: "100%", boxSizing: "border-box" }} />
          <div style={{ padding: "12px", borderRadius: "6px", background: weather.temp >= 38 ? COLORS.redPale : COLORS.greenL, color: weather.temp >= 38 ? COLORS.red : COLORS.green, fontSize: "12px", fontWeight: "700", marginTop: "12px" }}>
            Current Directive Status: {weather.temp >= 38 ? "🚨 INTERLOCK TRIGGERED (Donor Operations Blocked Globally)" : "✓ SYSTEM PARAMETERS STABLE"}
          </div>
        </div>
      )}
    </SharedDashboardShell>
  );
}
