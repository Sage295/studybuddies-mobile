import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import "./Navbar.css";
import logo from "../../assets/logo.png";

type NavItem = "home" | "tasks" | "calendar" | "profile";

const Navbar = () => {
  const [active, setActive] = useState<NavItem>("home");
  const navigate = useNavigate();

  const navItems: { id: NavItem; icon: string }[] = [
    { id: "home", icon: "🏠" },
    { id: "tasks", icon: "📋" },
    { id: "calendar", icon: "📅" },
    { id: "profile", icon: "👤" },
  ];

  const handleClick = (id: NavItem) => {
    setActive(id);

    if (id === "home") navigate("/");
    if (id === "calendar") navigate("/events");
    if (id === "tasks") navigate("/files");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    window.location.reload();
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <img src={logo} alt="Study Buddy Logo" />
      </div>

      <div className="nav-items">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${active === item.id ? "active" : ""}`}
            onClick={() => handleClick(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* LOGOUT BUTTON */}
      <button className="logout-btn" onClick={handleLogout}>
        🚪
      </button>
    </div>
  );
};

export default Navbar;
