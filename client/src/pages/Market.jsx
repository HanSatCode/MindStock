import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import DisconnectedModal from "../components/DisconnectedModal";

function Sparkline({ data, color, width = 60, height = 28 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Market() {
  const [stocks, setStocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [balance, setBalance] = useState(0);
  const [totalAsset, setTotalAsset] = useState(0);
  const [messages, setMessages] = useState({});
  const [shaking, setShaking] = useState({});
  const [flashes, setFlashes] = useState({});
  const [fearGreed, setFearGreed] = useState(50);
  const [portfolio, setPortfolio] = useState({});
  const [newsFlash, setNewsFlash] = useState({});
  const [disconnected, setDisconnected] = useState(false);
  const [histories, setHistories] = useState({});
  const prevPrices = useRef({});
  const stocksRef = useRef([]);
  const wsRef = useRef(null);
  const connectedRef = useRef(false);
  const timeoutRef = useRef(null);

  const getFearGreedLabel = (index) => {
    if (index >= 80) return "극단적 탐욕 🔥";
    if (index >= 60) return "탐욕 📈";
    if (index >= 40) return "중립 😐";
    if (index >= 20) return "공포 📉";
    return "극단적 공포 ❄️";
  };

  const fetchUserData = async () => {
    try {
      const [meRes, portRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/trade/portfolio"),
      ]);
      setBalance(meRes.data.balance);
      setTotalAsset(portRes.data.total_asset);
      const portMap = {};
      portRes.data.portfolio.forEach(p => { portMap[p.ticker] = p; });
      setPortfolio(portMap);
    } catch (e) {}
  };

  const fetchHistories = async (tickers) => {
    const results = await Promise.all(
      tickers.map(ticker =>
        api.get(`/stocks/${ticker}/history?limit=30`)
          .then(res => ({ ticker, data: res.data }))
          .catch(() => ({ ticker, data: [] }))
      )
    );
    const map = {};
    results.forEach(({ ticker, data }) => { map[ticker] = data; });
    setHistories(map);
  };

  const showMessage = (ticker, text, isError = false) => {
    setMessages(prev => ({ ...prev, [ticker]: { text, type: isError ? "error" : "success" } }));
    if (isError) {
      setShaking(prev => ({ ...prev, [ticker]: false }));
      setTimeout(() => setShaking(prev => ({ ...prev, [ticker]: true })), 10);
      setTimeout(() => setShaking(prev => ({ ...prev, [ticker]: false })), 510);
    }
    setTimeout(() => {
      setMessages(prev => { const n = { ...prev }; delete n[ticker]; return n; });
    }, 3000);
  };

  useEffect(() => {
    fetchUserData();

    const host = window.location.hostname;
    const wsUrl = import.meta.env.VITE_API_URL
      ? `wss://${import.meta.env.VITE_API_URL.replace("https://", "")}/stocks/ws`
      : `ws://${window.location.hostname}:8000/stocks/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    timeoutRef.current = setTimeout(() => {
      if (!connectedRef.current) setDisconnected(true);
    }, 10000);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const newFlashes = {};

      if (data.type === "price_update") {
        if (data.fear_greed !== undefined) {
          const noise = (Math.random() - 0.5) * 4; // ±2 범위
          const noisy = Math.min(100, Math.max(0, Math.round(data.fear_greed + noise)));
          setFearGreed(noisy);
        }
        const updatedList = stocksRef.current.length > 0
          ? stocksRef.current.map((s) => {
              const updated = data.data.find((u) => u.ticker === s.ticker);
              if (!updated) return s;
              if (prevPrices.current[s.ticker] !== updated.current_price) {
                newFlashes[s.ticker] = updated.current_price > prevPrices.current[s.ticker] ? "up" : "down";
                prevPrices.current[s.ticker] = updated.current_price;
                setHistories(prev => {
                  const existing = prev[s.ticker] ?? [];
                  const next = [...existing, { price: updated.current_price }].slice(-30);
                  return { ...prev, [s.ticker]: next };
                });
              }
              return { ...s, ...updated };
            })
          : data.data;

        stocksRef.current = updatedList;
        setStocks(updatedList);

        if (Object.keys(newFlashes).length > 0) {
          setFlashes(newFlashes);
          setTimeout(() => setFlashes({}), 600);
        }

      } else if (data.type === "news") {
        const affectedTickers = data.tickers ?? [data.ticker];
        affectedTickers.forEach(ticker => {
          setNewsFlash(prev => ({ ...prev, [ticker]: data.outlook }));
          setTimeout(() => {
            setNewsFlash(prev => { const n = { ...prev }; delete n[ticker]; return n; });
          }, 5 * 60 * 1000);
        });

      } else if (data.type === "news_reveal") {
        fetchUserData();
      }
    };

    ws.onopen = () => {
      connectedRef.current = true;
      clearTimeout(timeoutRef.current);
      setDisconnected(false);
      api.get("/stocks/").then(res => {
        stocksRef.current = res.data;
        setStocks(res.data);
        res.data.forEach(s => { prevPrices.current[s.ticker] = s.current_price; });
        fetchHistories(res.data.map(s => s.ticker));
      });
    };

    ws.onerror = () => setDisconnected(true);
    ws.onclose = () => { if (connectedRef.current) setDisconnected(true); };

    return () => {
      clearTimeout(timeoutRef.current);
      ws.close();
    };
  }, []);

  const handleBuy = async () => {
    if (!selected) return;
    try {
      const res = await api.post("/trade/buy", { ticker: selected.ticker, quantity: qty });
      showMessage(selected.ticker, `✅ 매수 완료 - ${res.data.total_cost.toLocaleString()}원`, false);
      fetchUserData();
    } catch (e) {
      const detail = e.response?.data?.detail;
      showMessage(selected.ticker, `❌ ${typeof detail === "string" ? detail : "매수 실패"}`, true);
    }
  };

  const handleSell = async () => {
    if (!selected) return;
    try {
      const res = await api.post("/trade/sell", { ticker: selected.ticker, quantity: qty });
      showMessage(selected.ticker, `✅ 매도 완료 - ${res.data.total_gain.toLocaleString()}원`, false);
      fetchUserData();
    } catch (e) {
      const detail = e.response?.data?.detail;
      showMessage(selected.ticker, `❌ ${typeof detail === "string" ? detail : "매도 실패"}`, true);
    }
  };

  const handleBuyPercent = (pct) => {
    if (!selected) return;
    const stock = stocks.find(s => s.ticker === selected.ticker);
    if (!stock) return;
    const buyPrice = Math.round(stock.current_price * 1.05);
    const affordable = Math.floor((balance * pct) / buyPrice);
    setQty(Math.max(1, affordable));
  };

  const handleSellPercent = (pct) => {
    if (!selected) return;
    const held = portfolio[selected.ticker]?.quantity ?? 0;
    setQty(Math.max(1, Math.floor(held * pct)));
  };

  const getFlashStyle = (ticker) => {
    const flash = flashes[ticker];
    if (flash === "up") return { background: "rgba(29,158,117,0.12)", transition: "background 0.1s" };
    if (flash === "down") return { background: "rgba(229,57,53,0.12)", transition: "background 0.1s" };
    return { background: "white", transition: "background 0.6s" };
  };

  const getNewsCardClass = (outlook) => {
    if (outlook === "positive") return "news-card-positive";
    if (outlook === "negative") return "news-card-negative";
    return "news-card-neutral";
  };

  const getBadgeStyle = (outlook) => {
    if (outlook === "positive") return { background: "rgba(29,158,117,0.1)", color: "#0F6E56" };
    if (outlook === "negative") return { background: "rgba(229,57,53,0.1)", color: "#993C1D" };
    return { background: "rgba(245,166,35,0.1)", color: "#854F0B" };
  };

  const holdingProfit = Object.values(portfolio).reduce((sum, p) => {
    const stock = stocks.find(s => s.ticker === p.ticker);
    if (!stock) return sum;
    return sum + (stock.current_price - p.avg_price) * p.quantity;
  }, 0);

  const investedAmount = Object.values(portfolio).reduce((sum, p) => {
    return sum + p.avg_price * p.quantity;
  }, 0);

  const profitRate = investedAmount > 0
    ? ((holdingProfit / investedAmount) * 100).toFixed(2)
    : "0.00";

  return (
    <div style={styles.container}>
      <style>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spinBorder {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        @keyframes flashUp {
          0% { color: inherit; }
          30% { color: #1D9E75; transform: translateY(-2px); }
          100% { color: inherit; transform: translateY(0); }
        }
        @keyframes flashDown {
          0% { color: inherit; }
          30% { color: #e53935; transform: translateY(2px); }
          100% { color: inherit; transform: translateY(0); }
        }
        .flash-up { animation: flashUp 0.6s ease; }
        .flash-down { animation: flashDown 0.6s ease; }
        @keyframes panelOpen {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .shake { animation: shake 0.5s ease; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .news-card-positive {
          border: 3px solid transparent !important;
          background:
            linear-gradient(white, white) padding-box,
            conic-gradient(from var(--angle), #1D9E75, #a8edcc, #ffffff, #a8edcc, #1D9E75) border-box !important;
          animation: spinBorder 2s linear infinite;
        }
        .news-card-negative {
          border: 3px solid transparent !important;
          background:
            linear-gradient(white, white) padding-box,
            conic-gradient(from var(--angle), #e53935, #ffb3b3, #ffffff, #ffb3b3, #e53935) border-box !important;
          animation: spinBorder 2s linear infinite;
        }
        .news-card-neutral {
          border: 3px solid transparent !important;
          background:
            linear-gradient(white, white) padding-box,
            conic-gradient(from var(--angle), #f5a623, #ffe29a, #ffffff, #ffe29a, #f5a623) border-box !important;
          animation: spinBorder 2s linear infinite;
        }
      `}</style>

      <DisconnectedModal show={disconnected} />

      <div style={styles.assetGrid}>
        {[
          { label: "보유 현금", value: `${balance.toLocaleString()}원` },
          { label: "총 자산", value: `${totalAsset.toLocaleString()}원` },
          { label: "평가손익", value: `${holdingProfit >= 0 ? "+" : ""}${Math.round(holdingProfit).toLocaleString()}원`, color: holdingProfit >= 0 ? "#1D9E75" : "#e53935" },
          { label: "수익률", value: `${holdingProfit >= 0 ? "+" : ""}${profitRate}%`, color: holdingProfit >= 0 ? "#1D9E75" : "#e53935" },
        ].map(item => (
          <div key={item.label} style={styles.assetCard}>
            <div style={styles.assetLabel}>{item.label}</div>
            <div style={{ ...styles.assetValue, color: item.color ?? "#222", textAlign: "right" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.fgBar}>
        <div style={styles.fgLeft}>
          <span style={styles.fgLabel}>공포 탐욕 지수</span>
          <span style={styles.fgText}>{getFearGreedLabel(fearGreed)}</span>
        </div>
        <div style={styles.fgGaugeWrap}>
          <div style={styles.fgGaugeBg}>
            <div style={{
              ...styles.fgGaugeFill,
              width: `${fearGreed}%`,
              background: fearGreed >= 60 ? "#1D9E75" : fearGreed >= 40 ? "#f5a623" : "#e53935"
            }} />
          </div>
          <span style={styles.fgIndex}>{fearGreed}</span>
        </div>
      </div>

      <div>
        {stocks.map((stock) => {
          const rate = stock.change_rate ?? 0;
          const isUp = rate >= 0;
          const isSelected = selected?.ticker === stock.ticker;
          const flash = flashes[stock.ticker];
          const held = portfolio[stock.ticker]?.quantity ?? 0;
          const newsOutlook = newsFlash[stock.ticker];
          const hasNews = !!newsOutlook;
          const msg = messages[stock.ticker];
          const isShaking = shaking[stock.ticker];
          const sparkColor = isUp ? "#1D9E75" : "#e53935";
          const sparkData = histories[stock.ticker] ?? [];

          return (
            <div
              key={stock.ticker}
              onClick={() => { setSelected(isSelected ? null : stock); setQty(1); }}
              className={hasNews && !isSelected ? getNewsCardClass(newsOutlook) : ""}
              style={{
                ...styles.stockCard,
                ...getFlashStyle(stock.ticker),
                ...(isSelected ? { border: "2px solid #1a73e8" } : {}),
              }}
            >
              <div style={styles.stockRow}>
                <div>
                  <div style={styles.stockName}>
                    {stock.name}
                    {newsOutlook && (
                      <span style={{
                        fontSize: "0.72rem", fontWeight: "700",
                        marginLeft: "6px", padding: "1px 6px", borderRadius: "4px",
                        ...getBadgeStyle(newsOutlook),
                      }}>
                        📰 뉴스
                      </span>
                    )}
                  </div>
                  <div style={styles.stockTicker}>
                    {stock.ticker} · {stock.sector}
                    {held > 0 && <span style={styles.heldBadge}> 보유 {held.toLocaleString()}주</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkline data={sparkData} color={sparkColor} />
                  <div style={styles.stockRight}>
                    <div
                      className={flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""}
                      style={styles.stockPrice}
                    >
                      {stock.current_price.toLocaleString()}원
                    </div>
                    <div style={{ color: isUp ? "#1D9E75" : "#e53935", fontSize: "0.85rem", textAlign: "right" }}>
                      {isUp ? "▲" : "▼"} {Math.abs(rate)}%
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                maxHeight: isSelected ? "500px" : "0px",
                opacity: isSelected ? 1 : 0,
                marginTop: isSelected ? "0.75rem" : "0",
                paddingTop: isSelected ? "0.75rem" : "0",
                borderTop: isSelected ? "1px solid #eee" : "none",
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.25s ease, margin 0.3s ease, padding 0.3s ease",
                animation: isSelected ? "panelOpen 0.25s ease-out" : "none",
              }}>
                {msg && (
                  <div
                    className={isShaking ? "shake" : ""}
                    style={{
                      fontSize: "0.85rem", marginBottom: "0.5rem",
                      padding: "0.4rem 0.75rem", borderRadius: "6px",
                      ...(msg.type === "error"
                        ? { background: "#fff0f0", color: "#c0392b" }
                        : { background: "#f0fff8", color: "#0F6E56" }
                      )
                    }}
                  >
                    {msg.text}
                  </div>
                )}

                <div style={styles.tradeRow}>
                  <input
                    type="number" min={1} value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    onClick={(e) => e.stopPropagation()}
                    style={styles.qtyInput}
                  />
                  <span style={styles.totalCost}>
                    = {(stock.current_price * qty).toLocaleString()}원
                  </span>
                </div>

                <div style={{
                  fontSize: "0.75rem", color: "#888", background: "#f9f9f9",
                  borderRadius: "6px", padding: "6px 10px", marginBottom: "8px",
                }}>
                  {(() => {
                    const r = stock.ownership_vat > 0
                      ? (stock.ownership_vat * (1 / 8640) * 720 * 100).toFixed(2)
                      : "0.00";
                    const maxHours = stock.ownership_vat > 0
                      ? (100 / (stock.ownership_vat * (1 / 8640) * 720 * 100)).toFixed(0)
                      : "∞";
                    return `💸 보유세 ${r}%/h · 약 ${maxHours}시간 보유 시 원금 소멸`;
                  })()}
                </div>

                <div style={styles.pctRow}>
                  <span style={styles.pctLabel}>매수</span>
                  {[0.25, 0.5, 0.75, 1.0].map(pct => (
                    <button key={pct} onClick={(e) => { e.stopPropagation(); handleBuyPercent(pct); }} style={styles.pctBtn}>
                      {pct * 100}%
                    </button>
                  ))}
                </div>

                {held > 0 && (
                  <div style={styles.pctRow}>
                    <span style={styles.pctLabel}>매도</span>
                    {[0.25, 0.5, 0.75, 1.0].map(pct => (
                      <button key={pct} onClick={(e) => { e.stopPropagation(); handleSellPercent(pct); }} style={{ ...styles.pctBtn, ...styles.pctBtnSell }}>
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                )}

                <div style={styles.tradeButtons}>
                  <button onClick={(e) => { e.stopPropagation(); handleBuy(); }} style={styles.buyBtn}>매수</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSell(); }}
                    style={{ ...styles.sellBtn, ...(held === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
                    disabled={held === 0}
                  >
                    매도
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: "80px" }} />
    </div>
  );
}

const styles = {
  container: { padding: "1rem", maxWidth: "600px", margin: "0 auto" },
  assetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" },
  assetCard: { background: "white", borderRadius: "10px", padding: "0.7rem 1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  assetLabel: { fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" },
  assetValue: { fontSize: "1rem", fontWeight: "700" },
  fgBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "white", borderRadius: "10px", padding: "0.75rem 1.25rem",
    marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  fgLeft: { display: "flex", flexDirection: "column", gap: "2px" },
  fgLabel: { fontSize: "0.75rem", color: "#999" },
  fgText: { fontSize: "0.9rem", fontWeight: "600", color: "#333" },
  fgGaugeWrap: { display: "flex", alignItems: "center", gap: "0.5rem" },
  fgGaugeBg: { width: "100px", height: "8px", background: "#f0f0f0", borderRadius: "4px" },
  fgGaugeFill: { height: "8px", borderRadius: "4px", transition: "width 0.5s, background 0.5s" },
  fgIndex: { fontSize: "0.85rem", fontWeight: "700", color: "#555", minWidth: "28px" },
  stockCard: {
    borderRadius: "10px", padding: "0.9rem 1rem", marginBottom: "0.6rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer",
    background: "white", border: "2px solid transparent",
  },
  stockRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  stockName: { fontWeight: "600", fontSize: "0.95rem", color: "#222", display: "flex", alignItems: "center" },
  stockTicker: { fontSize: "0.8rem", color: "#999", marginTop: "2px" },
  heldBadge: { color: "#1a73e8", fontWeight: "600" },
  stockRight: { textAlign: "right" },
  stockPrice: { fontWeight: "600", fontSize: "1rem", color: "#222" },
  tradeRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" },
  qtyInput: { width: "80px", padding: "0.5rem 0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" },
  totalCost: { fontSize: "0.9rem", color: "#555" },
  pctRow: { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" },
  pctLabel: { fontSize: "0.75rem", color: "#999", minWidth: "28px" },
  pctBtn: { flex: 1, padding: "0.35rem 0", borderRadius: "6px", fontSize: "0.8rem", border: "1px solid #1D9E75", color: "#1D9E75", background: "transparent", cursor: "pointer" },
  pctBtnSell: { border: "1px solid #e53935", color: "#e53935" },
  tradeButtons: { display: "flex", gap: "0.5rem", marginTop: "0.25rem" },
  buyBtn: { flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", color: "white", background: "#1D9E75", cursor: "pointer", fontWeight: "600", fontSize: "1rem" },
  sellBtn: { flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", color: "white", background: "#e53935", cursor: "pointer", fontWeight: "600", fontSize: "1rem" },
};

export default Market