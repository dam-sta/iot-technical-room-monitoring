# IoT Technical Room Monitoring

A small IoT project for monitoring temperature and humidity in a technical
room. A Python script simulates a sensor, publishes measurements through MQTT,
and a FastAPI backend stores them in PostgreSQL and makes the latest
measurement available through HTTP.

## Architecture

```text
Telemetry: Sensor Simulator --MQTT--> Mosquitto --MQTT--> FastAPI --SQL--> PostgreSQL
API:       Browser <--HTTP--> FastAPI
```

The simulator can later be replaced with a physical device without changing
the MQTT message format.

## Technologies

- Python 3.12
- Paho MQTT
- Eclipse Mosquitto
- FastAPI
- PostgreSQL
- Psycopg
- Docker Compose

## Running the project

The project was developed in WSL with Ubuntu 24.04 and requires Docker with
Docker Compose.

Start the containers:

```bash
docker compose up --build
```

In another terminal, subscribe to the project topics:

```bash
docker compose exec mosquitto \
  mosquitto_sub -h localhost -t 'technical-room/#' -v
```

The latest measurement is available at:

```text
http://localhost:8000/measurements/latest
```

FastAPI documentation is available at:

```text
http://localhost:8000/docs
```

To view the latest records directly in PostgreSQL:

```bash
docker compose exec postgres psql -U iot_user -d iot_monitoring \
  -c "SELECT * FROM measurements ORDER BY measured_at DESC LIMIT 5;"
```

Stop and remove the containers:

```bash
docker compose down
```

## MQTT data

Measurements are published every 5 seconds with QoS 0.

Topic:

```text
technical-room/room-1/telemetry
```

Example payload:

```json
{
  "device_id": "sensor_technical_room_01",
  "temperature_c": 24.15,
  "humidity_percent": 48.3,
  "measured_at": "2026-07-10T18:30:00+00:00"
}
```

## Roadmap

- Display current and historical data in a React dashboard
