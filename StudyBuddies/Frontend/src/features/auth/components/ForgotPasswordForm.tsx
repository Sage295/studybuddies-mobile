import { useState } from "react";
import { buildApiUrl } from "../../../api/config";

type Props = {
  setPage: (page: "login" | "signup" | "forgot" | "reset") => void;
};

const ForgotPasswordForm = ({ setPage }: Props) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(buildApiUrl("/api/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to send reset email.");
        return;
      }

      setMessage(
        data.message ||
          "If an account with that email exists, a password reset link has been sent."
      );
    } catch (err) {
      console.error(err);
      setError("Server error. Make sure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "380px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <h2 style={{ fontSize: "28px" }}>Reset password</h2>

      <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
        Enter the email tied to your account and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", opacity: 0.8 }}>Email</label>
          <div style={{ borderBottom: "1px solid #aaa", paddingBottom: "6px", marginTop: "5px" }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
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
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "30px",
            border: "none",
            background: "linear-gradient(to right, #7c7cff, #a855f7)",
            color: "white",
            fontSize: "16px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
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
        onClick={() => setPage("login")}
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

export default ForgotPasswordForm;
