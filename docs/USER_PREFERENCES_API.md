# User & Preferences API Documentation

## Overview

Foundational user and preference system for CREO learning platform.

**Status**: ✅ Core implementation complete  
**Auth**: Placeholder (TODO: Implement JWT/OAuth)

---

## Database Models

### User

```typescript
type UserProfile = {
  id: string;                    // UUID
  name: string;
  subjects: string[];            // Array of subjects
  goals: string;
  learningStyle: LearningStyle;  // 'examples' | 'visual-metaphors' | 'formulas' | 'intuition-first' | 'default'
  attentionSpan: AttentionSpan;  // 'short' | 'medium' | 'long'
  pastStruggles: string[];
  progressNotes?: string;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

### UserPreferences

```typescript
type UserPreferences = {
  id: string;                    // UUID
  userId: string;                // Foreign key to User
  dailyTimeBudget: number;       // minutes (5-480)
  learningPace: LearningPace;    // 'slow' | 'balanced' | 'fast'
  remindersEnabled: boolean;
  timezone: string;              // IANA timezone (e.g., 'America/New_York', 'UTC')
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

---

## API Endpoints

### 1. POST /api/auth/login

**Stub authentication endpoint** (placeholder - no real auth yet)

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "placeholder"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name or email is required"
  }
}
```

**TODO:**
- Implement password hashing
- Add OAuth providers (Google, GitHub)
- Generate JWT tokens
- Session management

---

### 2. GET /api/me

Get current authenticated user's profile, preferences, and stats.

**Headers:**
```
Authorization: Bearer {userId}
```
OR
```
x-user-id: {userId}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "subjects": ["algorithms", "web dev"],
      "goals": "Master coding",
      "learningStyle": "examples",
      "attentionSpan": "medium",
      "pastStruggles": ["loops", "recursion"],
      "progressNotes": "",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "preferences": {
      "dailyTimeBudget": 30,
      "learningPace": "balanced",
      "remindersEnabled": true,
      "timezone": "UTC"
    },
    "stats": {
      "xp": 100,
      "level": 2,
      "streakCount": 5,
      "hearts": 5,
      "maxHearts": 5
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide userId in Authorization header or x-user-id header."
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User profile not found"
  }
}
```

---

### 3. GET /api/me/preferences

Get only the preferences for the authenticated user.

**Headers:**
```
Authorization: Bearer {userId}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "id": "pref-550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "dailyTimeBudget": 30,
      "learningPace": "balanced",
      "remindersEnabled": true,
      "timezone": "UTC",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 4. PUT /api/me/preferences

Update authenticated user's preferences.

**Headers:**
```
Authorization: Bearer {userId}
Content-Type: application/json
```

**Request (all fields optional):**
```json
{
  "dailyTimeBudget": 60,
  "learningPace": "fast",
  "remindersEnabled": false,
  "timezone": "America/New_York"
}
```

**Validation Rules:**
- `dailyTimeBudget`: Must be between 5 and 480 minutes
- `learningPace`: Must be one of: `slow`, `balanced`, `fast`
- `remindersEnabled`: Must be boolean
- `timezone`: Must be valid IANA timezone string

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "id": "pref-550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "dailyTimeBudget": 60,
      "learningPace": "fast",
      "remindersEnabled": false,
      "timezone": "America/New_York",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T12:30:00.000Z"
    }
  }
}
```

**Error (400 - Validation):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "dailyTimeBudget must be between 5 and 480 minutes; learningPace must be one of: slow, balanced, fast"
  }
}
```

---

## Testing Examples

### Using curl

```bash
# 1. Login (stub)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}')

USER_ID=$(echo $RESPONSE | jq -r '.data.userId')
echo "User ID: $USER_ID"

# 2. Get user profile and preferences
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer $USER_ID"

# 3. Update preferences
curl -X PUT http://localhost:3000/api/me/preferences \
  -H "Authorization: Bearer $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyTimeBudget": 60,
    "learningPace": "fast",
    "remindersEnabled": false,
    "timezone": "America/Los_Angeles"
  }'

# 4. Get only preferences
curl -X GET http://localhost:3000/api/me/preferences \
  -H "Authorization: Bearer $USER_ID"
```

### Using JavaScript/TypeScript

```typescript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com'
  })
});
const { data } = await loginResponse.json();
const userId = data.userId;

// 2. Get user info
const meResponse = await fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${userId}` }
});
const userData = await meResponse.json();

// 3. Update preferences
const updateResponse = await fetch('/api/me/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${userId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dailyTimeBudget: 45,
    learningPace: 'balanced',
    timezone: 'Europe/London'
  })
});
const updatedPrefs = await updateResponse.json();
```

---

## Database Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subjects TEXT DEFAULT '[]',
  goals TEXT DEFAULT '',
  learning_style TEXT DEFAULT 'default',
  attention_span TEXT DEFAULT 'medium',
  past_struggles TEXT DEFAULT '[]',
  progress_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  daily_time_budget INTEGER DEFAULT 30,
  learning_pace TEXT DEFAULT 'balanced',
  reminders_enabled INTEGER DEFAULT 1,
  timezone TEXT DEFAULT 'UTC',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Service Layer Functions

```typescript
// Get user preferences
getUserPreferences(userId: string): UserPreferences | null

// Create preferences for a user
createUserPreferences(userId: string, data?: Partial<UserPreferences>): UserPreferences

// Get or create (idempotent)
getOrCreateUserPreferences(userId: string): UserPreferences

// Update preferences
updateUserPreferences(userId: string, data: Partial<UserPreferences>): UserPreferences | null
```

---

## TODO: Future Authentication

### Phase 1: JWT Implementation
- [ ] Generate JWT tokens with user claims
- [ ] Validate JWT on protected routes
- [ ] Implement token refresh logic
- [ ] Add token expiration (15 min access, 7 day refresh)

### Phase 2: OAuth Providers
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Email/password with bcrypt hashing
- [ ] Social login UI

### Phase 3: Session Management
- [ ] Redis-based sessions
- [ ] Session cleanup cron job
- [ ] "Remember me" functionality
- [ ] Device tracking

### Phase 4: Security
- [ ] Rate limiting (express-rate-limit)
- [ ] CSRF protection
- [ ] XSS headers
- [ ] Password reset flow
- [ ] Email verification

---

## Files Created

```
/app/prisma/schema.prisma                     # Prisma schema (reference)
/app/src/lib/db.ts                            # Extended with preferences functions
/app/src/middleware/auth.ts                   # Placeholder auth middleware
/app/src/app/api/auth/login/route.ts          # Stub login endpoint
/app/src/app/api/me/route.ts                  # Get user profile
/app/src/app/api/me/preferences/route.ts      # Get/update preferences
/app/docs/USER_PREFERENCES_API.md             # This documentation
```

---

**Implementation Status:** ✅ Complete (placeholder auth ready for real implementation)
