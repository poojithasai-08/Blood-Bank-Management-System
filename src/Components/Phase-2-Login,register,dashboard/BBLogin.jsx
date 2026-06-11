import { useState } from "react";

const C = {
  red: "#c0202a", redDark: "#8b0000", redPale: "#fff0f0",
  blue: "#1565c0", blueDark: "#0d3b8e", bluePale: "#e8f0fe",
  white: "#ffffff", gray: "#6b7280", grayBorder: "#e2e2e2",
};

const Field = ({ label, icon, type = "text", as, children, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ 
      display: "block", fontSize: 11, fontWeight: 700, 
      color: "#444", marginBottom: 4 
      }}>
        {icon} 
      {label}
      </label>
    {as === "select" ? (
      <select {...props} required style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13 }}>{children}</select>
    ) : (
      <input type={type} {...props} required style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13 }} />
    )}
  </div>
);

export default function App({ onLoginSuccess }) {
  const [role, setRole] = useState("donor");
  const [mode, setMode] = useState("login");
  const ac = role === "donor" ? C.red : C.blue;

  return (
    <div style={{ 
      minHeight: "100vh", background: "#f9f9f9", 
      display: "flex", alignItems: "center", 
      justifyContent: "center", padding: 20 
      }}>
      <div style={{ 
        width: "100%", maxWidth: 450, 
        background: C.white, borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
        overflow: "hidden" 
        }}>
        <div style={{
           height: 6, background: ac 
           }} />
        <div style={{ 
          padding: 28 
          }}>
          <div style={{ 
            textAlign: "center", marginBottom: 20 
            }}>
            <div style={{
               fontSize: 40 
               }}>{
                role === "donor" ? "🩸" : "🏥"
                }
                </div>
            <h2 style={{ 
              fontSize: 20, margin: "5px 0" 
              }}>Blood Bank System</h2>
          </div>

          <div style={{ 
            display: "flex", gap: 10, marginBottom: 15 
            }}>
            {["donor", "hospital"].map(r => (
              <button key={r} onClick={() => {setRole(r); setMode("login");}} 
              style={{ flex: 1, padding: 10, borderRadius: 10, 
                border: `2px solid ${role === r ? ac : C.grayBorder}`, background: "none", 
                cursor: "pointer", fontWeight: 700, 
                color: role === r ? ac : C.gray 
              }}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onLoginSuccess?.(); }}>
            {mode === "signup" && role === "donor" && (
              <>
                <Field label="Full Name" icon="👤" placeholder="e.g. Poojitha Sai" />
                <Field label="Email Address" icon="✉️" type="email" placeholder="you@email.com" />
                <Field label="Phone Number" icon="📱" placeholder="10-digit number" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Date of Birth" icon="🎂" type="date" />
                  <Field label="Gender" icon="⚧" as="select"><option value="">Select</option><option>Male</option><option>Female</option></Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Blood Group" icon="🩸" as="select"><option value="">Select</option>
                  <option>A+</option>
                  <option>B+</option>
                  <option>O+</option>
                  </Field>
                  <Field label="City" icon="📍" placeholder="Your city" />
                </div>
              </>
            )}
            
            {mode === "signup" && role === "hospital" && (
              <>
                <Field label="Registration / License ID" icon="🪪" placeholder="e.g. HOS-AP-2024-001" />
                <Field label="Official Email" icon="📧" type="email" placeholder="admin@hospital.org" />
                <Field label="Phone Number" icon="📞" placeholder="10-digit number" />
                <Field label="Full Address" icon="📍" placeholder="Street, Area" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="City" icon="🌆" placeholder="City" />
                  <Field label="State" icon="🗺️" as="select"><option value="">Select State</option></Field>
                </div>
                <div style={{ 
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 
                  }}>
                  <Field label="Hospital Type" icon="🏗️" as="select">
                    <option value="">Select Type</option>
                    <option>Private</option>
                    <option>Government</option>
                    </Field>
                  <Field label="Contact Person" icon="👨‍⚕️" placeholder="Name" />
                </div>
              </>
            )}

            {mode === "login" && (
              <>
                <Field label="Email Address" icon="✉️" type="email" placeholder={role === "donor" ? "donor@example.com" : "hospital@org.com"} />
                <Field label="Password" icon="🔒" type="password" placeholder="Enter your password" />
              </>
            )}

            <button style={{ width: "100%", padding: 12, background: ac, 
              color: "white", border: "none", borderRadius: 10, fontWeight: 800,
               marginTop: 10, cursor: "pointer" }}>
              {mode === "login" ? "Login" : "Register Account"}
            </button>
          </form>

         <p style={{ 
          textAlign: "center", fontSize: 13, marginTop: 15, color: C.gray
           }}>
  {
  mode === "login" ? "Don't have an account? " : "Already registered? "
  }
  <span 
    onClick={() => setMode(mode === "login" ? "signup" : "login")}
    style={{ 
      color: ac,          // This uses your dynamic red/blue variable
      fontWeight: 800,    // Makes it bold for visibility
      cursor: "pointer" 
    }}
  >
    {mode === "login" ? "Sign up here" : "Login here"}
  </span>
</p>
        </div>
      </div>
    </div>
  );
}