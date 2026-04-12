import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../../api/config";
import { googleLogin } from "../../../api/googleLogin";

type Props = {
  setPage: (page: "login" | "signup" | "forgot" | "reset") => void;
  setIsAuthenticated: (val: boolean) => void;
};

const LoginForm = ({ setPage, setIsAuthenticated }: Props) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");

    if (verified === "success") {
      setMessage("Email verified. You can sign in now.");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (verified === "invalid") {
      setError("Verification link is invalid or expired.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

 
  const handleLogin = async () => {
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/api/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data); 

  
      if (!res.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }

      if (data.error && data.error.length > 0) {
        setError(data.error);
        return;
      }

      if (data.id === -1) { 
        setError("Invalid login");
        return;
      }

    
      localStorage.setItem("user", JSON.stringify(data));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      window.dispatchEvent(new Event("auth-changed"));
      setIsAuthenticated(true);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Server error. Make sure backend is running.");
    }
  };

  return (
    <div style={{ width: "380px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "30px", marginBottom: "10px" }}>Sign in</h2>

      <p style={{ fontSize: "15px", lineHeight: "1.6" }}>
        Don't have an account?{" "}
        <span style={{ color: "#7c7cff", cursor: "pointer" }} onClick={() => setPage("signup")}>
          Register here!
        </span>
      </p>

      <div>
        <label style={{ fontSize: "12px", opacity: 0.8 }}>Email</label>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #aaa", paddingBottom: "6px", marginTop: "5px" }}>
          <span style={{ marginRight: "8px" }}>📧</span>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              width: "100%",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "12px", opacity: 0.8 }}>Password</label>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #aaa", paddingBottom: "6px", marginTop: "5px" }}>
          <span style={{ marginRight: "8px" }}>🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              width: "100%",
              fontSize: "14px",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              background: "transparent",
              border: "none",
              color: "#cfcfff",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "8px",
              padding: 0,
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPage("forgot")}
        style={{
          border: "none",
          background: "transparent",
          color: "#7c7cff",
          cursor: "pointer",
          padding: 0,
          marginTop: "-8px",
          textAlign: "left",
          fontSize: "13px",
        }}
      >
        Forgot password?
      </button>

      {error && <div style={{ color: "#e05c7a", fontSize: "0.85rem" }}>{error}</div>}
      {message && <div style={{ color: "#7CFC98", fontSize: "0.85rem" }}>{message}</div>}

      <button
        type="button"
        onClick={handleLogin}
        style={{ width: "100%", padding: "14px", borderRadius: "30px", border: "none", background: "linear-gradient(to right, #7c7cff, #a855f7)", color: "white", fontSize: "16px", cursor: "pointer" }}
      >
        Login
      </button>

      <div style={{ textAlign: "center", fontSize: "13px", color: "#7c7cff" }}>
        or continue with
      </div>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          style={{ width: "28px", cursor: "pointer" }}
          onClick={googleLogin}
        />
      </div>
    </div>
  );
};

export default LoginForm;
