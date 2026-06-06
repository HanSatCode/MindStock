import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameStatus, setNameStatus] = useState(null);
  const [nameShake, setNameShake] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({
    length: false,
    alphanumeric: false,
    special: false,
  });
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "name") {
      setNameStatus("checking");
    }
    if (e.target.name === "password") {
      const val = e.target.value;
      const newStatus = {
        length: val.length >= 8,
        alphanumeric: /[a-zA-Z]/.test(val) && /[0-9]/.test(val),
        special: /[!@#$%^&*]/.test(val),
      };
      setPasswordStatus(newStatus);

      // 조건 불만족 시 흔들기
      if (!Object.values(newStatus).every(Boolean)) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    }
  };

  useEffect(() => {
    if (!form.name) {
      setNameStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-name?name=${form.name}`);
        const available = res.data.available;
        setNameStatus(available ? "available" : "taken");

        // 중복이면 흔들기
        if (!available) {
          setNameShake(true);
          setTimeout(() => setNameShake(false), 400);
        }
      } catch {
        setNameStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.name]);

  const isPasswordValid = Object.values(passwordStatus).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nameStatus === "taken" || !isPasswordValid) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail ?? "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg-register" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <span style={{ fontFamily: "'PyeongchangPeace', sans-serif", fontWeight: 700 }}>Mind</span>
          <span style={{ fontFamily: "'Pyeongchang', sans-serif", fontWeight: "normal" }}>Stock</span>
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <input
              name="name"
              className={nameShake ? "shake" : ""}
              placeholder="닉네임"
              value={form.name}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: nameStatus === "available" ? "#4caf50"
                           : nameStatus === "taken" ? "#e53935"
                           : "#ddd"
              }}
              required
            />
            {nameStatus === "checking" && (
              <p style={{ ...styles.hint, color: "#888" }}>사용할 수 있는지 확인 중이에요...</p>
            )}
            {nameStatus === "available" && (
              <p style={{ ...styles.hint, color: "#4caf50" }}>✅ 사용 가능한 닉네임이에요!</p>
            )}
            {nameStatus === "taken" && (
              <p style={{ ...styles.hint, color: "#e53935" }}>❌ 이미 사용 중인 닉네임이에요...</p>
            )}
          </div>

          <div>
            <input
              name="password"
              className={shake ? "shake" : ""}
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: form.password
                  ? isPasswordValid ? "#4caf50" : "#e53935"
                  : "#ddd"
              }}
              required
            />
            {form.password && (
              <div style={styles.passwordRules}>
                <p style={{ ...styles.rule, color: passwordStatus.length ? "#4caf50" : "#e53935" }}>
                  {passwordStatus.length ? "✅" : "❌"} 8자 이상 적어주세요.
                </p>
                <p style={{ ...styles.rule, color: passwordStatus.alphanumeric ? "#4caf50" : "#e53935" }}>
                  {passwordStatus.alphanumeric ? "✅" : "❌"} 영문이랑 숫자를 같이 적어주세요.
                </p>
                <p style={{ ...styles.rule, color: passwordStatus.special ? "#4caf50" : "#e53935" }}>
                  {passwordStatus.special ? "✅" : "❌"} 특수문자도 하나 이상 넣어주세요.
                </p>
              </div>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: nameStatus !== "available" || !isPasswordValid ? 0.5 : 1,
              cursor: nameStatus !== "available" || !isPasswordValid ? "not-allowed" : "pointer"
            }}
            disabled={loading || nameStatus !== "available" || !isPasswordValid}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p style={styles.link}>
          이미 계정이 있으신가요?{" "}
          <Link to="/login" style={styles.linkText}>로그인</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "380px",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    margin: "0 0 0.5rem",
    color: "#1a73e8",
  },
  subtitle: {
    color: "#888",
    marginBottom: "2rem",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
  },
  hint: {
    fontSize: "0.75rem",
    margin: "4px 0 0",
    textAlign: "left",
  },
  passwordRules: {
    textAlign: "left",
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  rule: {
    fontSize: "0.75rem",
    margin: 0,
  },
  button: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1a73e8",
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    marginTop: "0.5rem",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  error: {
    color: "#e53935",
    fontSize: "0.85rem",
    margin: 0,
  },
  link: {
    marginTop: "1.5rem",
    fontSize: "0.9rem",
    color: "#888",
  },
  linkText: {
    color: "#1a73e8",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Register