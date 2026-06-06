import { useState, useEffect } from "react";
import api from "../api/axios";
import DisconnectedModal from "../components/DisconnectedModal";

function Portfolio() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("portfolio");
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, h] = await Promise.all([
          api.get("/trade/portfolio"),
          api.get("/trade/history"),
        ]);
        setData(p.data);
        setHistory(h.data);
      } catch (e) {
        setDisconnected(true);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div>
      <DisconnectedModal show={disconnected} />
      <div style={styles.center}>불러오는 중...</div>
    </div>
  );
  if (!data) return (
    <div>
      <DisconnectedModal show={disconnected} />
      <div style={styles.center}>데이터 없음</div>
    </div>
  );

  const totalProfit = data.total_asset - 100000;

  return (
    <div style={styles.container}>
      <DisconnectedModal show={disconnected} />

      <div style={styles.summaryGrid}>
        {[
          { label: "보유 현금", value: `${data.balance.toLocaleString()}원` },
          { label: "총 자산", value: `${data.total_asset.toLocaleString()}원` },
          {
            label: "총 손익",
            value: `${totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}원`,
            color: totalProfit >= 0 ? "#1D9E75" : "#e53935",
          },
          {
            label: "수익률",
            value: `${((totalProfit / 100000) * 100).toFixed(2)}%`,
            color: totalProfit >= 0 ? "#1D9E75" : "#e53935",
          },
        ].map((item) => (
          <div key={item.label} style={styles.summaryCard}>
            <div style={styles.summaryLabel}>{item.label}</div>
            <div style={{ ...styles.summaryValue, color: item.color ?? "#222", textAlign: "right" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setTab("portfolio")} style={{ ...styles.tabBtn, ...(tab === "portfolio" ? styles.tabBtnActive : {}) }}>보유 종목</button>
        <button onClick={() => setTab("history")} style={{ ...styles.tabBtn, ...(tab === "history" ? styles.tabBtnActive : {}) }}>거래 내역</button>
      </div>

      {tab === "portfolio" && (
        <div>
          {data.portfolio.length === 0 ? (
            <div style={styles.empty}>보유 중인 종목이 없습니다.</div>
          ) : (
            data.portfolio.map((p) => (
              <div key={p.ticker} style={styles.card}>
                <div style={styles.cardRow}>
                  <div>
                    <div style={styles.stockName}>{p.ticker}</div>
                    <div style={styles.stockDetail}>
                      {p.quantity.toLocaleString()}주 · 평균 {p.avg_price.toLocaleString()}원
                    </div>
                  </div>
                  <div style={styles.cardRight}>
                    <div style={styles.currentPrice}>{p.current_price.toLocaleString()}원</div>
                    <div style={{ color: p.profit >= 0 ? "#1D9E75" : "#e53935", fontSize: "0.85rem" }}>
                      {p.profit >= 0 ? "+" : ""}{p.profit.toLocaleString()}원 ({p.profit_rate}%)
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div style={styles.empty}>거래 내역이 없습니다.</div>
          ) : (
            history.map((t, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.cardRow}>
                  <div>
                    <span style={{
                      color: t.action === "buy" ? "#1D9E75" : "#e53935",
                      fontWeight: "700", fontSize: "0.9rem",
                    }}>
                      {t.action === "buy" ? "매수" : "매도"}
                    </span>
                    <span style={{ color: "#888", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                      {t.ticker} · {t.quantity.toLocaleString()}주 · {t.price.toLocaleString()}원
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      {t.total_cost.toLocaleString()}원
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa" }}>
                      {new Date(t.timestamp).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ height: "80px" }} />
    </div>
  );
}

const styles = {
  container: { padding: "1rem", maxWidth: "600px", margin: "0 auto" },
  center: { textAlign: "center", marginTop: "3rem", color: "#aaa" },
  summaryGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.6rem", marginBottom: "1rem",
  },
  summaryCard: {
    background: "white", borderRadius: "10px",
    padding: "0.75rem 1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  summaryLabel: { fontSize: "0.75rem", color: "#999", marginBottom: "0.3rem" },
  summaryValue: { fontSize: "1rem", fontWeight: "700" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  tabBtn: {
    flex: 1, padding: "0.6rem", borderRadius: "8px",
    border: "1px solid #ddd", background: "white",
    fontSize: "0.9rem", cursor: "pointer", color: "#888", fontWeight: "500",
  },
  tabBtnActive: { background: "#1a73e8", color: "white", border: "1px solid #1a73e8" },
  empty: { color: "#aaa", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" },
  card: {
    background: "white", borderRadius: "10px",
    padding: "0.9rem 1rem", marginBottom: "0.6rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  stockName: { fontWeight: "600", fontSize: "0.95rem", color: "#222" },
  stockDetail: { fontSize: "0.8rem", color: "#999", marginTop: "2px" },
  cardRight: { textAlign: "right" },
  currentPrice: { fontWeight: "600", fontSize: "1rem", color: "#222" },
};

export default Portfolio