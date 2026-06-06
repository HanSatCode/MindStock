function DisconnectedModal({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "white", borderRadius: "16px",
        padding: "2rem 2.5rem", textAlign: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        maxWidth: "320px", width: "90%",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
        <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "#222", marginBottom: "0.5rem" }}>
          연결이 끊겼습니다!
        </div>
        <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: "1.5rem" }}>
          서버와의 연결이 끊어졌어요.<br />페이지를 새로고침 해주세요.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: "10px", border: "none",
            background: "#1a73e8", color: "white", fontWeight: "600", fontSize: "1rem", cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </div>
    </div>
  );
}

export default DisconnectedModal