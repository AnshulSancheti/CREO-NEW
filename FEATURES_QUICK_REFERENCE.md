# 🚀 CREO - Quick Feature Reference

## 📍 Access URLs

| Page | URL | What You Can Test |
|------|-----|-------------------|
| **Homepage** | `http://localhost:3000/` | Landing page, animated hero, features showcase |
| **Learning Workspace** | `http://localhost:3000/learn` | Goal setting, path creation, progress tracking |
| **AI Tutor** | `http://localhost:3000/tutor` | Chat with AI coach, learning mode, hints |
| **API Testing** | `http://localhost:3000/api-test` | Interactive API tester, live responses |
| **Course Builder** | `http://localhost:3000/course` | Generate custom courses, structured curriculum |

---

## 🎮 Gamification Features

### XP & Leveling
```bash
# Gain XP (correct answer)
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "lessonId": "lesson-loops", "correct": true}'
# Returns: +20 XP
```

### Hearts System
```bash
# Lose heart (wrong answer)
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "lessonId": "lesson-loops", "correct": false}'
# Returns: -1 heart (5 max)
```

### Quests
```bash
# View quests
curl "http://localhost:3000/api/quests?userId=YOUR_ID"

# Claim reward
curl -X POST http://localhost:3000/api/quests \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "questId": "quest-daily-steps"}'
```

---

## 📊 Progress Tracking

### Topic Confidence
```bash
# Record positive progress
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "topic": "arrays", "sentiment": "positive"}'

# Record struggle
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "topic": "loops", "sentiment": "negative"}'
```

---

## 🤖 AI Tutor

### Chat Interface
```bash
# Ask for help
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_ID", "message": "Help me with loops", "topic": "loops"}'
```

**Enable Real AI**: Add to `/app/.env.local`:
```
GEMINI_API_KEY=your-key-here
```

---

## 📚 Skills & Lessons

### Available Skills
1. **Algorithms Warmup** (intro) - Loops, conditionals, basics
2. **Data Structures** (intermediate) - Arrays, stacks, queues, hash maps
3. **Systems Thinking** (advanced) - Threads, queues, backpressure

### View Skills
```bash
curl "http://localhost:3000/api/skills?userId=YOUR_ID"
```

### View Lesson
```bash
curl "http://localhost:3000/api/lessons/lesson-loops"
```

---

## 🧪 Quick Test Script

Run the interactive demo:
```bash
bash /tmp/interactive_demo.sh
```

Or quick API test:
```bash
# Create user
USER_ID=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "subjects": ["coding"]}' \
  | jq -r '.data.profile.id')

# Make progress
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"lessonId\": \"lesson-loops\", \"correct\": true}"

# Check stats
curl "http://localhost:3000/api/game?userId=$USER_ID" | jq '.data.stats'
```

---

## 📋 System Status

**All Features Working:**
- ✅ 5 Frontend Pages
- ✅ 11 API Endpoints
- ✅ XP & Leveling (+20 per correct)
- ✅ Hearts System (5 max, -1 per wrong)
- ✅ 3 Skills with Lessons
- ✅ 3 Quests (daily/weekly)
- ✅ Topic Confidence (0-100%)
- ✅ AI Tutoring (with learning mode)
- ✅ Streaks & Consistency
- ✅ Progress Tracking
- ✅ Course Generation
- ✅ Profile Creation (Safe & Idempotent)

**Services Running:**
- ✅ Next.js on port 3000
- ✅ SQLite database
- ✅ Hot reload enabled

---

## 🎯 Try These Now!

1. **Visit Homepage**: Open `http://localhost:3000/` in browser
2. **Click Floating Coach**: Bottom right corner button
3. **Explore Learning Workspace**: Go to `/learn`
4. **Chat with AI Tutor**: Go to `/tutor` and type a question
5. **Run Interactive Demo**: `bash /tmp/interactive_demo.sh`
6. **Test APIs**: Go to `/api-test` or use curl commands above

---

**Everything is working end-to-end! 🎉**

For detailed testing guide: See `/tmp/TESTING_GUIDE.md`
