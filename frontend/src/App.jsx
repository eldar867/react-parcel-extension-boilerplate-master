import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = ''

function App() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('json')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConvert = async () => {
    if (!url) {
      setError('Введите URL сайта')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await axios.post(API_URL, {
        url: url,
        format: format
      })

      if (format === 'json') {
        setResult(JSON.stringify(response.data, null, 2))
      } else {
        setResult(response.data)
      }
    } catch (err) {
      setError('Ошибка: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>🌐 Конвертер сайтов</h1>
      <p className="description">
        Введите URL любого сайта и получите данные в JSON, CSV или XML формате
      </p>

      <div className="form">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input"
        />

        <select 
          value={format} 
          onChange={(e) => setFormat(e.target.value)}
          className="select"
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xml">XML</option>
        </select>

        <button 
          onClick={handleConvert} 
          disabled={loading}
          className="button"
        >
          {loading ? 'Конвертирую...' : 'Конвертировать'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h3>Результат:</h3>
          <pre>{result}</pre>
          <button 
            onClick={() => navigator.clipboard.writeText(result)}
            className="copy-button"
          >
            Копировать
          </button>
        </div>
      )}
    </div>
  )
}

export default App