import { useEffect, useState } from "react";
import { buildApiUrl } from "../../../api/config";

type Props = {
  setPage: (page: "login" | "signup" | "forgot" | "reset") => void;
};

const ResetPasswordForm = ({ setPage }: Props) => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("resetToken") || "";
    setToken(resetToken);

    if (!resetToken) {
      setError("Reset link is missing or invalid.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(buildApiUrl("/api/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      setMessage(data.message || "Password reset successful. Please sign in.");
      window.history.replaceState({}, "", "/reset-password");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPage("login"), 1500);
    } catch (err) {
      console.error(err);
      setError("Server error. Make sure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "380px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <h2 style={{ fontSize: "28px" }}>Choose a new password</h2>

      <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
        Enter a new password for your account. Reset links expire after one hour.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontSize: "12px", opacity: 0.8 }}>New password</label>
          <div style={{ borderBottom: "1px solid #aaa", paddingBottom: "6px", marginTop: "5px", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
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

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", opacity: 0.8 }}>Confirm password</label>
          <div style={{ borderBottom: "1px solid #aaa", paddingBottom: "6px", marginTop: "5px", display: "flex", alignItems: "center" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMessage("");
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
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !token}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "30px",
            border: "none",
            background: "linear-gradient(to right, #7c7cff, #a855f7)",
            color: "white",
            fontSize: "16px",
            cursor: isSubmitting || !token ? "not-allowed" : "pointer",
            opacity: isSubmitting || !token ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>

      {message ? (
        <div style={{ color: "#7CFC98", fontSize: "13px", marginTop: "-6px" }}>{message}</div>
      ) : null}
      {error ? (
        <div style={{ color: "#ff4d4f", fontSize: "13px", marginTop: "-6px" }}>{error}</div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          window.history.replaceState({}, "", "/reset-password");
          setPage("login");
        }}
        style={{
          border: "none",
          background: "transparent",
          color: "#7c7cff",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
          fontSize: "14px",
        }}
      >
        Back to sign in
      </button>
    </div>
  );
};

export default ResetPasswordForm;
