import { useEffect, useState, useRef } from 'react'

const WS_URL = `http://${window.location.hostname}:8000/stocks/ws`

export default function useWebSocket() {
  const [stocks, setStocks] = useState([])
  const [fearGreed, setFearGreed] = useState(50)
  const [marketStatus, setMarketStatus] = useState(null)
  const [news, setNews] = useState(null)
  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket(WS_URL)

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'price_update') {
        setStocks(data.data)
        setFearGreed(data.fear_greed)
      } else if (data.type === 'market_open') {
        setMarketStatus('open')
      } else if (data.type === 'market_closed') {
        setMarketStatus('closed')
      } else if (data.type === 'news') {
        setNews(data)
      }
    }

    ws.current.onerror = (e) => console.error('WebSocket 오류:', e)

    return () => {
      ws.current.close()
    }
  }, [])

  return { stocks, fearGreed, marketStatus, news }
}