# Stress Tracker - Implementation Documentation

## Overview

The **Stress Tracker** is a small web application running in a **Docker container**.  
It allows users (one per IP) to log in and periodically record their stress level via a slider, view historical data as a graph, and use a special **“Superstress”** button once per day.

---

## Functional Requirements

1. **Login**

   - A user can log in using only a username (no password).
   - Only **one active session per IP** is allowed.
   - The backend assigns a session token stored in an HTTP-only cookie.

2. **Stress Slider**

   - The user can set their stress level between **0 and 200**.
   - They can update their level **once every 5 minutes**.

3. **Superstress**

   - Once per day, the user can press a **Superstress** button.
   - It records a stress value of **200** and is disabled until the next day.

4. **Data Visualization**

   - The app displays stress levels over time on a line graph.
   - The average stress level is also shown.

5. **Real-time Updates**

   - Users receive live updates when anyone updates their stress level.
   - A public summary page shows all users' latest stress levels and an overall average.
   - Updates are delivered in real-time through WebSocket connections.

6. **Persistence**
   - All data is stored in a local **SQLite** database.
   - The database is persisted via a Docker volume.

---

## Technical Stack

| Layer         | Technology                           | Notes                                               |
| ------------- | ------------------------------------ | --------------------------------------------------- |
| **Backend**   | Node.js + Fastify                    | Handles API, auth, rate limits                      |
| **Database**  | SQLite                               | Local embedded DB (via `better-sqlite3`)            |
| **Frontend**  | React + Vite + Tailwind CSS          | Modern lightweight SPA                              |
| **Charting**  | Chart.js (`react-chartjs-2`)         | Displays stress over time                           |
| **Real-time** | WebSocket (via `@fastify/websocket`) | Provides live updates of stress levels              |
| **Container** | Docker (multi-stage build)           | Single container serving both API & static frontend |

---
