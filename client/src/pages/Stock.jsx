import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { buyStock, sellStock } from '../api'
import useWebSocket from '../hooks/useWebSocket'
import api from '../api/axios'

export default function Stock() {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { stocks } = useWebSocket()
  const [quantity, setQuantity] = useState(1)
  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')

  const stock = stocks.find((s) => s.ticker === ticker)

  useEffect(() => {
    api.get(`/stocks/${ticker}/history`)
      .then((res) => setHistory(res.data.map((h, i) => ({
        index: i + 1,
        price: h.price
      }))))
      .catch(console.error)
  }, [ticker])

  const handleBuy = async () => {
    try {
      const res = await buyStock(token, ticker, quantity)
      setMessage(`✅ ${res.data.message} (${res.data.buy_price?.toLocaleString()}원 × ${quantity}주)`)
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || '오류 발생'}`)
    }
  }

  const handleSell = async () => {
    try {
      const res = await sellStock(token, ticker, quantity)
      setMessage(`✅ ${res.data.message} (${res.data.sell_price?.toLocaleString()}원 × ${quantity}주)`)
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || '오류 발생'}`)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/main')}>← 뒤로</button>
        <h2 style={styles.title}>{stock?.name ?? ticker} ({ticker})</h2>
      </div>

      {/* 현재가 */}
      <div style={styles.priceBox}>
        <span style={styles.price}>{stock?.current_price?.toLocaleString()}원</span>
        <span style={{
          ...styles.changeRate,
          color: stock?.change_rate > 0 ? '#ff4444' : stock?.change_rate < 0 ? '#4f9eff' : '#888'
        }}>
          {stock?.change_rate > 0 ? '+' : ''}{stock?.change_rate}%
        </span>
      </div>

      {/* 차트 */}
      <div style={styles.chartBox}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history}>
            <XAxis dataKey="index" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4f9eff"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 매수/매도 */}
      <div style={styles.tradeBox}>
        <div style={styles.quantityRow}>
          <button style={styles.qBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span style={styles.quantity}>{quantity}주</span>
          <button style={styles.qBtn} onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.buyBtn} onClick={handleBuy}>매수</button>
          <button style={styles.sellBtn} onClick={handleSell}>매도</button>
        </div>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#0f1117',
    minHeight: '100vh',
    color: '#fff',
    padding: '24px 32px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  backBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #2d3148',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    fontSize: '20px',
  },
  priceBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '24px',
  },
  price: {
    fontSize: '32px',
    fontWeight: 'bold',
  },
  changeRate: {
    fontSize: '18px',
  },
  chartBox: {
    backgroundColor: '#1a1d27',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  tradeBox: {
    backgroundColor: '#1a1d27',
    borderRadius: '12px',
    padding: '24px',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  qBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #2d3148',
    backgroundColor: '#0f1117',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
  },
  quantity: {
    fontSize: '20px',
    minWidth: '60px',
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
  },
  buyBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ff4444',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  sellBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4f9eff',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  message: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '14px',
    color: '#ffd700',
  },
}
