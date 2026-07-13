import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-GB')
}

function MeasurementChart({ measurements }) {
  const chartData = [...measurements].reverse()

  return (
    <section className="chart-panel">
      <div className="section-heading">
        <div>
          <h2>Measurement chart</h2>
          <p>Temperature and humidity over time</p>
        </div>
        <span>Oldest to newest</span>
      </div>

      {chartData.length > 0 ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 12, bottom: 5, left: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="measured_at"
                tickFormatter={formatTime}
                minTickGap={35}
                stroke="var(--text-secondary)"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="temperature"
                domain={[0, 40]}
                tickFormatter={(value) => `${value}°C`}
                stroke="var(--temperature)"
                tick={{ fontSize: 12 }}
                width={52}
              />
              <YAxis
                yAxisId="humidity"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="var(--humidity)"
                tick={{ fontSize: 12 }}
                width={45}
              />
              <Tooltip
                labelFormatter={formatDate}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temperature_c"
                name="Temperature"
                unit=" °C"
                stroke="var(--temperature)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity_percent"
                name="Humidity"
                unit=" %"
                stroke="var(--humidity)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="empty-message">Waiting for the first measurement...</p>
      )}
    </section>
  )
}

export default MeasurementChart
