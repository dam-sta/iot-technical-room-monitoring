import { useEffect, useState } from 'react'
import { Languages, Moon, Sun } from 'lucide-react'
import './App.css'
import MeasurementChart from './MeasurementChart.jsx'
import translations from './translations.js'

const API_URL = 'http://localhost:8000'

function formatDate(date, locale) {
  return new Date(date).toLocaleString(locale)
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

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem('language')

  if (savedLanguage === 'en' || savedLanguage === 'pl') {
    return savedLanguage
  }

  return navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}

function App() {
  const [latest, setLatest] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [hasError, setHasError] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)
  const [language, setLanguage] = useState(getInitialLanguage)
  const text = translations[language]
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  function toggleLanguage() {
    const newLanguage = language === 'en' ? 'pl' : 'en'
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
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
          setHasError(false)
        }
      } catch {
        if (isMounted) {
          setHasError(true)
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
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="subtitle">{text.subtitle}</p>
        </div>
        <div className="header-actions">
          <button
            className="language-toggle"
            type="button"
            onClick={toggleLanguage}
            aria-label={
              language === 'en' ? text.switchToPolish : text.switchToEnglish
            }
          >
            <Languages className="toggle-icon" aria-hidden="true" />
            {language.toUpperCase()}
          </button>

          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? text.switchToLight : text.switchToDark}
          >
            {theme === 'dark' ? (
              <Sun className="toggle-icon" aria-hidden="true" />
            ) : (
              <Moon className="toggle-icon" aria-hidden="true" />
            )}
            {theme === 'dark' ? text.lightMode : text.darkMode}
          </button>

          <div className={`status ${hasError ? 'status-error' : ''}`}>
            <span className="status-dot" />
            {hasError ? text.backendOffline : text.systemOnline}
          </div>
        </div>
      </header>

      <section className="measurement-grid">
        <article className="measurement-card temperature-card">
          <p>{text.temperature}</p>
          <strong>
            {latest ? latest.temperature_c.toFixed(1) : '--'}
            <span>°C</span>
          </strong>
        </article>

        <article className="measurement-card humidity-card">
          <p>{text.humidity}</p>
          <strong>
            {latest ? latest.humidity_percent.toFixed(1) : '--'}
            <span>%</span>
          </strong>
        </article>

        <article className="measurement-card details-card">
          <p>{text.lastMeasurement}</p>
          <strong>
            {latest ? formatDate(latest.measured_at, locale) : text.waitingForData}
          </strong>
          <small>{latest?.device_id || text.noSensorData}</small>
        </article>
      </section>

      <MeasurementChart measurements={measurements} locale={locale} text={text} />

      <section className="history">
        <div className="section-heading">
          <div>
            <h2>{text.historyTitle}</h2>
            <p>{text.historySubtitle}</p>
          </div>
          <span>{text.updatedEveryFiveSeconds}</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{text.date}</th>
                <th>{text.device}</th>
                <th>{text.temperature}</th>
                <th>{text.humidity}</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr key={measurement.id}>
                  <td>{formatDate(measurement.measured_at, locale)}</td>
                  <td>{measurement.device_id}</td>
                  <td>{measurement.temperature_c.toFixed(1)} °C</td>
                  <td>{measurement.humidity_percent.toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>

          {measurements.length === 0 && (
            <p className="empty-message">{text.waitingForFirstMeasurement}</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
