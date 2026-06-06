import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
})

export const register = (name, password) =>
  api.post('/auth/register', { name, password })

export const login = (name, password) =>
  api.post('/auth/login', { name, password })

export const getStocks = () =>
  api.get('/stocks')

export const buyStock = (token, ticker, quantity) =>
  api.post(`/trade/buy?token=${token}`, { ticker, quantity })

export const sellStock = (token, ticker, quantity) =>
  api.post(`/trade/sell?token=${token}`, { ticker, quantity })

export const getPortfolio = (token) =>
  api.get(`/trade/portfolio?token=${token}`)

export const getHistory = (token) =>
  api.get(`/trade/history?token=${token}`)

export const getNews = () =>
  api.get('/news')

export const getRanking = () =>
  api.get('/ranking')

export const getTendency = (token) =>
  api.get(`/tendency?token=${token}`)