import { useState, useEffect } from "react";
import api from "../api/axios";
import DisconnectedModal from "../components/DisconnectedModal";

const getTypeGradient = (type) => {
  if (!type || type.length !== 4) return "linear-gradient(135deg, #667EEA, #764BA2)";
  const COMBO_GRADIENTS = {
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
  return COMBO_GRADIENTS[type] || "linear-gradient(135deg, #667EEA, #764BA2)";
};

const TYPE_INFO = {
  "ALFP": { name: "전략가형",   desc: "공격적이지만 분산해서 장기 투자" },
  "ALFL": { name: "모험가형",   desc: "직감으로 공격적 장기 분산 투자" },
  "ALDP": { name: "사자형",     desc: "분석 후 확신 종목에 공격적 장기 집중" },
  "ALDL": { name: "불도저형",   desc: "직감으로 공격적 장기 집중 투자" },
  "ASFP": { name: "헌터형",     desc: "데이터 기반 공격적 단기 분산 매매" },
  "ASFL": { name: "돌격대형",   desc: "직감으로 공격적 단기 분산 매매" },
  "ASDP": { name: "스나이퍼형", desc: "분석 후 공격적 단기 집중 매매" },
  "ASDL": { name: "올인형",     desc: "직감으로 단기 집중 올인 승부" },
  "CLFP": { name: "거북이형",   desc: "느리지만 확실하게 장기 분산 투자" },
  "CLFL": { name: "조약돌형",   desc: "흔들리지 않고 장기 집중 투자" },
  "CLDP": { name: "금고형",     desc: "안전하게 모아두는 장기 집중 투자" },
  "CLDL": { name: "수도승형",   desc: "묵묵히 분산해서 장기 보유" },
  "CSFP": { name: "저울형",     desc: "재고 또 재고, 단기 분산 매매" },
  "CSFL": { name: "관망형",     desc: "시장 눈치 보며 단기 분산 매매" },
  "CSDP": { name: "소방관형",   desc: "위기에 침착하게 단기 집중 매매" },
  "CSDL": { name: "도박사형",   desc: "안전하게 베팅하는 단기 집중형" },
};

const TYPE_DESC = {
  0: { A: "공격형", C: "보수형", label: "리스크 성향" },
  1: { S: "단기형", L: "장기형", label: "투자 기간" },
  2: { F: "집중형", D: "분산형", label: "종목 집중도" },
  3: { L: "손실형", P: "수익형", label: "수익성" },
};

function Tendency() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get("/tendency/");
        setData(res.data);
      } catch (e) {
        setDisconnected(true);
      }
      setLoading(false);
    };
    fetchAnalysis();
  }, []);

  if (loading) return <div style={styles.center}>분석 중...</div>;

  if (disconnected || !data) return (
    <div style={styles.container}>
      <DisconnectedModal show={disconnected} />
    </div>
  );

  if (!data.investment_type) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📊</div>
          <div style={styles.emptyTitle}>아직 분석할 데이터가 부족해요</div>
          <div style={styles.emptyDesc}>{data.message}</div>
          <div style={styles.emptyHint}>거래소에서 매수/매도를 해보세요!</div>
        </div>
      </div>
    );
  }

  const { investment_type, trade_count, scores, stats } = data;
  const axes = investment_type.split("");
  const typeName = axes
    .map((axis, i) => TYPE_DESC[i]?.[axis] ?? null)
    .filter(Boolean)
    .join(" · ") || "분석 중";

  const getStatLabel = (i) => {
    const scoreKeys = ["risk", "duration", "concentration", "profitability"];
    const value = scores?.[scoreKeys[i]] ?? 0.5;
    if (i === 1) return `${stats?.avg_duration_min ?? 0}분`;
    if (i === 2) return stats?.stock_count === 0 ? "보유 종목 없음" : `${stats?.stock_count ?? 0}개 종목`;
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div style={styles.container}>
      <DisconnectedModal show={disconnected} />
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .type-card-animated {
          background-size: 200% 200% !important;
          animation: gradientShift 6s ease infinite;
        }
      `}</style>

      <div
        className="type-card-animated"
        style={{ ...styles.typeCard, background: getTypeGradient(investment_type) }}
      >
        <div style={styles.typeBadge}>{investment_type}</div>
        <div style={styles.typeName}>{TYPE_INFO[investment_type]?.name ?? typeName}</div>
        <div style={styles.typeDesc}>{TYPE_INFO[investment_type]?.desc ?? ""}</div>
        <div style={styles.tradeCount}>총 {trade_count}회 거래 분석</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>투자 성향 분석</div>
        <div style={styles.scoresCard}>
          {axes.map((axis, i) => {
            const scoreKeys = ["risk", "duration", "concentration", "profitability"];
            const value = scores?.[scoreKeys[i]] ?? 0.5;
            return (
              <div key={i} style={styles.scoreItem}>
                <div style={styles.scoreHeader}>
                  <span style={styles.scoreDesc}>{TYPE_DESC[i].label}</span>
                  <span style={styles.scoreType}>
                    {TYPE_DESC[i][axis] ?? "중립형"}
                  </span>
                </div>
                <div style={styles.barBg}>
                  {!(i === 2 && stats?.stock_count === 0) && (
                    <div style={{
                      ...styles.barFill,
                      width: `${value * 100}%`,
                      background: getTypeGradient(investment_type),
                    }} />
                  )}
                </div>
                <div style={styles.statLabel}>{getStatLabel(i)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: "80px" }} />
    </div>
  );
}

const styles = {
  container: { padding: "1.5rem", maxWidth: "800px", margin: "0 auto" },
  center: { textAlign: "center", marginTop: "3rem", color: "#aaa" },
  emptyCard: {
    background: "white", borderRadius: "16px",
    padding: "3rem", textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  emptyIcon: { fontSize: "3rem", marginBottom: "1rem" },
  emptyTitle: { fontSize: "1.2rem", fontWeight: "600", color: "#333", marginBottom: "0.5rem" },
  emptyDesc: { color: "#888", fontSize: "0.9rem", marginBottom: "0.5rem" },
  emptyHint: { color: "#1a73e8", fontSize: "0.9rem", marginTop: "1rem" },
  typeCard: {
    borderRadius: "16px", padding: "2rem",
    textAlign: "center", color: "white",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  },
  typeBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "8px", padding: "0.3rem 1rem",
    fontSize: "0.85rem", marginBottom: "0.75rem",
    letterSpacing: "0.1em",
  },
  typeName: { fontSize: "2.75rem", fontWeight: "700", marginBottom: "0.5rem", fontFamily: "PyeongchangPeace" },
  typeDesc: { fontSize: "0.85rem", opacity: 0.85, marginBottom: "1rem" },
  tradeCount: { fontSize: "0.85rem", opacity: 0.7 },
  section: { marginBottom: "1.5rem" },
  sectionTitle: { fontWeight: "600", fontSize: "1rem", marginBottom: "0.75rem", color: "#333" },
  scoresCard: {
    background: "white", borderRadius: "12px",
    padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", gap: "1.25rem",
  },
  scoreItem: {},
  scoreHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" },
  scoreDesc: { fontSize: "0.85rem", color: "#666" },
  scoreType: { fontSize: "0.85rem", fontWeight: "600", color: "#1a73e8" },
  barBg: { background: "#f0f0f0", borderRadius: "4px", height: "12px" },
  barFill: { borderRadius: "4px", height: "12px", transition: "width 0.5s" },
  statLabel: { fontSize: "0.75rem", color: "#aaa", marginTop: "0.3rem", textAlign: "right" },
};

export default Tendency