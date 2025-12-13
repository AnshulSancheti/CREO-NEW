# CREO Quick Start Guide

Get your AI-powered course builder running in 3 steps.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Your API Key

### Create Environment File

Create a file named `.env.local` in the project root:

```bash
# Windows (PowerShell)
New-Item -Path ".env.local" -ItemType File

# Mac/Linux
touch .env.local
```

### Add Your Universal API Key

Open `.env.local` and add:

```bash
EMERGENT_API_KEY=your-emergent-api-key-here
```

> **Where to get your API key:**
> - Get your universal API key from your LLM provider dashboard
> - The key provides access to Gemini, GPT, Claude, and other models
> - Contact your administrator if you don't have access

### Example Configuration

```bash
# Required
EMERGENT_API_KEY=sk-emergent-abc123xyz...

# Optional: Choose default provider
DEFAULT_LLM_PROVIDER=auto

# Optional: Customize models
GEMINI_MODEL=gemini-2.0-flash-exp
```

## 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/course](http://localhost:3000/course) in your browser.

## Test Your Setup

1. Enter a course topic (e.g., "React Development")
2. Select difficulty and duration
3. Choose your preferred LLM provider from the dropdown
4. Click "Generate course"

If you see the error **"Universal LLM API key not configured"**, verify:
- `.env.local` exists in the project root
- `EMERGENT_API_KEY` is properly set
- You've restarted the dev server after creating `.env.local`

## Model Selection

The course builder supports multiple AI providers. Use the **Model Selector** dropdown to choose:

- **Auto** - Tries all providers with smart fallback
- **Gemini** - Google's Gemini models
- **OpenAI** - GPT-4 and GPT-3.5
- **Claude** - Anthropic's Claude models

Your universal API key works with all providers.

## Next Steps

- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for advanced configuration
- Check [COURSE_BUILDER_GUIDE.md](./COURSE_BUILDER_GUIDE.md) for feature details
- Review [env.example](./env.example) for all configuration options

## Troubleshooting

**Server won't start:**
- Check that Node.js 18+ is installed: `node --version`
- Delete `node_modules` and run `npm install` again

**Course generation fails:**
- Verify your API key is valid
- Check browser console for detailed error messages
- Try switching to a different LLM provider

**No videos appearing:**
- YouTube API integration is separate and optional
- Courses will generate successfully without videos
