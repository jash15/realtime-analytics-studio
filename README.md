# ⚡ Realtime Analytics Studio

A high-throughput, low-latency telemetry studio and real-time event analytics dashboard built with **Vue 3**, **TypeScript**, and **Tailwind CSS**.

Designed with a modern cyber HUD aesthetic, buttery 60fps streaming charts, zero heavy external chart dependencies, and a sub-60KB gzipped production bundle.

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

---

## 🌟 Highlights

- **Ultra-Fast Streaming Engine**: In-memory ring buffer (500 events sliding window) with rolling 60-second time-series aggregations, percentile calculation (P50, P95, P99), and Apdex SLA tracking.
- **Buttery 60fps Charts**: Bespoke SVG & Canvas visualizers with glowing neon gradients, real-time curves, and crosshair inspections—avoiding heavy chart libraries.
- **5 Integrated Studio Workspaces**:
  1. 📊 **Studio Overview**: Rolling telemetry timeline, interactive global edge map with radar pulses, latency SLA histogram, funnel conversion pipeline, and device/browser breakdowns.
  2. ⚡ **Live Ingestion Feed**: High-density real-time event log with instant search, status filtering, and a slide-over JSON payload inspector.
  3. 🔍 **Query Studio**: SQL-like group-by aggregation engine (`endpoint`, `country`, `statusCode`, `browser`, `device`) with 1-click presets and instant reactive computation.
  4. 🚨 **Alerts & SLA Engine**: Live threshold evaluation rules, anomaly detection banner, incident audit history, and synthesized alert audio via the Web Audio API (zero audio files needed).
  5. 🧪 **Simulation & Chaos Lab**: One-click synthetic chaos triggers (Database Lag Surge, 5xx Microservice Outage, 500% DDoS Influx Burst) and custom JSON event dispatcher.
- **Preset Telemetry Scenarios**: Switch dynamically between **E-Commerce Store**, **Fintech Payments**, **SaaS Cloud API**, and **Cyber Defense**.
- **Data Export**: 1-click export of captured streaming slices to JSON and CSV.
- **Clean & Minimal Code**: Strongly typed TypeScript, modular reactive stores, and zero bloat.

---

## 📸 Studio Workspaces

| Workspace | Description |
|-----------|-------------|
| **Studio Overview** | Real-time RPS area chart, P95 latency line, global edge map with animated coordinate beacons, SLA compliance histogram, and end-to-end conversion funnel. |
| **Live Stream** | Millisecond-precision event table with live status pills (2xx, 3xx, 4xx, 5xx), response time bars, and detailed modal inspector with payload copying. |
| **Query Explorer** | Visual SQL query builder executing reactive dimension aggregations over the rolling buffer with share percentages, average latencies, and max outlier detection. |
| **Alert Center** | Configurable SLA triggers with sliders (P95 latency, error rates, throughput spikes), real-time incident notifications, and audio synthesizer alerts. |
| **Chaos Lab** | Real-time chaos engineering sandbox to simulate outages, network bottlenecks, traffic floods, or inject custom JSON telemetry events. |

---

## 🚀 Quickstart

### Prerequisites
- Node.js `18.x` or higher
- npm `9.x` or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/jash15/realtime-analytics-studio.git
cd realtime-analytics-studio

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Typecheck and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Architecture & Project Structure

```
realtime-analytics-studio/
├── index.html                     # HTML5 entry with JetBrains Mono & Inter typography
├── package.json                   # Lean, minimal dependencies
├── vite.config.ts                 # Vite bundler configuration
├── tsconfig.json                  # Strict TypeScript configuration
├── tailwind.config.js             # Custom dark cyberpunk telemetry palette
├── src/
│   ├── main.ts                    # Vue 3 application bootstrapper
│   ├── App.vue                    # Root HUD layout with tab navigation
│   ├── index.css                  # Tailwind styles and custom dark scrollbars
│   ├── types/
│   │   └── analytics.ts           # TelemetryEvent, MetricSnapshot, AlertRule types
│   ├── engine/
│   │   ├── streamEngine.ts        # Reactive ring buffer, rolling percentiles, generator
│   │   ├── alertEngine.ts         # Threshold evaluation and incident lifecycle
│   │   ├── queryEngine.ts         # In-memory dimension aggregation & filtering engine
│   │   └── dataPresets.ts         # Multi-scenario catalogs (E-comm, Fintech, SaaS, Cyber)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── HeaderNav.vue      # Status pill, speed control, scenarios, export
│   │   │   └── MetricCards.vue    # Glassmorphic KPI cards with live mini sparklines
│   │   ├── charts/
│   │   │   ├── ThroughputChart.vue # 60fps rolling curve with crosshair hover tooltip
│   │   │   ├── GeoPulseMap.vue     # Equirectangular SVG world map with edge beacons
│   │   │   ├── LatencyDistribution.vue # SLA response histogram (<50ms to >1s)
│   │   │   ├── ConversionFunnel.vue    # Realtime drop-off pipeline
│   │   │   └── BreakdownRings.vue      # Device, browser & HTTP code distribution
│   │   ├── stream/
│   │   │   ├── EventStreamView.vue     # Rolling event stream with filters & search
│   │   │   └── EventDetailModal.vue    # Formatted JSON payload viewer with clipboard copy
│   │   ├── query/
│   │   │   └── QueryStudio.vue         # In-memory group-by explorer with SQL preview
│   │   ├── alerts/
│   │   │   └── AlertCenter.vue         # Threshold sliders, incident banner & history
│   │   └── simulator/
│   │       └── SimulationLab.vue       # Chaos buttons, custom JSON injection & cURL guide
│   └── utils/
│       ├── audio.ts               # Web Audio API sound synthesizer
│       └── formatters.ts          # Latency, throughput, numbers, status code formatters
└── README.md
```

---

## 📡 Ingesting Custom Events

You can push events into the studio directly from your own services or browser scripts:

### cURL

```bash
curl -X POST https://your-analytics-host.io/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/v1/orders",
    "method": "POST",
    "statusCode": 200,
    "latencyMs": 85,
    "userId": "usr_7891",
    "countryCode": "US"
  }'
```

### TypeScript / JavaScript

```typescript
await fetch('/api/telemetry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timestamp: Date.now(),
    endpoint: window.location.pathname,
    latencyMs: performance.now(),
    device: navigator.userAgentData?.mobile ? 'mobile' : 'desktop'
  })
});
```

---

## 🛡️ License

Released under the [MIT License](LICENSE).

