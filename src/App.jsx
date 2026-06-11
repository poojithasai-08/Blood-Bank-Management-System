// =====================================================
// App.jsx — Main controller
// Connects HomePage → BBLogin → Dashboard
// =====================================================

import { useState } from "react";

// Import all your pages
import HomePage  from "./Components/Phase-2-Login,register,dashboard/Homepage";
import BBLogin   from "./Components/Phase-2-Login,register,dashboard/BBLogin";
import Dashboard from "./Components/Phase-2-Login,register,dashboard/dashboard";

export default function App() {

  // This controls which page is currently showing
  // "home" → shows HomePage
  // "login" → shows BBLogin
  // "dashboard" → shows Dashboard
  const [page, setPage] = useState("home");

  // ── Show Home Page ──
  if (page === "home") {
    return (
      <HomePage
        onLoginClick={() => setPage("login")}
      />
    );
  }

  // ── Show Login/Signup Page ──
  if (page === "login") {
    return (
      <BBLogin
        onLoginSuccess={() => setPage("dashboard")}
      />
    );
  }

  // ── Show Dashboard Page ──
  if (page === "dashboard") {
    return (
      <Dashboard />
    );
  }

}