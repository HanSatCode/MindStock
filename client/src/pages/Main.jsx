import { useNavigate } from 'react-router-dom'
import useWebSocket from '../hooks/useWebSocket'

export default function Main() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name')
  const token = localStorage.getItem('token')
  const { stocks, fearGreed, marketStatus, news } = useWebSocket()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    navigate('/login')
  }

  const getFearGreedLabel = (index) => {
    if (index >= 80) return { label: '극단적 탐욕 🔥', color: '#ff4444' }
    if (index >= 60) return { label: '탐욕 📈', color: '#ff8c00' }
    if (index >= 40) return { label: '중립 😐', color: '#888' }
    if (index >= 20) return { label: '공포 📉', color: '#4f9eff' }
    return { label: '극단적 공포 ❄️', color: '#00bfff' }
  }

  const fg = getFearGreedLabel(fearGreed)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>MindStock</h1>
        <div style={styles.nav}>
          <span style={styles.navItem} onClick={() => navigate('/portfolio')}>포트폴리오</span>
          <span style={styles.navItem} onClick={() => navigate('/news')}>뉴스</span>
          <span style={styles.navItem} onClick={() => navigate('/ranking')}>랭킹</span>
          <span style={styles.navItem} onClick={() => navigate('/tendency')}>투자 성향</span>
          <span style={styles.navItem} onClick={handleLogout}>로그아웃</span>
        </div>
      </div>

      <div style={styles.statusBar}>
        <span style={{
          ...styles.marketStatus,
          backgroundColor: marketStatus === 'open' ? '#00c853' : '#ff4444'
        }}>
          {marketStatus === 'open' ? '장 운영중' : '장 마감'}
        </span>
        <span style={{ color: fg.color, fontWeight: 'bold' }}>
          공포탐욕지수: {fearGreed} — {fg.label}
        </span>
        <span style={styles.userName}>👤 {name}</span>
      </div>

      {news && (
        <div style={styles.newsAlert}>
          📰 {news.title} — {news.description}
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>종목</th>
              <th style={styles.th}>섹터</th>
              <th style={styles.th}>현재가</th>
              <th style={styles.th}>등락률</th>
              <th style={styles.th}>거래</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.ticker} style={styles.tableRow}>
                <td style={styles.td}>
                  <div style={styles.stockName}>{stock.name}</div>
                  <div style={styles.stockTicker}>{stock.ticker}</div>
                </td>
                <td style={styles.td}>{stock.sector}</td>
                <td style={styles.td}>{stock.current_price?.toLocaleString()}원</td>
                <td style={{
                  ...styles.td,
                  color: stock.change_rate > 0 ? '#ff4444' : stock.change_rate < 0 ? '#4f9eff' : '#888'
                }}>
                  {stock.change_rate > 0 ? '+' : ''}{stock.change_rate}%
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.buyBtn}
                    onClick={() => navigate(`/stock/${stock.ticker}`)}
                  >
                    거래
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  container: { backgroundColor: '#0f1117', minHeight: '100vh', color: '#fff' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', backgroundColor: '#1a1d27', borderBottom: '1px solid #2d3148',
  },
  logo: { color: '#4f9eff', fontSize: '22px', margin: 0 },
  nav: { display: 'flex', gap: '24px' },
  navItem: { color: '#ccc', cursor: 'pointer', fontSize: '14px' },
  statusBar: {
    display: 'flex', alignItems: 'center', gap: '24px',
    padding: '12px 32px', backgroundColor: '#13151f', borderBottom: '1px solid #2d3148',
  },
  marketStatus: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', color: '#fff' },
  userName: { marginLeft: 'auto', color: '#888', fontSize: '13px' },
  newsAlert: {
    backgroundColor: '#1e2235', padding: '10px 32px',
    color: '#ffd700', fontSize: '13px', borderBottom: '1px solid #2d3148',
  },
  tableContainer: { padding: '24px 32px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { backgroundColor: '#1a1d27' },
  th: {
    padding: '12px 16px', textAlign: 'left', color: '#888',
    fontSize: '13px', fontWeight: 'normal', borderBottom: '1px solid #2d3148',
  },
  tableRow: { borderBottom: '1px solid #1e2235' },
  td: { padding: '14px 16px', fontSize: '14px' },
  stockName: { fontWeight: 'bold', marginBottom: '2px' },
  stockTicker: { color: '#888', fontSize: '12px' },
  buyBtn: {
    padding: '6px 16px', borderRadius: '6px', border: 'none',
    backgroundColor: '#4f9eff', color: '#fff', cursor: 'pointer', fontSize: '13px',
  },
}
