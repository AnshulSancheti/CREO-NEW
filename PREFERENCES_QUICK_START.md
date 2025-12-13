# User & Preferences System - Quick Start

## ✅ What Was Built

1. **Database Models**
   - User (existing, no changes)
   - UserPreferences (new table)

2. **API Endpoints**
   - `POST /api/auth/login` - Stub authentication
   - `GET /api/me` - Get current user profile + preferences + stats
   - `GET /api/me/preferences` - Get only preferences
   - `PUT /api/me/preferences` - Update preferences

3. **Auth Middleware**
   - Placeholder authentication
   - Accepts userId in headers (Bearer token or x-user-id)
   - Ready for JWT/OAuth integration

4. **Validation**
   - Daily time budget: 5-480 minutes
   - Learning pace: slow | balanced | fast
   - Timezone format validation

---

## 🚀 Quick Test

```bash
# Run the test suite
bash /tmp/test_user_preferences.sh

# Manual testing
# 1. Login
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name", "email": "you@example.com"}')

USER_ID=$(echo $RESPONSE | jq -r '.data.userId')

# 2. Get your profile
curl http://localhost:3000/api/me \
  -H "Authorization: Bearer $USER_ID" | jq '.'

# 3. Update preferences
curl -X PUT http://localhost:3000/api/me/preferences \
  -H "Authorization: Bearer $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyTimeBudget": 45,
    "learningPace": "fast",
    "timezone": "America/Los_Angeles"
  }' | jq '.'
```

---

## 📚 UserPreferences Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dailyTimeBudget` | number | 30 | Daily learning time in minutes (5-480) |
| `learningPace` | string | balanced | Learning speed: slow, balanced, fast |
| `remindersEnabled` | boolean | true | Enable/disable reminders |
| `timezone` | string | UTC | IANA timezone (e.g., America/New_York) |

---

## 🔧 Integration Example

```typescript
// Frontend integration
const userId = getUserIdFromAuth(); // Your auth system

// Get user data
const response = await fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${userId}` }
});
const { data } = await response.json();

console.log(data.profile.name);
console.log(data.preferences.dailyTimeBudget);
console.log(data.stats.level);

// Update preferences
await fetch('/api/me/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${userId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dailyTimeBudget: 60,
    learningPace: 'fast'
  })
});
```

---

## 📝 Service Layer Functions

```typescript
import { 
  getUserPreferences,
  createUserPreferences,
  getOrCreateUserPreferences,
  updateUserPreferences 
} from '@/lib/db';

// Get preferences
const prefs = getUserPreferences(userId);

// Get or create (idempotent)
const prefs = getOrCreateUserPreferences(userId);

// Update
const updated = updateUserPreferences(userId, {
  dailyTimeBudget: 60,
  learningPace: 'fast'
});
```

---

## ⚠️ TODOs for Production

### High Priority
- [ ] Replace stub auth with JWT tokens
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Implement password hashing (bcrypt)
- [ ] Add refresh token logic
- [ ] Session management

### Medium Priority
- [ ] Add email verification
- [ ] Password reset flow
- [ ] Rate limiting
- [ ] CSRF protection

### Low Priority
- [ ] Device tracking
- [ ] Login history
- [ ] Security audit logs

---

## 📂 Files Created

```
/app/prisma/schema.prisma                     # Prisma schema (reference)
/app/src/lib/db.ts                            # Added preferences functions
/app/src/middleware/auth.ts                   # Placeholder auth
/app/src/app/api/auth/login/route.ts          # Stub login
/app/src/app/api/me/route.ts                  # Get user
/app/src/app/api/me/preferences/route.ts      # Preferences CRUD
/app/docs/USER_PREFERENCES_API.md             # Full documentation
/app/PREFERENCES_QUICK_START.md               # This file
```

---

## ✅ Test Results

All tests passing:
- ✓ Stub login working
- ✓ Auth middleware working
- ✓ GET /api/me working
- ✓ GET /api/me/preferences working
- ✓ PUT /api/me/preferences working
- ✓ Validation working (dailyTimeBudget, learningPace)
- ✓ Persistence working

**Status**: Ready for integration ✅
