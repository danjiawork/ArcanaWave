# ArcanaWave

> Draw your fate with a wave of your hand.

ArcanaWave is a browser-based tarot reading experience that combines 3D card rendering, real-time hand gesture control, and AI-powered oracle interpretation. Pick three cards from a fanned deck using nothing but your webcam, then receive a streaming reading from Claude or Gemini.

## Features

- **Gesture-controlled card selection** — fist to grab, open palm to fan the deck, swipe to reveal
- **3D tarot scene** — cards rendered in Three.js with smooth animations and a cosmic particle background
- **AI oracle** — streaming interpretation via Claude (Anthropic) or Gemini (Google), personalized to your question
- **Bilingual** — full Chinese / English UI, oracle responds in the language you write your question in
- **Save your reading** — export a shareable image of your three-card spread

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| 3D | Three.js + React Three Fiber + Drei |
| Gestures | MediaPipe Tasks Vision (runs in-browser, no server) |
| Animation | Framer Motion |
| AI | Anthropic Claude API or Google Gemini API |
| Build | Vite 6 |

## Getting Started

### Prerequisites

- Node.js 18+
- A webcam
- An [Anthropic API key](https://console.anthropic.com/) or [Google Gemini API key](https://aistudio.google.com/)

### Installation

```bash
git clone https://github.com/danjiawork/ArcanaWave.git
cd ArcanaWave
npm install
```

### Configuration

Copy the example env file and fill in your API key:

```bash
cp .env.example .env.local
```

```env
# Choose your AI provider: "claude" (default) or "gemini"
VITE_AI_PROVIDER=claude

# Anthropic (Claude)
VITE_CLAUDE_API_KEY=your_anthropic_api_key

# Google (Gemini) — only needed if using VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Card Images

Card images are not included in this repository — bring your own tarot deck. Place the 22 Major Arcana fronts in `public/cards/fronts/` and up to 8 card back designs in `public/cards/backs/`. The app renders gracefully if images are missing.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> The app requires camera access for hand tracking. All gesture processing runs locally in your browser via MediaPipe — no video is sent to any server.

## How to Use

1. **Enter your question** (optional — the more specific, the better the reading)
2. **Make a fist** ✊ to awaken the ritual
3. **Open your palm** 🤚 to fan out the deck
4. **Move your hand** left/right to browse cards
5. **Make a fist** to select a card — repeat until you have 3
6. **Swipe** to reveal your spread
7. The Oracle speaks — read your interpretation as it streams in

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check |

Also includes a utility script to extract card images from a PDF:

```bash
pip install pymupdf Pillow
python3 scripts/extract-cards.py path/to/your/tarot-deck.pdf
```
