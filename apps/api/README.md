# BhashaVaani API

This directory will contain the local FastAPI backend.

The backend is expected to run on this PC first:

```text
http://localhost:6001
```

When Flutter Web is deployed to Firebase Hosting, expose the backend through a secure HTTPS tunnel and configure the Flutter build with:

```text
--dart-define=BHASHAVAANI_API_URL=https://api.example.com
--dart-define=BHASHAVAANI_ENV=remote
```

For local development, run the FastAPI backend:

```text
.api-venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 6001 --reload --reload-dir app
```

If dependencies are unavailable, the SQLite-backed standard-library dev server can still be used:

```text
python dev_server.py --host 127.0.0.1 --port 6001
```

By default, data is stored in:

```text
apps/api/data/bhasha_vaani.db
```

Flutter Web should run at:

```text
http://127.0.0.1:6002
```

Port `6000` is intentionally avoided because Chromium-based browsers block it as an unsafe port.

## Initial API Surface

```text
GET  /health
GET  /languages
GET  /profiles
POST /profiles
POST /learning-sessions
POST /learning-sessions/{session_id}/responses
GET  /profiles/{profile_id}/progress
```

## Security Direction

Remote access must verify Firebase Auth ID tokens before profile, lesson, or progress APIs are exposed.
