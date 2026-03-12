// pages/login/+Page.jsx
import { useState, useEffect, useRef } from "react";
import skyupLogo from "../../assets/SKYUP_Logo.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Plus Jakarta Sans',sans-serif}
@keyframes floatA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.08)}}
@keyframes floatB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,30px) scale(1.05)}}
@keyframes floatC{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,20px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.45),0 0 40px 10px rgba(201,168,76,.12)}50%{box-shadow:0 0 0 10px rgba(201,168,76,0),0 0 60px 20px rgba(201,168,76,.08)}}
@keyframes logoPop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes fadeSlide{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
.login-card{--mx:50%;--my:50%;position:relative}
.login-card::before{content:'';position:absolute;inset:0;border-radius:24px;background:radial-gradient(circle 220px at var(--mx) var(--my),rgba(0,55,202,.07) 0%,transparent 70%);pointer-events:none;transition:background .1s;z-index:0}
.btn-primary{width:100%;height:52px;border:none;border-radius:14px;background:linear-gradient(135deg,#0037CA 0%,#1a4fd8 100%);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.95rem;font-weight:700;letter-spacing:.4px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;box-shadow:0 6px 24px rgba(0,55,202,.35);transition:transform .18s,box-shadow .18s,opacity .18s;position:relative;overflow:hidden}
.btn-primary::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%);border-radius:inherit}
.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,55,202,.45)}
.btn-primary:active:not(:disabled){transform:translateY(0)}
.btn-primary:disabled{opacity:.65;cursor:not-allowed}
.btn-link{background:none;border:none;color:#0037CA;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px}
.btn-link:hover{color:#1a4fd8}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
.otp-inputs{display:flex;gap:10px;justify-content:center;margin:20px 0}
.otp-box{width:48px;height:56px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:1.4rem;font-weight:700;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;color:#0d1a3a;background:#f9fafb;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}
.otp-box:focus{border-color:#0037CA;background:#fff;box-shadow:0 0 0 3px rgba(0,55,202,.1)}
.step-anim{animation:fadeSlide .35s ease both}
`;

function useMouseGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);
  return ref;
}

function FloatingOrbs() {
  return (
    <div style={S.orbsWrap} aria-hidden>
      <div style={{ ...S.orb, ...S.orb1 }} />
      <div style={{ ...S.orb, ...S.orb2 }} />
      <div style={{ ...S.orb, ...S.orb3 }} />
    </div>
  );
}

function LogoHero() {
  return (
    <div style={S.logoHero}>
      <div style={S.logoRing}>
        <div style={S.logoGlow} />
        <img src={skyupLogo} alt="SkyUp Digital" style={S.logoImg} />
      </div>
      <div style={S.logoText}>
        <h1 style={S.brandTitle}>Skyup Digital Solutions</h1>
        <p style={S.brandSub}>Salary Slip Management System</p>
      </div>
    </div>
  );
}

function AlertBox({ message, type = "error" }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      style={{
        ...S.alertBox,
        background: isSuccess ? "#f0fdf4" : "#fff5f5",
        borderColor: isSuccess ? "#86efac" : "#fecaca",
        color: isSuccess ? "#15803d" : "#c53030",
      }}
      role="alert"
    >
      <span>{isSuccess ? "✅" : "⚠"}</span> {message}
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder, autoComplete, addon, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div
        style={{
          ...S.inputWrap,
          borderColor: focused ? "#0037CA" : "#e5e7eb",
          background: focused ? "#fff" : "#f9fafb",
          boxShadow: focused ? "0 0 0 3px rgba(0,55,202,0.1)" : "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={S.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
        />
        {addon && <span style={S.inputAddon}>{addon}</span>}
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }) {
  const digits = (value + "      ").slice(0, 6).split("");
  const inputsRef = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const newVal = value.slice(0, i) + value.slice(i + 1);
      onChange(newVal);
      if (i > 0) inputsRef.current[i - 1]?.focus();
      return;
    }
    if (/^\d$/.test(e.key)) {
      const newVal = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6);
      onChange(newVal);
      if (i < 5) inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) onChange(pasted);
  };

  return (
    <div className="otp-inputs">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          className="otp-box"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

// ── Step 1: Login ─────────────────────────────────────────────────────────────
function LoginStep({ onForgotPassword }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Please enter both username and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Login failed. Please check your credentials."); return; }
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_info", JSON.stringify(data.admin));
      window.location.replace("/");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Welcome Back</h2>
        <p style={S.cardSub}>Sign in to continue to your dashboard</p>
      </div>
      <AlertBox message={error} />
      <form onSubmit={handleSubmit}>
        <InputField
          label="Username" type="text" value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username" autoComplete="username"
          addon={<span style={{ fontSize: "1rem", color: "#a0aec0" }}>👤</span>}
        />
        <InputField
          label="Password" type={showPass ? "text" : "password"} value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password"
          addon={
            <span onClick={() => setShowPass((v) => !v)}
              style={{ cursor: "pointer", fontSize: "1rem", color: "#a0aec0", userSelect: "none" }}>
              {showPass ? "🙈" : "👁"}
            </span>
          }
        />
        <div style={{ textAlign: "left", marginTop: -10, marginBottom: 18 }}>
          <button type="button" className="btn-link" onClick={onForgotPassword}>
            Forgot Password?
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

// ── Step 2: Enter Owner Gmail ─────────────────────────────────────────────────
function ForgotEmailStep({ onOtpSent, onBack }) {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!ownerEmail) { setError("Please enter the owner Gmail."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: ownerEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("OTP sent to owner Gmail! Check your inbox.");
        setTimeout(() => onOtpSent(ownerEmail.trim()), 1500);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <button onClick={onBack} style={S.backBtn}>← Back to Login</button>
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Forgot Password</h2>
        <p style={S.cardSub}>Enter the owner Gmail to receive a 6-digit OTP</p>
      </div>
      <AlertBox message={error} />
      <AlertBox message={success} type="success" />
      <form onSubmit={handleSend}>
        <InputField
          label="Owner Gmail" type="email" value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="Enter owner Gmail account" autoComplete="email"
          addon={<span style={{ fontSize: "1rem", color: "#a0aec0" }}>🔐</span>}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>
    </div>
  );
}

// ── Step 3: Enter OTP ─────────────────────────────────────────────────────────
function OtpStep({ ownerEmail, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the full 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail, otp }),
      });
      const data = await res.json();
      if (data.success) {
        onVerified(data.resetToken);
      } else {
        setError(data.message || "Invalid OTP.");
        setOtp("");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(""); setError(""); setOtp("");
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail }),
      });
      setResendMsg("A new OTP has been sent to the owner Gmail.");
      setResendCooldown(60);
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  return (
    <div className="step-anim">
      <button onClick={onBack} style={S.backBtn}>← Back</button>
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Enter OTP</h2>
        <p style={S.cardSub}>
          We sent a 6-digit code to <strong>{ownerEmail}</strong>
        </p>
      </div>
      <AlertBox message={error} />
      <AlertBox message={resendMsg} type="success" />
      <form onSubmit={handleVerify}>
        <OtpInput value={otp} onChange={setOtp} />
        <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Verifying…" : "Verify OTP"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        {resendCooldown > 0 ? (
          <p style={{ fontSize: "0.8rem", color: "#8a95a8" }}>Resend in {resendCooldown}s</p>
        ) : (
          <button className="btn-link" onClick={handleResend}>Resend OTP</button>
        )}
      </div>
    </div>
  );
}

// ── Step 4: New Password ──────────────────────────────────────────────────────
function NewPasswordStep({ resetToken, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) { onDone(); }
      else { setError(data.message || "Failed to reset password."); }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-anim">
      <div style={S.cardHeader}>
        <h2 style={S.cardTitle}>Set New Password</h2>
        <p style={S.cardSub}>Choose a strong password for your account</p>
      </div>
      <AlertBox message={error} />
      <form onSubmit={handleReset}>
        <InputField
          label="New Password" type={showNew ? "text" : "password"} value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters" autoComplete="new-password"
          addon={
            <span onClick={() => setShowNew((v) => !v)}
              style={{ cursor: "pointer", fontSize: "1rem", color: "#a0aec0", userSelect: "none" }}>
              {showNew ? "🙈" : "👁"}
            </span>
          }
        />
        <InputField
          label="Confirm Password" type={showConfirm ? "text" : "password"} value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password" autoComplete="new-password"
          addon={
            <span onClick={() => setShowConfirm((v) => !v)}
              style={{ cursor: "pointer", fontSize: "1rem", color: "#a0aec0", userSelect: "none" }}>
              {showConfirm ? "🙈" : "👁"}
            </span>
          }
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="spinner" />}
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

// ── Step 5: Success ───────────────────────────────────────────────────────────
function SuccessStep({ onLogin }) {
  return (
    <div className="step-anim" style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
      <h2 style={{ ...S.cardTitle, marginBottom: 8 }}>Password Reset!</h2>
      <p style={{ ...S.cardSub, marginBottom: 28 }}>
        Your password has been reset successfully. You can now sign in with your new password.
      </p>
      <button className="btn-primary" onClick={onLogin}>Back to Sign In</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [step, setStep] = useState("login");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [entered, setEntered] = useState(false);
  const cardRef = useMouseGlow();

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LOGIN_CSS }} />
      <div style={S.root}>
        <FloatingOrbs />
        <div style={{
          ...S.container,
          opacity: entered ? 1 : 0,
          transform: entered ? "none" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}>
          <div style={{
            ...S.logoWrap,
            animation: entered ? "logoPop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both" : "none",
            opacity: entered ? undefined : 0,
          }}>
            <LogoHero />
          </div>

          <div ref={cardRef} className="login-card" style={S.card}>
            <div style={{ position: "relative", zIndex: 1 }}>
              {step === "login" && (
                <LoginStep onForgotPassword={() => setStep("forgot-email")} />
              )}
              {step === "forgot-email" && (
                <ForgotEmailStep
                  onOtpSent={(email) => { setOwnerEmail(email); setStep("otp"); }}
                  onBack={() => setStep("login")}
                />
              )}
              {step === "otp" && (
                <OtpStep
                  ownerEmail={ownerEmail}
                  onVerified={(token) => { setResetToken(token); setStep("new-password"); }}
                  onBack={() => setStep("forgot-email")}
                />
              )}
              {step === "new-password" && (
                <NewPasswordStep
                  resetToken={resetToken}
                  onDone={() => setStep("success")}
                />
              )}
              {step === "success" && (
                <SuccessStep onLogin={() => setStep("login")} />
              )}
            </div>
          </div>

          <p style={S.footer}>
            © {new Date().getFullYear()} SkyUp Digital Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

const S = {
  root: { fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #0028a0 0%, #0037CA 45%, #1a4fd8 100%)", position: "relative", overflow: "hidden", padding: "32px 16px" },
  orbsWrap: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 },
  orb: { position: "absolute", borderRadius: "50%", filter: "blur(70px)" },
  orb1: { width: 520, height: 520, background: "rgba(255,255,255,0.05)", top: "-180px", right: "-100px", animation: "floatA 12s ease-in-out infinite" },
  orb2: { width: 380, height: 380, background: "rgba(201,168,76,0.1)", bottom: "-120px", left: "-80px", animation: "floatB 15s ease-in-out infinite" },
  orb3: { width: 240, height: 240, background: "rgba(255,255,255,0.04)", top: "40%", left: "15%", animation: "floatC 9s ease-in-out infinite" },
  container: { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 },
  logoWrap: { textAlign: "center", marginBottom: 28 },
  logoHero: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  logoRing: { position: "relative", width: 72, height: 72, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 0 rgba(201,168,76,0.45), 0 8px 40px rgba(0,0,0,0.25)", animation: "pulse 3s ease-in-out infinite" },
  logoGlow: { position: "absolute", inset: -6, borderRadius: "50%", background: "rgba(201,168,76,0.18)", filter: "blur(10px)", zIndex: 0 },
  logoImg: { width: 48, height: 48, objectFit: "contain", borderRadius: "50%", position: "relative", zIndex: 1 },
  logoText: { textAlign: "center" },
  brandTitle: { color: "#fff", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.2 },
  brandSub: { color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", marginTop: 4, letterSpacing: "0.3px" },
  card: { width: "100%", background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: "36px 36px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.08) inset", backdropFilter: "blur(12px)" },
  cardHeader: { marginBottom: 24 },
  cardTitle: { fontSize: "1.65rem", fontWeight: 800, color: "#0d1a3a", letterSpacing: "-0.4px", lineHeight: 1.2 },
  cardSub: { marginTop: 6, fontSize: "0.86rem", color: "#8a95a8" },
  alertBox: { display: "flex", alignItems: "center", gap: 8, borderWidth: "1px", borderStyle: "solid", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: "0.83rem" },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: "0.77rem", fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: "0.2px" },
  inputWrap: { display: "flex", alignItems: "center", borderWidth: "1.5px", borderStyle: "solid", borderRadius: 12, overflow: "hidden", background: "#f9fafb", transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s" },
  input: { flex: 1, height: 48, border: "none", outline: "none", padding: "0 14px", fontSize: "0.9rem", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0d1a3a", background: "transparent" },
  inputAddon: { paddingRight: 14, display: "flex", alignItems: "center", flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "#8a95a8", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", padding: "0 0 16px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block" },
  footer: { marginTop: 24, textAlign: "center", fontSize: "0.74rem", color: "rgba(255,255,255,0.4)" },
};
