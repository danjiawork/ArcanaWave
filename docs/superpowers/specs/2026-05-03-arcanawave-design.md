# ArcanaWave — Design Spec

**Date:** 2026-05-03  
**Tagline:** *"Draw your fate with a wave of your hand"*  
**Status:** Approved for implementation

---

## 1. Product Overview

ArcanaWave is a gesture-controlled tarot reading web app that uses MediaPipe hand tracking (via webcam) to let users draw cards by waving their hand, then delivers a personalized AI reading via Claude. It targets emotional resonance and shareability for a global audience (Chinese-first, English-ready).

**Primary goal for P1:** A working local demo that can be shown to friends and used as a portfolio piece.  
**Secondary goal:** Validate market interest before deciding on WeChat Mini Program vs overseas App Store route.

---

## 2. Foundation

Built on top of [tarot-3d](https://github.com/wupinshuo/tarot-3d) (MIT license), which already provides:
- React 19 + TypeScript + Vite setup
- Three.js (React Three Fiber) 3D card scene with fan/draw/reveal states
- MediaPipe hand gesture recognition (5 gestures: OPEN_HAND, ONE_FINGER, WAVE, FIST, PRAY)
- Gesture state machine
- 22 Major Arcana card data in Chinese
- Particle effects and sound manager
- Express + dotenv already in dependencies (ready for backend API proxy)

What we add: real card images, Claude AI reading, user question input, oracle persona UI, i18n, share image.

---

## 3. User Journey (P1)

```
① LANDING
   Dark cosmic screen with golden particle starfield
   Product name "ArcanaWave" + tagline + language toggle (中/EN)
   Animated mystical orb/crystal ball as visual centerpiece
   → "✦ Begin Reading ✦" button
   Note below: "Camera required for gesture recognition. All data processed locally."

② MEDITATION & QUESTION
   Modal overlay (white border on dark):
   "✦ Before we begin ✦"
   "The cards respond to the voice within you.
    Close your eyes. Hold your question in your mind.
    The more specific, the clearer the guidance."
   Examples: "Should I change jobs? · Where is this relationship going?"
   Optional text input: "Type your question here (optional, enhances AI reading)"
   → "🙏 I'm ready. Begin the ritual. ✦"

③ CAMERA INIT + FIST TO ACTIVATE
   Browser requests camera permission
   Once camera active: dark screen with orbital rings + starfield
   Bottom prompt: "✊ Make a fist to awaken the ritual"
   FIST detected → energy burst animation → single card deck appears at center
   Badge: "The deck is ready"
   Prompt changes to: "🤚 Open your palm to fan out the cards"

④ CARD FAN
   OPEN_HAND → 22 cards fan out in 3D arc above cosmic orbital rings
   First-time: 3-second gesture guide overlay ("Slide palm left/right to browse")
   
⑤ CARD SELECTION (×3 rounds)
   Progress badge top-right: "第1张/3张" (updates per draw)
   PALM horizontal movement → carousel scrolls (center card highlighted + glow)
   Also accepts: wrist rotation/twist motion (dual-mode, both mapped to scroll)
   PALM LIFT UP → highlighted card rises, enlarges, glows (pending state)
   PINCH → confirm selection → card particle-bursts into top slot (过去/现在/未来)
   OPEN_HAND again → cancel, card returns to fan (undo path)
   If stuck 5s: gentle hint appears "← slide palm left/right →"
   After each confirmed draw: 1s celebration → cards auto re-fan (no re-palm needed)
   Repeat for 3 cards total

⑥ REVEAL
   Prompt: "Wave your hand to reveal your fate"
   WAVE gesture → cards flip one by one with golden light burst
   Each card front (real RWS illustration) revealed in sequence with delay

⑦ ORACLE READING
   Background dims, star particles slow down
   3 revealed cards displayed at top (small, face up)
   "✦ The Oracle Speaks..." with subtle loading animation
   Claude streams response in oracle voice (typewriter effect, ~3-5 words/tick)
   Text appears as if spoken by a presence, not a report

⑧ SHARE
   "Save Reading" button → canvas renders shareable portrait image
   Image: dark cosmic bg + 3 cards + oracle's first sentence + "ArcanaWave" branding
   Download as PNG (1080×1920, Instagram Stories ratio)
   
⑨ RESTART
   FIST gesture or "Read Again" button → reset to step ②
```

---

## 4. Gesture Mapping

Kept from tarot-3d and enhanced:

| Gesture | Action | Stage |
|---------|--------|-------|
| FIST | Awaken ritual / reset | INIT, REVEAL |
| OPEN_HAND | Fan cards out / cancel pending selection | IDLE → FAN, PENDING → FAN |
| PALM MOVE (horizontal) | Browse carousel | FAN |
| PALM ROTATION (wrist twist) | Also browse carousel (dual-mode) | FAN |
| PALM LIFT UP | Pull card up into pending state | FAN → PENDING |
| PINCH | Confirm card selection | PENDING → DRAWN |
| WAVE | Reveal all cards | WAITING_REVEAL |

> **Dual-mode browsing:** Both horizontal palm translation AND wrist rotation map to
> carousel scrolling. Users intuitively try different motions when cards are in a circular
> arc — supporting both eliminates the "my gesture isn't working" frustration.
> Uses `getScrollDelta()` which takes the larger of |xDelta| vs |rotationDelta|.

> **Two-step selection:** LIFT UP (intent) + PINCH (confirm) prevents accidental draws
> caused by tracking jitter or network lag. OPEN_HAND cancels a pending selection.

> **Stuck detection:** If hand is visible but carousel hasn't scrolled for 5 seconds,
> show hint: "← slide palm left/right →"

> **First-time guide:** 3-second animated overlay showing correct palm slide motion,
> auto-dismisses, does not reappear on subsequent visits (localStorage flag).

Mobile fallback (touch):
- Swipe left/right → browse cards
- Tap card → select (enters pending)
- Tap again / pinch gesture → confirm
- Two-finger swipe up → reveal
- Long press → reset

---

## 5. Claude AI Integration

### Request flow

**P1 (local demo):**
```
Frontend → Anthropic SDK (browser) → Claude API → stream → UI
API key in .env.local (VITE_CLAUDE_API_KEY), never committed to git
```

**P2 (deployed):**
```
Frontend → POST /api/reading (Express) → Claude API → SSE → Frontend
API key server-side only, never exposed to browser
```

### Model (configurable via .env.local)
```
VITE_AI_PROVIDER=claude          # or "gemini"
VITE_CLAUDE_API_KEY=sk-ant-...
VITE_GEMINI_API_KEY=AIza...
```

Supported providers:
- **Claude** (default): `claude-sonnet-4-6` for rich readings, `claude-haiku-4-5-20251001` for cost
- **Gemini**: `gemini-2.0-flash` (already in tarot-3d's `@google/genai` dependency)

`useClaude.ts` is actually `useOracle.ts` — a provider-agnostic hook that reads `VITE_AI_PROVIDER` and delegates to the appropriate SDK. Same system prompt and streaming interface for both.

### Prompt caching (Claude only)
System prompt is static and long — use prompt caching (cache_control: ephemeral) to reduce cost ~90%.

### System prompt (oracle persona)
```
You are The Oracle — an ancient, compassionate witness to fate. You do not predict 
the future with certainty; you illuminate the present moment.

Speak in first person as The Oracle. Your voice is poetic but not obscure, 
warm but not sycophantic, honest without cruelty.

Guidelines:
- Begin with an atmospheric opening that acknowledges the seeker's energy
- Address each card (past/present/future) in sequence, 2-3 sentences each
- Weave the three cards into a unified narrative  
- End with one clear, actionable insight
- Total length: 180-250 words
- If user provided a question/concern, make the reading specific to it
- Never say "as an AI" or break character
- Language: match the user's language (Chinese or English)
```

### User message format
```
Cards drawn:
- Past: {cardName} ({cardMeaning})
- Present: {cardName} ({cardMeaning})  
- Future: {cardName} ({cardMeaning})

User's question/concern: {userQuestion || "general guidance"}
Language: {zh | en}
```

---

## 6. Visual Design

### Color palette
```
Background:    #070714 (deep cosmic black)
Primary gold:  #d4af37
Light gold:    #f0c878
Glow purple:   #c084fc (selected card glow)
Glow pink:     #f472b6 (orbital ring accent)
Text primary:  #fef3c7 (amber-50)
Text dim:      #78716c
```

### 3D Cosmic Background (always present)

- **Gold particle starfield**: Hundreds of tiny gold particles at varying depths (z), slowly drifting, creating a sense of 3D space. Use Three.js Points with InstancedBufferGeometry. The entire starfield rotates slowly (like a star chart), giving a sense of cosmic motion even when idle.
- **Concentric orbital rings**: 2-3 glowing elliptical rings near the bottom of screen (pink/gold), slowly rotating. Creates a "portal" or "summoning circle" feel.
- **Depth fog**: Subtle fog/gradient from deep black at edges to slightly lighter at center, enhancing 3D depth perception.
- **Shooting stars**: Occasional gold/pink streaks that flash across (random intervals, subtle). 1-2 per 5 seconds, varying speed and trajectory.
- **Parallax on hand movement**: Star particles shift slightly based on detected hand position, creating depth illusion even during browsing.

### Card assets

**Card backs (5-8 images, randomly assigned to the 22 cards):**
- Source P1: Screenshots from CYou demo as temporary placeholders
- Source final: Freepik / Etsy "celestial tarot card back" packs
- Format: PNG, 400×640px, black-gold color scheme
- Stored: `public/cards/backs/back-{1..8}.png`

**Card fronts (22 Major Arcana):**
- Source: Extract from `PocketTarotCards2023.pdf` (Rider-Waite-Smith, public domain)
- Extraction: Python script using `pdfplumber` or `pymupdf` to crop individual cards
- Format: PNG, 400×640px
- Stored: `public/cards/fronts/{00-21}-{name}.png`

### Oracle reading panel
```
┌──────────────────────────────────────┐
│  [card1]      [card2]      [card3]   │  small card images
│   Past        Present      Future    │
├──────────────────────────────────────┤
│  ✦ The Oracle Speaks                 │
│                                      │
│  "I see the shadow of past choices   │  streaming typewriter
│   pressing upon your shoulders...    │  text effect
│   The Hermit asks you to pause..."   │
│                                      │
│  [Save Reading ↓]   [Read Again ↺]  │
└──────────────────────────────────────┘
```

---

## 7. i18n

Simple key-value JSON, no heavy library:

```
src/i18n/zh.json  — Chinese strings
src/i18n/en.json  — English strings
src/hooks/useTranslation.ts — useTranslation() hook
```

Language toggle: top-right corner, persists to localStorage.  
Claude receives the active language and responds accordingly.

---

## 8. Share Image

Generated client-side with Canvas API (no server needed):
- Size: 1080×1920px (Instagram Stories ratio)
- Elements: dark cosmic background, 3 card images, oracle's first sentence, "ArcanaWave" branding, URL
- Trigger: "Save Reading" button → `canvas.toBlob()` → `<a download>`

---

## 9. Tech Stack (P1)

```
Frontend:   React 19 + TypeScript + Vite 6
3D:         Three.js via @react-three/fiber + @react-three/drei
Gesture:    @mediapipe/tasks-vision (HandTracker.ts, unchanged)
Animation:  Framer Motion
Styling:    Tailwind CSS 4
AI:         Claude API (direct from frontend for local demo)
i18n:       Custom JSON hook
Sharing:    Canvas API
Build:      Vite
Dev server: vite --port 3000
```

---

## 10. File Changes vs tarot-3d Base

### Unchanged (keep as-is)
- `src/utils/HandTracker.ts` — gesture recognition logic
- `src/utils/SoundManager.ts` — audio
- `vite.config.ts`, `tsconfig.json`, `tailwind.config` — build config

### Modified
- `src/App.tsx` — add question input screen, language toggle, oracle panel, share button
- `src/components/TarotScene.tsx` — load real card images as textures instead of color planes

### New files
```
src/components/QuestionInput.tsx   — pre-draw question/concern input
src/components/OracleReading.tsx   — streaming reading display panel
src/components/ShareButton.tsx     — canvas-based share image generator
src/hooks/useTranslation.ts        — i18n hook
src/hooks/useClaude.ts             — Claude API streaming hook
src/i18n/zh.json                   — Chinese strings
src/i18n/en.json                   — English strings
public/cards/backs/                — card back images (5-8 files)
public/cards/fronts/               — 22 Major Arcana images
scripts/extract-cards.py           — PDF extraction script
.env.local                         — VITE_CLAUDE_API_KEY (gitignored)
```

---

## 11. Phased Delivery

### P1 — Local Demo (current scope)
- [x] All gesture interactions (from tarot-3d)
- [ ] Real RWS card face images
- [ ] Multiple card back images  
- [ ] User question input
- [ ] Claude streaming reading (oracle voice)
- [ ] Chinese/English toggle
- [ ] Share image download

### P2 — Polish & Deploy
- [ ] Express backend proxy for Claude (API key server-side)
- [ ] Vercel deployment
- [ ] AI voice narration (TTS)
- [ ] Follow-up chat with oracle
- [ ] Mobile touch gesture optimization

### P3 — Market Expansion
- [ ] WeChat Mini Program port
- [ ] More card spreads (5-card, Celtic Cross)
- [ ] Social sharing optimization (WeChat / Instagram)
- [ ] Usage analytics

---

## 12. Out of Scope (P1)

- User accounts / reading history
- Payment / monetization
- Backend database
- Mobile app packaging
- More than 22 cards (full 78-card deck deferred)
- Reversed card meanings
