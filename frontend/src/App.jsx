import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:8000'

function formatDate(date) {
  return new Date(date).toLocaleString('en-GB')
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem('theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const [latest, setLatest] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    let isMounted = true

    async function loadMeasurements() {
      try {
        const [latestResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/measurements/latest`),
          fetch(`${API_URL}/measurements`),
        ])

        if (!latestResponse.ok || !historyResponse.ok) {
          throw new Error('Could not load measurements')
        }

        const latestData = await latestResponse.json()
        const historyData = await historyResponse.json()

        if (isMounted) {
          setLatest(latestData.temperature_c !== undefined ? latestData : null)
          setMeasurements(historyData)
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Cannot connect to the backend')
        }
      }
    }

    loadMeasurements()
    const refreshInterval = setInterval(loadMeasurements, 5000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [])

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">IoT monitoring</p>
          <h1>Technical room</h1>
          <p className="subtitle">Temperature and humidity measurements</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="theme-icon" aria-hidden="true" />
            ) : (
              <Moon className="theme-icon" aria-hidden="true" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <div className={`status ${error ? 'status-error' : ''}`}>
            <span className="status-dot" />
            {error || 'System online'}
          </div>
        </div>
      </header>

      <section className="measurement-grid">
        <article className="measurement-card temperature-card">
          <p>Temperature</p>
          <strong>
            {latest ? latest.temperature_c.toFixed(1) : '--'}
            <span>°C</span>
          </strong>
        </article>

        <article className="measurement-card humidity-card">
          <p>Humidity</p>
          <strong>
            {latest ? latest.humidity_percent.toFixed(1) : '--'}
            <span>%</span>
          </strong>
        </article>

        <article className="measurement-card details-card">
          <p>Last measurement</p>
          <strong>{latest ? formatDate(latest.measured_at) : 'Waiting for data'}</strong>
          <small>{latest?.device_id || 'No sensor data yet'}</small>
        </article>
      </section>

      <section className="history">
        <div className="section-heading">
          <div>
            <h2>Measurement history</h2>
            <p>The latest 50 records from PostgreSQL</p>
          </div>
          <span>Updated every 5 seconds</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Device</th>
                <th>Temperature</th>
                <th>Humidity</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr key={measurement.id}>
                  <td>{formatDate(measurement.measured_at)}</td>
                  <td>{measurement.device_id}</td>
                  <td>{measurement.temperature_c.toFixed(1)} °C</td>
                  <td>{measurement.humidity_percent.toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>

          {measurements.length === 0 && (
            <p className="empty-message">Waiting for the first measurement...</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
