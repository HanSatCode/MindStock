import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail ?? "로그인 실패");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <span style={{ fontFamily: "'PyeongchangPeace', sans-serif", fontWeight: 700 }}>Mind</span>
          <span style={{ fontFamily: "'Pyeongchang', sans-serif", fontWeight: 'normal' }}>Stock</span>
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          <input
            name="name"
            className={shake ? "shake" : ""}
            placeholder="닉네임"
            value={form.name}
            onChange={handleChange}
            style={{
              ...styles.input,
              borderColor: shake ? "#e53935" : "#ddd",
              transition: "border-color 0.2s ease",
            }}
            required
          />
          <input
            name="password"
            className={shake ? "shake" : ""}
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            style={{
              ...styles.input,
              borderColor: shake ? "#e53935" : "#ddd",
              transition: "border-color 0.2s ease",
            }}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p style={styles.link}>
          계정이 없으신가요?{" "}
          <Link to="/register" style={styles.linkText}>회원가입</Link>
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
    backgroundColor: "#f5f5f5",
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
    color: "#1a73e8",
    margin: "0 0 0.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1a73e8",
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
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

export default Login