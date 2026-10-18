# IPMR Rehabilitation Database

This directory contains the database files and schema for the Institute of Physical Medicine and Rehabilitation (IPMR) system.

## Files
- `hospital.db`: SQLite database file storing all active application data (Users, Therapists, Machines, Patients, Sessions, Settings).
- `schema.sql`: Standalone SQL schema definition with table structures, constraints, and default data format.

## Tables
| Table | Description |
| :--- | :--- |
| `users` | Staff login credentials with bcrypt-hashed passwords and roles |
| `therapists` | Clinical directory of 50+ physiotherapists, OTs, psychologists, and speech pathologists |
| `machines` | 14 robotic and electrotherapy rehab machines with operating durations |
| `patients` | Patient queue, priority scoring, machine requirements, and care settings |
| `sessions` | Real-time therapy countdown timers, machine allocation, and reclaimed minutes |
| `settings` | Autonomous scheduling rules, priority parameters, and buffer times |

## Connection
The backend server connects automatically to `../database/hospital.db` via `node:sqlite` (SQLite WAL mode enabled).
