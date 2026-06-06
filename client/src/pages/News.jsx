import { useState, useEffect } from 'react'
import api from '../api/axios'
import DisconnectedModal from '../components/DisconnectedModal'

export default function News() {
  const [news, setNews] = useState([])
  const [disconnected, setDisconnected] = useState(false)

  useEffect(() => {
    const fetch = () => {
      api.get('/news/')
        .then(res => setNews(res.data.slice(0, 20)))
        .catch(() => setDisconnected(true))
    }
    fetch()
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [])

  const outlookColor = (outlook) =>
    outlook === 'positive' ? '#1D9E75' : outlook === 'negative' ? '#e53935' : '#f5a623'

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const recent = news.slice(0, 3)
  const older = news.slice(3)

  return (
    <div style={styles.container}>
      <DisconnectedModal show={disconnected} />

      {recent.map((n, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.cardTop}>
            <div style={{ ...styles.dot, background: outlookColor(n.outlook) }} />
            <div style={styles.title}>
              {n.title}
              {n.is_real === false && <span> 🎣</span>}
            </div>
          </div>
          <div style={styles.description}>{n.description}</div>
          <div style={styles.timestamp}>{formatTime(n.timestamp)}</div>
        </div>
      ))}

      {older.length > 0 && (
        <>
          <div style={styles.divider}>
            <span style={styles.dividerText}>지난 뉴스</span>
          </div>
          {older.map((n, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.dot, background: outlookColor(n.outlook) }} />
                <div style={styles.title}>
                  {n.title}
                  {n.is_real === false && <span> 🎣</span>}
                </div>
              </div>
              <div style={styles.description}>{n.description}</div>
              <div style={styles.timestamp}>{formatTime(n.timestamp)}</div>
            </div>
          ))}
        </>
      )}

      {news.length === 0 && (
        <div style={styles.empty}>아직 뉴스가 없어요</div>
      )}

      <div style={{ height: "80px" }} />
    </div>
  )
}

const styles = {
  container: { padding: "1rem", maxWidth: "600px", margin: "0 auto", background: "#f5f5f5", minHeight: "100vh" },
  card: {
    background: "white", borderRadius: "12px",
    padding: "1rem", marginBottom: "0.75rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  cardTop: { display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.5rem" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  title: { fontWeight: "700", fontSize: "0.95rem", color: "#222", lineHeight: 1.4 },
  description: { fontSize: "0.85rem", color: "#666", lineHeight: 1.6, paddingLeft: "1.4rem" },
  timestamp: { fontSize: "0.75rem", color: "#bbb", paddingLeft: "1.4rem", marginTop: "0.4rem" },
  divider: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" },
  dividerText: { fontSize: "0.8rem", color: "#aaa", whiteSpace: "nowrap" },
  empty: { textAlign: "center", color: "#aaa", marginTop: "3rem" },
}