# 🚕 Taxi TrackIt - Real-Time Taxi Fleet Tracking System

A full-stack real-time taxi tracking application with geofencing capabilities, zone management, and live WebSocket updates. Built with React, Node.js, PostgreSQL (Supabase), Redis, and Leaflet maps.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Future Improvemnets](#-future-improvements)
---

## ✨ Features

### Real-Time Tracking
- **Live Location Updates**: WebSocket-based real-time taxi position updates on interactive Leaflet maps
- **Auto-Refresh**: Taxi markers update every second without page reload
- **Connection Status**: Visual indicator for WebSocket connection state

### Geofencing & Zone Management
- **Dynamic Zones**: Create, edit, and delete custom geofence zones on the map
- **Zone Detection**: Automatic detection when taxis enter/exit zones using Turf.js geospatial calculations
- **Visual Boundaries**: Color-coded zone polygons with hover effects

### Zone Crossing Events
- **Real-Time Alerts**: Toast notifications for ENTER, EXIT, and CROSSING events
- **Event History**: Comprehensive log of all zone crossing activities
- **Live Feed**: Dedicated panel showing live zone events with timestamps
- **Event Types**: 
  - 🟢 **ENTER**: Taxi entering a zone from outside
  - 🔴 **EXIT**: Taxi leaving a zone to outside
  - 🚗 **CROSSING**: Taxi moving between two zones

### Fleet Management
- **Taxi Registration**: Add taxis with unique IDs and names
- **Taxi List**: View all registered taxis with edit/delete capabilities
- **Zone Assignment**: Track which zone each taxi is currently in

### Analytics Dashboard
- **Live Statistics**: Real-time count of active taxis
- **Zone Status**: Visual representation of taxi distribution across zones
- **Speed Monitoring**: Track taxi speeds and timestamps

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Landing Page  │  Dashboard  │  Taxi Page  │  Zone Page  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Components Layer                             │   │
│  │  • LiveTrackingMap  • ZoneEventsPanel                    │   │
│  │  • AddTaxiDialog    • AddZoneDialog                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Services Layer                               │   │
│  │  • locationService  • zoneService  • taxiService         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              State Management                             │   │
│  │  • useWebSocket Hook  • ZoneEventsContext                │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   WebSocket    │
                    │   (wss://)     │
                    └───────┬────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  WebSocket Server                         │   │
│  │  • Connection Management  • Broadcast Updates             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes                             │   │
│  │  /api/location  │  /api/zones  │  /api/taxis            │   │
│  │  /api/zone-crossing                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Services                               │   │
│  │  • redisService  • zoneService  • supabaseClient         │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────┬───────────────────────┬──────────────────────────┘
                │                       │
        ┌───────┴────────┐      ┌──────┴─────────┐
        │  Redis Cache   │      │  PostgreSQL    │
        │  (Pub/Sub)     │      │  (Supabase)    │
        │                │      │                │
        │ • Taxi Locs    │      │ • Taxis Table  │
        │ • Zone Cache   │      │ • Zones Table  │
        │ • Event Queue  │      │ • Crossings    │
        └────────────────┘      └────────────────┘
```

### Data Flow Architecture

#### 1. **Location Update Flow**
```
Taxi Simulator → POST /api/location/update
                    ↓
            Zone Detection (Turf.js)
                    ↓
            Compare with Last Zone (Redis)
                    ↓
            [Zone Changed?]
                    ↓
            YES: Save to DB + Publish Event
                    ↓
            Update Redis Cache
                    ↓
            Publish to Redis Pub/Sub
                    ↓
            WebSocket Broadcast
                    ↓
            Frontend Updates Map
```

#### 2. **Zone Crossing Detection Logic**
```
New Location Received
        ↓
Get All Zones from Redis
        ↓
For Each Zone:
    Check if Point in Polygon (Turf.js)
        ↓
Current Zone Found (or null if outside)
        ↓
Retrieve Previous Zone from Redis
        ↓
Compare: Current vs Previous
        ↓
If Different:
    Determine Event Type:
        • previousZone && !currentZone → EXIT
        • !previousZone && currentZone → ENTER
        • previousZone && currentZone → CROSSING
        ↓
    Save Event to DB
        ↓
    Broadcast via WebSocket
        ↓
    Update Redis with Current State
```

#### 3. **WebSocket Communication Flow**
```
Client Connects
        ↓
Store Client in Set
        ↓
Subscribe to Redis Channels:
    • taxi_updates
    • zone_crossing_events
        ↓
On Redis Message:
        ↓
    Parse Data
        ↓
    Broadcast to All Connected Clients
        ↓
    Client Receives Update
        ↓
    Update UI (Map/Events Panel)
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1**: UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Leaflet 1.9.4**: Interactive maps
- **React Leaflet**: React bindings for Leaflet
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Lucide React**: Icon library
- **Sonner**: Toast notifications
- **React Router DOM**: Client-side routing

### Backend
- **Node.js 18+**: JavaScript runtime
- **Express 4.21.2**: Web framework
- **WebSocket (ws 8.18.3)**: Real-time communication
- **Redis 4.7.1**: Caching and pub/sub
- **Supabase**: PostgreSQL database and authentication
- **Turf.js 7.2.0**: Geospatial calculations
- **Cors**: Cross-origin resource sharing
- **Dotenv**: Environment configuration

### Database
- **PostgreSQL**: Main database (via Supabase)
  - `taxis` table: Taxi registration
  - `zones` table: Geofence zones
  - `zone_crossings` table: Event history
  - `zone_events` table: Legacy events
  - `taxi_zone_status` table: Current zone assignments

### DevOps & Deployment
- **Vercel**: Frontend hosting
- **Render.com**: Backend hosting
- **Redis Cloud**: Managed Redis instance
- **Git**: Version control
- **npm**: Package management

---

## 📦 Prerequisites

Before installation, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **Supabase Account** (free tier available)
- **Redis Instance** (local or cloud)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/A-BHARATH77/Taxi-TrackIt.git
cd Taxi-TrackIt
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Create `.env` file in `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Run the following SQL in Supabase SQL Editor:

```sql
-- Create taxis table
CREATE TABLE taxis (
    id SERIAL PRIMARY KEY,
    taxi_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create zones table
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    boundary JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create zone_crossings table
CREATE TABLE zone_crossings (
    id SERIAL PRIMARY KEY,
    taxi_id VARCHAR(50) NOT NULL,
    previous_zone UUID,
    current_zone UUID,
    event_type VARCHAR(20),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    speed INTEGER DEFAULT 0,
    crossed_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (taxi_id) REFERENCES taxis(taxi_id),
    FOREIGN KEY (previous_zone) REFERENCES zones(id),
    FOREIGN KEY (current_zone) REFERENCES zones(id)
);

-- Create indexes for performance
CREATE INDEX idx_zone_crossings_taxi_id ON zone_crossings(taxi_id);
CREATE INDEX idx_zone_crossings_crossed_at ON zone_crossings(crossed_at DESC);
CREATE INDEX idx_zone_crossings_event_type ON zone_crossings(event_type);

-- Create taxi_zone_status table
CREATE TABLE taxi_zone_status (
    taxi_id VARCHAR(50) PRIMARY KEY,
    current_zone UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (taxi_id) REFERENCES taxis(taxi_id),
    FOREIGN KEY (current_zone) REFERENCES zones(id)
);
```

### 3. Frontend Setup

```bash
cd ../frontend/taxi
npm install
```

#### Create `.env` file in `frontend/taxi/` directory:

```env
# Backend API URL
VITE_SERVER_URL=http://localhost:5000

# WebSocket URL
VITE_WS_URL=ws://localhost:5000/ws
```

---

## 🚀 Future Improvements

### Planned Enhancements

- **User Management System**: Implement role-based access control (RBAC) with user authentication, driver profiles, dispatcher roles, and admin dashboards for managing permissions and access levels

- **Efficiency Metrics**: 
  - **Fuel Monitoring**: Track fuel consumption per trip, calculate fuel efficiency rates, and generate cost analysis reports
  - **Tire Pressure Tracking**: Real-time tire pressure monitoring with alerts for under-inflation, predictive maintenance scheduling
  - **Vehicle Health Dashboard**: Comprehensive vehicle diagnostics and maintenance alerts

- **Total Distance Coverage Metrics**: 
  - Trip distance calculation and aggregation
  - Daily, weekly, and monthly mileage reports
  - Route optimization analytics
  - Distance-based billing and fare calculation

### Additional Future Features

- **Advanced Analytics & Reporting**:
  - Driver performance metrics (average speed, idle time, harsh braking)
  - Revenue analytics per taxi/zone/time period
  - Peak hour analysis and demand forecasting
  - Heat maps for popular routes and zones

- **Mobile Applications**:
  - Native iOS and Android apps for drivers
  - Passenger mobile app for booking and tracking
  - Push notifications for zone events and alerts

- **AI & Machine Learning**:
  - Predictive maintenance using historical vehicle data
  - Dynamic pricing based on demand patterns
  - Traffic prediction and route optimization
  - Anomaly detection for unusual driving behavior

- **Enhanced Geofencing**:
  - Multi-level zone hierarchies (city → district → neighborhood)
  - Time-based zone restrictions (parking zones, restricted areas)
  - Custom alert rules per zone type
  - Automatic zone recommendations based on historical data

- **Integration Capabilities**:
  - Third-party payment gateway integration
  - SMS/Email notification system
  - Google Maps / Mapbox integration for better routing
  - Vehicle telematics hardware integration (OBD-II devices)

- **Advanced Monitoring**:
  - Driver fatigue detection based on continuous driving hours
  - Speed limit violation alerts
  - Unauthorized zone entry warnings
  - Emergency SOS button with location sharing

- **Scalability & Performance**:
  - Implement Redis clustering for high-availability
  - Add load balancing for WebSocket connections
  - Database sharding for large-scale deployments
  - CDN integration for faster global access

- **Business Intelligence**:
  - Custom report builder
  - Data export functionality (CSV, PDF, Excel)
  - Dashboard customization per user role
  - Real-time KPI monitoring widgets

---