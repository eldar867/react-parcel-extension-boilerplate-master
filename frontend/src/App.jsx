import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = ''

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showAuth, setShowAuth] = useState(!localStorage.getItem('token'))
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('json')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (token) {
      loadHistory()
    }
  }, [token])

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await axios.post(`${API_BASE}${endpoint}`, { email, password })
      
      if (authMode === 'login') {
        localStorage.setItem('token', response.data.token)
        setToken(response.data.token)
        setUser(response.data.user)
        setShowAuth(false)
      } else {
        alert('Регистрация успешна! Теперь войдите.')
        setAuthMode('login')
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Ошибка авторизации')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setShowAuth(true)
    setHistory([])
  }

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(response.data.conversions)
    } catch (err) {
      console.error('History load error:', err)
    }
  }

  const handleConvert = async () => {
    if (!url) {
      setError('Введите URL сайта')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await axios.post(`${API_BASE}/api/convert`, 
        { url, format },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (format === 'json') {
        setResult(JSON.stringify(response.data, null, 2))
      } else {
        setResult(response.data)
      }
      
      loadHistory()
    } catch (err) {
      setError('Ошибка: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (showAuth) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Конвертер сайтов</h1>
          <h2>{authMode === 'login' ? 'Вход' : 'Регистрация'}</h2>
          
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {authError && <div className="error">{authError}</div>}
            <button type="submit">{authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
          
          <p>
            {authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Конвертер сайтов</h1>
        <div className="user-info">
          <span>{user?.email || email}</span>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </header>

      <div className="main-content">
        <div className="converter-section">
          <div className="form">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
            />
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="select">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
            <button onClick={handleConvert} disabled={loading} className="button">
              {loading ? 'Конвертирую...' : 'Конвертировать'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {result && (
            <div className="result">
              <h3>Результат:</h3>
              <pre>{result}</pre>
              <button onClick={() => navigator.clipboard.writeText(result)} className="copy-button">
                Копировать
              </button>
            </div>
          )}
        </div>

        <div className="history-section">
          <h2>История конвертаций</h2>
          {history.length === 0 ? (
            <p className="empty-history">История пуста</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-url">{item.url}</div>
                  <div className="history-meta">
                    <span className="format-badge">{item.format.toUpperCase()}</span>
                    <span className="date">{new Date(item.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App