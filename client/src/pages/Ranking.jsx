import { useState, useEffect } from "react";
import api from "../api/axios";
import DisconnectedModal from "../components/DisconnectedModal";

const TYPE_GRADIENTS = {
  // 공격형 장기
  "ALFP": "linear-gradient(135deg, #F093FB, #F5576C)",  // 전략가형 - 핑크/레드
  "ALFL": "linear-gradient(135deg, #FD7043, #FF8A65)",  // 모험가형 - 주황
  "ALDP": "linear-gradient(135deg, #43E97B, #38F9D7)",  // 사자형 - 그린
  "ALDL": "linear-gradient(135deg, #F6D365, #FDA085)",  // 불도저형 - 옐로우
  // 공격형 단기
  "ASFP": "linear-gradient(135deg, #4FACFE, #00F2FE)",  // 스나이퍼형 - 블루
  "ASFL": "linear-gradient(135deg, #A1C4FD, #C2E9FB)",  // 올인형 - 라이트블루
  "ASDP": "linear-gradient(135deg, #A18CD1, #FBC2EB)",  // 헌터형 - 퍼플
  "ASDL": "linear-gradient(135deg, #FCCB90, #D57EEB)",  // 돌격대형 - 핑크퍼플
  // 보수형 장기
  "CLFP": "linear-gradient(135deg, #89F7FE, #66A6FF)",  // 거북이형 - 스카이블루
  "CLFL": "linear-gradient(135deg, #FDDB92, #D1FDFF)",  // 조약돌형 - 크림
  "CLDP": "linear-gradient(135deg, #D4FC79, #96E6A1)",  // 금고형 - 라이트그린
  "CLDL": "linear-gradient(135deg, #A8EDEA, #FED6E3)",  // 수도승형 - 민트
  // 보수형 단기
  "CSFP": "linear-gradient(135deg, #E0C3FC, #8EC5FC)",  // 저울형 - 라벤더
  "CSFL": "linear-gradient(135deg, #96FBC4, #F9F586)",  // 소방관형 - 그린옐로우
  "CSDP": "linear-gradient(135deg, #F5F7FA, #C3CFE2)",  // 관망형 - 그레이
  "CSDL": "linear-gradient(135deg, #F6D365, #FDA085)",  // 도박사형 - 골드
};

function RankNumber({ rank }) {
  const colors = { 1: "#F5A623", 2: "#9B9B9B", 3: "#C87941" };
  return (
    <div style={{
      fontSize: rank <= 3 ? "1.8rem" : "1.3rem",
      fontFamily: "PyeongchangPeace",
      fontWeight: "800",
      color: colors[rank] ?? "#ccc",
      minWidth: "2rem",
      textAlign: "center",
      lineHeight: 1,
    }}>
      {rank}
    </div>
  );
}

function TypeBadge({ type }) {
  if (!type) return null;
  return (
    <div
      className="type-badge-animated"
      style={{
        background: TYPE_GRADIENTS[type] ?? "linear-gradient(135deg, #aaa, #ccc)",
        borderRadius: "6px",
        padding: "3px 8px",
        fontSize: "0.75rem",
        fontWeight: "700",
        color: "white",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {type === "NNNN" ? "미분석" : type}
    </div>
  );
}

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [myName, setMyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankRes, meRes] = await Promise.all([
          api.get("/ranking/"),
          api.get("/auth/me"),
        ]);
        setRanking(rankRes.data);
        setMyName(meRes.data.name);
      } catch (e) {
        setDisconnected(true);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
  <div>
    <DisconnectedModal show={disconnected} />
    <div style={{ textAlign: "center", marginTop: "3rem", color: "#aaa" }}>랭킹 불러오는 중...</div>
  </div>
  );
  if (ranking.length === 0) return (
  <div>
    <DisconnectedModal show={disconnected} />
    <div style={{ textAlign: "center", marginTop: "3rem", color: "#aaa" }}>랭킹 데이터가 없습니다.</div>
  </div>
  );

  const myEntry = ranking.find(r => r.name === myName);

  const RankCard = ({ r, fixed = false }) => {
    const isMe = r.name === myName;
    return (
      <div style={{
        ...(fixed ? styles.myRankFixed : { ...styles.card, background: isMe ? "#EFF6FF" : "white", border: isMe ? "2px solid #1a73e8" : "2px solid transparent" }),
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <RankNumber rank={r.rank} />
        <div style={styles.content}>
          <div style={styles.topRow}>
            <div style={styles.nameRow}>
              <TypeBadge type={r.investment_type} />
              <span style={styles.name}>
                {r.name}
                {isMe && <span style={styles.meTag}> · 나</span>}
              </span>
            </div>
            <span style={styles.totalAsset}>{r.total_asset.toLocaleString()}원</span>
          </div>
          <div style={styles.bottomRow}>
            <span style={{ color: r.profit_rate >= 0 ? "#1D9E75" : "#e53935", fontSize: "0.8rem", fontWeight: "600" }}>
              수익 {r.profit_rate >= 0 ? "+" : ""}{r.profit_rate}%
            </span>
            <span style={styles.subInfo}>거래 {r.trade_count ?? 0}회</span>
            <span style={styles.subInfo}>승률 {r.win_rate ?? 0}%</span>
            {r.top_stocks?.length > 0 && (
              <span style={{ ...styles.subInfo, marginLeft: "auto" }}>
                {r.top_stocks.slice(0, 2).map((s, i) => (
                  <span key={i} style={styles.stockTag}>{s}</span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <DisconnectedModal show={disconnected} />
      <style>{`
        @keyframes badgeShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .type-badge-animated {
          background-size: 400% 400% !important;
          animation: badgeShift 5s ease infinite;
        }
      `}</style>

      {ranking.map((r) => <RankCard key={r.name} r={r} />)}
      {myEntry && <RankCard r={myEntry} fixed />}
      <div style={{ height: "140px" }} />
    </div>
  );
}

const styles = {
  container: { padding: "1rem", maxWidth: "600px", margin: "0 auto", background: "#f5f7fa", minHeight: "100vh" },
  card: {
    borderRadius: "14px", padding: "0.9rem 1rem",
    marginBottom: "0.6rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    display: "flex", alignItems: "center", gap: "0.75rem",
  },
  content: { flex: 1, minWidth: 0 },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" },
  nameRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  name: { fontWeight: "700", fontSize: "1rem", color: "#222" },
  meTag: { color: "#1a73e8", fontSize: "0.8rem", fontWeight: "400" },
  totalAsset: { fontWeight: "700", fontSize: "1rem", color: "#222", flexShrink: 0 },
  bottomRow: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  subInfo: { fontSize: "0.78rem", color: "#aaa" },
  stockTag: {
    fontSize: "0.72rem", fontWeight: "600", color: "#1a73e8",
    background: "#EFF6FF", borderRadius: "4px", padding: "1px 5px", marginLeft: "3px",
  },
  myRankFixed: {
    position: "fixed", bottom: "68px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "430px",
    background: "white",
    borderTop: "1px solid #eee",
    padding: "0.9rem 1rem",
  },
};

export default Ranking