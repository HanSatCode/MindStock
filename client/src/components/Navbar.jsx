import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("name");

  const isActive = (path) => location.pathname === path;

  const tabs = [
    { path: "/", label: "거래소", icon: "📈" },
    { path: "/news", label: "뉴스", icon: "📰" },
    { path: "/portfolio", label: "포트폴리오", icon: "💼" },
    { path: "/ranking", label: "랭킹", icon: "🏆" },
    { path: "/tendency", label: "투자성향", icon: "🧠" },
  ];

  return (
    <>
      <header style={styles.header}>
        <span style={styles.logo}>
          <span style={{ fontWeight: 700 }}>Mind</span>
          <span style={{ fontWeight: 300 }}>Stock</span>
        </span>
        <div style={styles.headerRight}>
          <span style={styles.name}>{name}</span>
        </div>
      </header>

      <nav style={styles.tabBar}>
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path} style={{
            ...styles.tab,
            ...(isActive(tab.path) ? styles.activeTab : {})
          }}>
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

const styles = {
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 1rem", height: "52px", backgroundColor: "#1a73e8",
    position: "sticky", top: 0, zIndex: 100,
  },
  logo: {
    fontSize: "1.2rem", fontWeight: "700", color: "white",
    fontFamily: "'PyeongchangPeace', sans-serif",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  name: { color: "rgba(255,255,255,0.9)", fontSize: "0.85rem" },
  logoutBtn: {
    padding: "0.35rem 0.75rem", borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.5)",
    backgroundColor: "transparent", color: "white",
    fontSize: "0.8rem", cursor: "pointer",
  },
  tabBar: {
    display: "flex",
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "430px",
    height: "60px",
    backgroundColor: "white",
    borderTop: "1px solid #eee",
    zIndex: 100,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
  },
  tab: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textDecoration: "none", color: "#aaa", gap: "2px",
  },
  activeTab: { color: "#1a73e8" },
  tabIcon: { fontSize: "1.3rem" },
  tabLabel: { fontSize: "0.7rem", fontWeight: "500" },
};

export default Navbar
