# ArcanaWave P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing tarot-3d gesture demo into a polished, bilingual, AI-powered tarot reading experience with real card images, a cosmic 3D background, and shareable reading results.

**Architecture:** Layer new features on top of the existing React + R3F + MediaPipe foundation. The app flow is managed by a single state machine in `App.tsx` that progresses through landing → question → ceremony → fan → draw → reveal → oracle → share. AI readings use a provider-agnostic hook (`useOracle.ts`) that supports both Claude and Gemini via environment config. i18n is a lightweight custom hook with JSON string files. The 3D scene is split into `CosmicBackground` (always-on particles/rings) and `TarotScene` (card interactions).

**Tech Stack:** React 19, TypeScript, Vite 6, Three.js (R3F + drei), MediaPipe Tasks Vision, Anthropic SDK / @google/genai, Tailwind CSS 4, Framer Motion, Canvas API

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `src/i18n/zh.json` | Chinese UI strings |
| `src/i18n/en.json` | English UI strings |
| `src/hooks/useTranslation.ts` | i18n hook (localStorage-backed language state) |
| `src/hooks/useOracle.ts` | Provider-agnostic AI streaming hook (Claude/Gemini) |
| `src/components/CosmicBackground.tsx` | 3D starfield, orbital rings, shooting stars |
| `src/components/LandingScreen.tsx` | Landing page with branding and start button |
| `src/components/QuestionInput.tsx` | Pre-reading meditation/question modal |
| `src/components/OracleReading.tsx` | Streaming reading display with typewriter |
| `src/components/ShareButton.tsx` | Canvas-based share image generation |
| `src/components/LanguageToggle.tsx` | Language switcher (中/EN) |
| `src/components/GestureGuide.tsx` | First-time gesture overlay + stuck hint |
| `src/components/ProgressBadge.tsx` | "第X张/3张" progress indicator |
| `scripts/extract-cards.py` | PDF card extraction script |
| `.env.example` | Template for required env vars |
| `public/cards/backs/` | 5-8 card back PNG images |
| `public/cards/fronts/` | 22 Major Arcana PNG images |

### Existing files to modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Replace monolithic app with multi-screen state machine + new components |
| `src/components/TarotScene.tsx` | Load card textures, add carousel scroll, pending/confirm states |
| `src/index.css` | Add cosmic theme colors and animation keyframes |
| `src/utils/HandTracker.ts` | Add PINCH detection, palm position tracking, `getScrollDelta()` |
| `vite.config.ts` | Expose VITE_* env vars for AI provider config |
| `package.json` | Add `@anthropic-ai/sdk` dependency |

---

## Task 1: i18n Foundation

**Files:**
- Create: `src/i18n/zh.json`
- Create: `src/i18n/en.json`
- Create: `src/hooks/useTranslation.ts`

- [ ] **Step 1: Create Chinese string file**

```json
// src/i18n/zh.json
{
  "app.title": "ArcanaWave",
  "app.tagline": "挥手之间，命运已现",
  "landing.start": "✦ 开始占卜 ✦",
  "landing.camera_note": "需要摄像头权限进行手势识别，所有数据仅在本地处理。",
  "question.title": "✦ 开始之前 ✦",
  "question.body": "塔罗牌回应你内心的声音。\n闭上双眼，将你的问题放在心中。\n越具体，指引越清晰。",
  "question.examples": "我应该换工作吗？· 这段感情会走向何方？",
  "question.placeholder": "在此输入你的问题（可选，增强AI解读）",
  "question.ready": "🙏 我准备好了，开始仪式 ✦",
  "ceremony.init_camera": "正在初始化摄像头...",
  "ceremony.fist_prompt": "✊ 握拳唤醒仪式",
  "ceremony.deck_ready": "牌阵已就绪",
  "ceremony.open_palm": "🤚 张开手掌展开牌阵",
  "fan.guide": "← 平移手掌浏览 →",
  "fan.stuck_hint": "← 左右滑动手掌 →",
  "draw.progress": "第{current}张/3张",
  "draw.pending": "捏合确认选牌",
  "draw.cancel_hint": "张开手掌取消",
  "positions.past": "过去",
  "positions.present": "现在",
  "positions.future": "未来",
  "reveal.prompt": "挥手揭示命运",
  "oracle.title": "✦ 神谕降临",
  "oracle.loading": "正在聆听星辰...",
  "share.save": "保存解读",
  "share.again": "重新占卜",
  "share.branding": "ArcanaWave — 挥手之间，命运已现"
}
```

- [ ] **Step 2: Create English string file**

```json
// src/i18n/en.json
{
  "app.title": "ArcanaWave",
  "app.tagline": "Draw your fate with a wave of your hand",
  "landing.start": "✦ Begin Reading ✦",
  "landing.camera_note": "Camera required for gesture recognition. All data processed locally.",
  "question.title": "✦ Before we begin ✦",
  "question.body": "The cards respond to the voice within you.\nClose your eyes. Hold your question in your mind.\nThe more specific, the clearer the guidance.",
  "question.examples": "Should I change jobs? · Where is this relationship going?",
  "question.placeholder": "Type your question here (optional, enhances AI reading)",
  "question.ready": "🙏 I'm ready. Begin the ritual. ✦",
  "ceremony.init_camera": "Initializing camera...",
  "ceremony.fist_prompt": "✊ Make a fist to awaken the ritual",
  "ceremony.deck_ready": "The deck is ready",
  "ceremony.open_palm": "🤚 Open your palm to fan out the cards",
  "fan.guide": "← Slide palm left/right to browse →",
  "fan.stuck_hint": "← slide palm left/right →",
  "draw.progress": "Card {current}/3",
  "draw.pending": "Pinch to confirm",
  "draw.cancel_hint": "Open palm to cancel",
  "positions.past": "Past",
  "positions.present": "Present",
  "positions.future": "Future",
  "reveal.prompt": "Wave your hand to reveal your fate",
  "oracle.title": "✦ The Oracle Speaks",
  "oracle.loading": "Listening to the stars...",
  "share.save": "Save Reading",
  "share.again": "Read Again",
  "share.branding": "ArcanaWave — Draw your fate with a wave of your hand"
}
```

- [ ] **Step 3: Create useTranslation hook**

```typescript
// src/hooks/useTranslation.ts
import { useState, useCallback, useMemo } from "react";
import zh from "../i18n/zh.json";
import en from "../i18n/en.json";

export type Language = "zh" | "en";

const messages: Record<Language, Record<string, string>> = { zh, en };

function getInitialLanguage(): Language {
  const stored = localStorage.getItem("arcanawave-lang");
  if (stored === "zh" || stored === "en") return stored;
  return navigator.language.startsWith("zh") ? "zh" : "en";
}

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("arcanawave-lang", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = messages[lang][key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return { t, lang, setLang };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/I543305/sap/projects/AI-projects/tarot-3d && npx tsc --noEmit`
Expected: No errors related to i18n files (other existing errors OK)

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ src/hooks/useTranslation.ts
git commit -m "feat: add i18n foundation with zh/en strings and useTranslation hook"
```

---

## Task 2: Cosmic 3D Background

**Files:**
- Create: `src/components/CosmicBackground.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create CosmicBackground component**

```tsx
// src/components/CosmicBackground.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 600;
const SHOOTING_STAR_INTERVAL = 3000; // ms between shooting stars

export function CosmicBackground({ handX }: { handX?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const shootingRef = useRef<THREE.Mesh>(null);
  const shootingState = useRef({ active: false, time: 0, nextAt: 2000 });

  const starPositions = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, []);

  const starSizes = useMemo(() => {
    const sizes = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      sizes[i] = Math.random() * 0.08 + 0.02;
    }
    return sizes;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate entire starfield slowly (star chart effect)
    if (starsRef.current) {
      starsRef.current.rotation.z = t * 0.02;
      // Parallax based on hand position
      if (handX !== undefined) {
        starsRef.current.position.x = (handX - 0.5) * -0.5;
      }
    }

    // Rotate orbital rings
    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.1;
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.z = t * (0.05 + i * 0.03) * (i % 2 === 0 ? 1 : -1);
      });
    }

    // Shooting star logic
    const elapsed = t * 1000;
    const ss = shootingState.current;
    if (!ss.active && elapsed > ss.nextAt) {
      ss.active = true;
      ss.time = 0;
      if (shootingRef.current) {
        shootingRef.current.visible = true;
        shootingRef.current.position.set(
          (Math.random() - 0.5) * 15,
          Math.random() * 5 + 3,
          -2
        );
        const angle = Math.random() * 0.5 + 0.3;
        shootingRef.current.rotation.z = -angle;
      }
    }
    if (ss.active && shootingRef.current) {
      ss.time += 16;
      const progress = ss.time / 600;
      shootingRef.current.position.x += 0.3;
      shootingRef.current.position.y -= 0.15;
      shootingRef.current.scale.x = Math.max(0, 1 - progress);
      if (progress >= 1) {
        ss.active = false;
        ss.nextAt = elapsed + SHOOTING_STAR_INTERVAL + Math.random() * 2000;
        shootingRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Gold particle starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={STAR_COUNT}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#d4af37"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Orbital rings */}
      <group ref={ringsRef} position={[0, -3, -2]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[4, 0.015, 16, 100]} />
          <meshBasicMaterial
            color="#f472b6"
            transparent
            opacity={0.4}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
          <torusGeometry args={[5, 0.01, 16, 100]} />
          <meshBasicMaterial
            color="#d4af37"
            transparent
            opacity={0.3}
          />
        </mesh>
        <mesh rotation={[Math.PI / 4, -0.1, 0]}>
          <torusGeometry args={[3.5, 0.012, 16, 100]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.25}
          />
        </mesh>
      </group>

      {/* Shooting star */}
      <mesh ref={shootingRef} visible={false}>
        <planeGeometry args={[1.5, 0.02]} />
        <meshBasicMaterial
          color="#f0c878"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Depth fog effect via gradient plane */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#070714" transparent opacity={0.3} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Update index.css with cosmic theme variables**

Add to `src/index.css` after the existing `@theme` block:

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes typewriter-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

- [ ] **Step 3: Verify component renders without errors**

Run: `cd /Users/I543305/sap/projects/AI-projects/tarot-3d && npx tsc --noEmit`
Expected: No new type errors from CosmicBackground

- [ ] **Step 4: Commit**

```bash
git add src/components/CosmicBackground.tsx src/index.css
git commit -m "feat: add 3D cosmic background with starfield, orbital rings, shooting stars"
```

---

## Task 3: Enhanced HandTracker (PINCH + Palm Position + Scroll Delta)

**Files:**
- Modify: `src/utils/HandTracker.ts`

- [ ] **Step 1: Add new gesture types and palm tracking interface**

Update the `Gesture` type and add new exports at the top of `HandTracker.ts`:

```typescript
export type Gesture =
  | "OK"
  | "OPEN_HAND"
  | "ONE_FINGER"
  | "WAVE"
  | "FIST"
  | "PRAY"
  | "PINCH"
  | "PALM_LIFT"
  | "UNKNOWN";

export interface PalmState {
  x: number;        // 0-1 normalized horizontal position
  y: number;        // 0-1 normalized vertical position
  rotation: number; // wrist rotation in radians
  visible: boolean;
}
```

- [ ] **Step 2: Add palm tracking state and getScrollDelta method to the class**

Add these private fields after `private wristHistory`:

```typescript
  private palmState: PalmState = { x: 0.5, y: 0.5, rotation: 0, visible: false };
  private prevPalmX = 0.5;
  private prevRotation = 0;
  private palmYHistory: { y: number; time: number }[] = [];
```

Add public methods after `stopCamera()`:

```typescript
  getPalmState(): PalmState {
    return this.palmState;
  }

  getScrollDelta(): number {
    if (!this.palmState.visible) return 0;
    const xDelta = this.palmState.x - this.prevPalmX;
    const rotDelta = this.palmState.rotation - this.prevRotation;
    // Use whichever is larger (dual-mode browsing)
    return Math.abs(xDelta) > Math.abs(rotDelta * 0.3) ? xDelta : rotDelta * 0.3;
  }
```

- [ ] **Step 3: Update detectGesture to track palm state and detect PINCH / PALM_LIFT**

Inside `detectGesture()`, after `const landmarks = results.landmarks[0];` (line 89), add palm state tracking:

```typescript
      // Update palm state
      this.prevPalmX = this.palmState.x;
      this.prevRotation = this.palmState.rotation;
      this.palmState.x = landmarks[0].x;
      this.palmState.y = landmarks[0].y;
      this.palmState.visible = true;
      // Rotation: angle between wrist(0) and middle MCP(9) relative to vertical
      const dx = landmarks[9].x - landmarks[0].x;
      const dy = landmarks[9].y - landmarks[0].y;
      this.palmState.rotation = Math.atan2(dx, -dy);

      // Track vertical movement for PALM_LIFT detection
      const now2 = performance.now();
      this.palmYHistory.push({ y: landmarks[0].y, time: now2 });
      this.palmYHistory = this.palmYHistory.filter((h) => now2 - h.time < 500);
```

After the existing `isOkGesture` detection block but before the return statements, add PINCH and PALM_LIFT:

```typescript
      // PINCH Gesture: Thumb and Index tips close, middle/ring/pinky partially curled
      const isPinch = thumbIndexDist < 0.06 && !isMiddleUp && !isRingUp;

      // PALM_LIFT: Open hand moving upward rapidly
      let isPalmLift = false;
      if (fingersUpCount >= 3 && this.palmYHistory.length > 5) {
        const oldest = this.palmYHistory[0].y;
        const newest = this.palmYHistory[this.palmYHistory.length - 1].y;
        // In MediaPipe, y decreases going up
        if (oldest - newest > 0.08) {
          isPalmLift = true;
        }
      }
```

Update the return priority (before existing `if (isOkGesture)` block):

```typescript
      if (isPinch) {
        return "PINCH";
      } else if (isPalmLift) {
        return "PALM_LIFT";
      } else if (isOkGesture) {
```

- [ ] **Step 4: Reset palmState.visible when no hands detected**

At the end of `detectGesture()`, before the final `return "UNKNOWN"`, add:

```typescript
    this.palmState.visible = false;
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add src/utils/HandTracker.ts
git commit -m "feat: add PINCH/PALM_LIFT gestures, palm position tracking, getScrollDelta"
```

---

## Task 4: Card Asset Extraction Script

**Files:**
- Create: `scripts/extract-cards.py`

- [ ] **Step 1: Create the Python extraction script**

```python
#!/usr/bin/env python3
"""
Extract 22 Major Arcana card images from PocketTarotCards2023.pdf.
Cards are in a grid layout (multiple per page). This script uses pymupdf (fitz)
to render pages and crop individual cards.

Usage:
    pip install pymupdf Pillow
    python scripts/extract-cards.py /path/to/PocketTarotCards2023.pdf

Output: public/cards/fronts/00-the-fool.png through 21-the-world.png (400x640px)
"""

import sys
import os
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    print("Install pymupdf: pip install pymupdf")
    sys.exit(1)

from PIL import Image
import io

CARD_NAMES = [
    "00-the-fool", "01-the-magician", "02-the-high-priestess",
    "03-the-empress", "04-the-emperor", "05-the-hierophant",
    "06-the-lovers", "07-the-chariot", "08-strength",
    "09-the-hermit", "10-wheel-of-fortune", "11-justice",
    "12-the-hanged-man", "13-death", "14-temperance",
    "15-the-devil", "16-the-tower", "17-the-star",
    "18-the-moon", "19-the-sun", "20-judgement", "21-the-world"
]

TARGET_WIDTH = 400
TARGET_HEIGHT = 640

def extract_cards(pdf_path: str, output_dir: str):
    """
    Extract cards from PDF. The PDF has cards in a grid layout.
    Renders each page at high DPI then uses image detection to find card boundaries.
    Fallback: manual grid crop if detection fails.
    """
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)

    card_index = 0
    cards_per_page = 8  # typical for pocket tarot PDFs

    for page_num in range(len(doc)):
        if card_index >= 22:
            break

        page = doc[page_num]
        # Render at 3x for quality
        mat = fitz.Matrix(3, 3)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))

        pw, ph = img.size
        # Assume 2 columns x 4 rows grid
        cols, rows = 2, 4
        card_w = pw // cols
        card_h = ph // rows

        for row in range(rows):
            for col in range(cols):
                if card_index >= 22:
                    break
                x1 = col * card_w
                y1 = row * card_h
                x2 = x1 + card_w
                y2 = y1 + card_h

                card_img = img.crop((x1, y1, x2, y2))
                # Resize to target dimensions
                card_img = card_img.resize(
                    (TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS
                )

                filename = f"{CARD_NAMES[card_index]}.png"
                card_img.save(os.path.join(output_dir, filename))
                print(f"  Extracted: {filename}")
                card_index += 1

    doc.close()
    print(f"\nDone! Extracted {card_index} cards to {output_dir}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <path-to-pdf>")
        print(f"Output goes to: public/cards/fronts/")
        sys.exit(1)

    pdf_path = sys.argv[1]
    project_root = Path(__file__).parent.parent
    output_dir = project_root / "public" / "cards" / "fronts"

    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)

    extract_cards(pdf_path, str(output_dir))
```

- [ ] **Step 2: Create placeholder card directories**

```bash
mkdir -p public/cards/fronts public/cards/backs
```

- [ ] **Step 3: Create a simple placeholder generator for development**

If real card images aren't available yet, generate colored placeholder PNGs so the app can run:

```bash
# Only needed if real images not yet extracted
# Create a simple script that generates placeholder cards for dev
cat > scripts/generate-placeholders.sh << 'SCRIPT'
#!/bin/bash
# Generates 400x640 placeholder PNGs for development
# Requires ImageMagick (brew install imagemagick)
FRONTS_DIR="public/cards/fronts"
BACKS_DIR="public/cards/backs"
mkdir -p "$FRONTS_DIR" "$BACKS_DIR"

NAMES=("00-the-fool" "01-the-magician" "02-the-high-priestess" "03-the-empress" "04-the-emperor" "05-the-hierophant" "06-the-lovers" "07-the-chariot" "08-strength" "09-the-hermit" "10-wheel-of-fortune" "11-justice" "12-the-hanged-man" "13-death" "14-temperance" "15-the-devil" "16-the-tower" "17-the-star" "18-the-moon" "19-the-sun" "20-judgement" "21-the-world")

for i in "${!NAMES[@]}"; do
  HUE=$((i * 16))
  convert -size 400x640 "xc:hsl($HUE,40%,25%)" \
    -gravity center -font Helvetica -pointsize 24 -fill "#d4af37" \
    -annotate 0 "${NAMES[$i]}" \
    "$FRONTS_DIR/${NAMES[$i]}.png"
done

for i in $(seq 1 6); do
  HUE=$((i * 50 + 20))
  convert -size 400x640 "xc:hsl($HUE,30%,15%)" \
    -gravity center -font Helvetica -pointsize 36 -fill "#d4af37" \
    -annotate 0 "✦" \
    "$BACKS_DIR/back-$i.png"
done

echo "Generated ${#NAMES[@]} front + 6 back placeholders"
SCRIPT
chmod +x scripts/generate-placeholders.sh
```

- [ ] **Step 4: Commit**

```bash
git add scripts/ public/cards/
git commit -m "feat: add card extraction script and placeholder generator"
```

---

## Task 5: TarotScene with Real Textures and Carousel Scroll

**Files:**
- Modify: `src/components/TarotScene.tsx`

- [ ] **Step 1: Update SceneState to include new states**

Replace the `SceneState` type at the top:

```typescript
export type SceneState =
  | "IDLE"
  | "FAN"
  | "PENDING"
  | "DRAWING"
  | "WAITING_REVEAL"
  | "REVEAL";
```

- [ ] **Step 2: Update TarotSceneProps to accept textures and scroll**

```typescript
interface TarotSceneProps {
  state: SceneState;
  drawnCards: number[];
  pendingCard: number | null;
  scrollOffset: number;  // -1 to 1, drives carousel position
  onCardDrawn: (index: number) => void;
  tarotDeck: { name: string; meaning: string; nameEn: string }[];
  isResetting: boolean;
  cardFronts: THREE.Texture[];
  cardBacks: THREE.Texture[];
}
```

- [ ] **Step 3: Implement texture-based card rendering**

Replace the card mesh section inside the `.map()` loop. Key changes:
- Use `cardBacks[i % cardBacks.length]` for back face texture
- Use `cardFronts[i]` for front face texture
- Use `scrollOffset` to rotate the fan (multiply by total fan angle range)
- Highlight center card based on scroll position
- Show `pendingCard` in elevated/glowing state

```tsx
{cards.map((card, i) => {
  const isDrawn = drawnCards.includes(card.id);
  const isPending = pendingCard === card.id;
  const backTexture = cardBacks[i % cardBacks.length];
  const frontTexture = cardFronts[i];

  return (
    <group
      key={card.id}
      ref={(el) => (cardsRef.current[i] = el as THREE.Group)}
    >
      {/* Back of card */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        {backTexture ? (
          <meshStandardMaterial
            map={backTexture}
            side={THREE.FrontSide}
          />
        ) : (
          <meshStandardMaterial color="#0f0c29" side={THREE.FrontSide} />
        )}
        {/* Position label for drawn cards */}
        {isDrawn && state !== "REVEAL" && (
          <Text
            position={[0, -CARD_HEIGHT / 2 - 0.2, 0.01]}
            fontSize={0.15}
            color="#d4af37"
            anchorX="center"
          >
            {["过去", "现在", "未来"][drawnCards.indexOf(card.id)]}
          </Text>
        )}
      </mesh>

      {/* Front of card (visible after reveal) */}
      <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        {frontTexture ? (
          <meshStandardMaterial
            map={frontTexture}
            side={THREE.FrontSide}
          />
        ) : (
          <meshStandardMaterial color={card.color} side={THREE.FrontSide} />
        )}
      </mesh>

      {/* Glow ring for pending card */}
      {isPending && (
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Particles for drawn cards */}
      {isDrawn && state !== "REVEAL" && (
        <CardParticles cardColor={new THREE.Color("#d4af37")} />
      )}
    </group>
  );
})}
```

- [ ] **Step 4: Update targetPositions logic for carousel scroll**

In the FAN state calculation, use `scrollOffset` to shift which card is centered:

```typescript
} else if (state === "FAN" || state === "DRAWING" || state === "PENDING") {
  const spreadAngle = Math.PI * 0.6;
  const angleStep = spreadAngle / (TOTAL_CARDS - 1);
  const startAngle = Math.PI / 2 + spreadAngle / 2;
  // Scroll shifts the fan by rotating which cards are visible
  const scrollShift = scrollOffset * spreadAngle * 0.4;

  cards.forEach((card, i) => {
    const isDrawn = drawnCards.includes(card.id);
    const drawnIndex = drawnCards.indexOf(card.id);
    const isPending = pendingCard === card.id;

    if (isDrawn) {
      const xOffset = (drawnIndex - 1) * 2;
      targetPositions.current[i].set(xOffset, 3, 2 + drawnIndex * 0.1);
      targetRotations.current[i].set(0, 0, 0);
      targetScales.current[i].set(0.8, 0.8, 0.8);
    } else if (isPending) {
      // Pending card rises up and enlarges
      targetPositions.current[i].set(0, 0.5, 3);
      targetRotations.current[i].set(0, 0, 0);
      targetScales.current[i].set(1.5, 1.5, 1.5);
    } else {
      const angle = startAngle - i * angleStep + scrollShift;
      const radius = 5.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius - radius - 2.5;
      targetPositions.current[i].set(x, y, i * 0.01);
      targetRotations.current[i].set(0, 0, angle - Math.PI / 2);
      targetScales.current[i].set(0.9, 0.9, 0.9);
    }
  });
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: Errors about changed props in App.tsx are expected (fixed in Task 7)

- [ ] **Step 6: Commit**

```bash
git add src/components/TarotScene.tsx
git commit -m "feat: TarotScene with texture loading, carousel scroll, pending state"
```

---

## Task 6: useOracle Hook (Claude + Gemini Streaming)

**Files:**
- Create: `src/hooks/useOracle.ts`
- Modify: `vite.config.ts`
- Create: `.env.example`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Update vite.config.ts to expose env vars**

Replace the `define` block:

```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.VITE_AI_PROVIDER': JSON.stringify(env.VITE_AI_PROVIDER),
},
```

Note: Vite automatically exposes `VITE_*` vars via `import.meta.env`, so Claude and Gemini API keys with `VITE_` prefix are available without explicit `define`. The `GEMINI_API_KEY` define remains for backward compat.

- [ ] **Step 3: Create .env.example**

```bash
# .env.example
VITE_AI_PROVIDER=claude          # "claude" or "gemini"
VITE_CLAUDE_API_KEY=sk-ant-...   # Anthropic API key
VITE_GEMINI_API_KEY=AIza...      # Google Gemini API key (alternative)
```

- [ ] **Step 4: Create useOracle hook**

```typescript
// src/hooks/useOracle.ts
import { useState, useCallback, useRef } from "react";
import type { Language } from "./useTranslation";

interface OracleRequest {
  cards: { name: string; meaning: string; position: string }[];
  question: string;
  language: Language;
}

interface OracleState {
  text: string;
  isStreaming: boolean;
  error: string | null;
}

const SYSTEM_PROMPT = `You are The Oracle — an ancient, compassionate witness to fate. You do not predict the future with certainty; you illuminate the present moment.

Speak in first person as The Oracle. Your voice is poetic but not obscure, warm but not sycophantic, honest without cruelty.

Guidelines:
- Begin with an atmospheric opening that acknowledges the seeker's energy
- Address each card (past/present/future) in sequence, 2-3 sentences each
- Weave the three cards into a unified narrative
- End with one clear, actionable insight
- Total length: 180-250 words
- If user provided a question/concern, make the reading specific to it
- Never say "as an AI" or break character
- Language: match the user's language (Chinese or English)`;

function buildUserMessage(req: OracleRequest): string {
  const cardLines = req.cards
    .map((c) => `- ${c.position}: ${c.name} (${c.meaning})`)
    .join("\n");
  return `Cards drawn:\n${cardLines}\n\nUser's question/concern: ${req.question || "general guidance"}\nLanguage: ${req.language}`;
}

async function streamClaude(
  req: OracleRequest,
  onChunk: (text: string) => void,
  abortSignal: AbortSignal
): Promise<void> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) throw new Error("VITE_CLAUDE_API_KEY not set in .env.local");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildUserMessage(req) }],
      stream: true,
    }),
    signal: abortSignal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const event = JSON.parse(data);
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta"
          ) {
            onChunk(event.delta.text);
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }
}

async function streamGemini(
  req: OracleRequest,
  onChunk: (text: string) => void,
  abortSignal: AbortSignal
): Promise<void> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not set in .env.local");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: [{ role: "user", parts: [{ text: buildUserMessage(req) }] }],
  });

  for await (const chunk of response) {
    if (abortSignal.aborted) break;
    const text = chunk.text;
    if (text) onChunk(text);
  }
}

export function useOracle() {
  const [state, setState] = useState<OracleState>({
    text: "",
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startReading = useCallback(async (req: OracleRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ text: "", isStreaming: true, error: null });

    const provider = import.meta.env.VITE_AI_PROVIDER || "claude";
    const streamFn = provider === "gemini" ? streamGemini : streamClaude;

    try {
      let accumulated = "";
      await streamFn(
        req,
        (chunk) => {
          accumulated += chunk;
          setState((prev) => ({
            ...prev,
            text: accumulated,
          }));
        },
        controller.signal
      );
      setState((prev) => ({ ...prev, isStreaming: false }));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
        }));
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return { ...state, startReading, cancel };
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors in useOracle.ts

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useOracle.ts .env.example vite.config.ts package.json package-lock.json
git commit -m "feat: add useOracle hook with Claude/Gemini streaming support"
```

---

## Task 7: UI Components (Landing, Question, Oracle, Share, LanguageToggle, Progress, Guide)

**Files:**
- Create: `src/components/LandingScreen.tsx`
- Create: `src/components/QuestionInput.tsx`
- Create: `src/components/OracleReading.tsx`
- Create: `src/components/ShareButton.tsx`
- Create: `src/components/LanguageToggle.tsx`
- Create: `src/components/ProgressBadge.tsx`
- Create: `src/components/GestureGuide.tsx`

- [ ] **Step 1: Create LanguageToggle**

```tsx
// src/components/LanguageToggle.tsx
import type { Language } from "../hooks/useTranslation";

interface Props {
  lang: Language;
  onToggle: (l: Language) => void;
}

export function LanguageToggle({ lang, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(lang === "zh" ? "en" : "zh")}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full border border-amber-500/40 bg-black/50 backdrop-blur-sm text-amber-200 text-sm font-medium hover:bg-amber-900/30 transition-colors"
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
```

- [ ] **Step 2: Create LandingScreen**

```tsx
// src/components/LandingScreen.tsx
import { motion } from "framer-motion";

interface Props {
  t: (key: string) => string;
  onStart: () => void;
}

export function LandingScreen({ t, onStart }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-5xl md:text-7xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-4"
      >
        {t("app.title")}
      </motion.h1>

      <motion.p
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-lg md:text-xl text-amber-100/80 tracking-wider mb-12"
      >
        {t("app.tagline")}
      </motion.p>

      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="px-10 py-5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full text-xl md:text-2xl font-medium tracking-widest shadow-[0_0_30px_rgba(217,119,6,0.4)] border border-amber-300/30 text-white"
      >
        {t("landing.start")}
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-6 text-xs text-amber-100/50 text-center max-w-sm"
      >
        {t("landing.camera_note")}
      </motion.p>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create QuestionInput**

```tsx
// src/components/QuestionInput.tsx
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  t: (key: string) => string;
  onReady: (question: string) => void;
}

export function QuestionInput({ t, onReady }: Props) {
  const [question, setQuestion] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
      >
        <h2 className="text-2xl text-amber-200 font-bold text-center mb-4 tracking-wider">
          {t("question.title")}
        </h2>

        <p className="text-amber-100/80 text-center whitespace-pre-line leading-relaxed mb-4">
          {t("question.body")}
        </p>

        <p className="text-amber-100/50 text-sm text-center mb-6">
          {t("question.examples")}
        </p>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("question.placeholder")}
          className="w-full bg-black/50 border border-amber-500/20 rounded-xl p-4 text-amber-100 placeholder-amber-100/30 focus:outline-none focus:border-amber-500/50 resize-none h-24 mb-6"
        />

        <button
          onClick={() => onReady(question)}
          className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full text-lg font-medium tracking-wider text-white hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg"
        >
          {t("question.ready")}
        </button>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Create OracleReading**

```tsx
// src/components/OracleReading.tsx
import { motion } from "framer-motion";

interface Props {
  t: (key: string) => string;
  text: string;
  isStreaming: boolean;
  error: string | null;
  cards: { name: string; position: string }[];
  onRestart: () => void;
}

export function OracleReading({
  t,
  text,
  isStreaming,
  error,
  cards,
  onRestart,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center px-4 py-8 overflow-y-auto"
    >
      <div className="bg-black/85 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
        {/* Card summary */}
        <div className="flex justify-center gap-4 mb-6">
          {cards.map((card, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-amber-400 mb-1">{card.position}</div>
              <div className="text-sm text-amber-100 font-medium max-w-[100px] truncate">
                {card.name}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-amber-500/20 pt-4">
          <h3 className="text-xl text-amber-300 font-bold mb-4 tracking-wider">
            {t("oracle.title")}
          </h3>

          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : text ? (
            <p className="text-amber-100/90 leading-relaxed whitespace-pre-wrap">
              {text}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-[typewriter-cursor_1s_infinite]" />
              )}
            </p>
          ) : (
            <p className="text-amber-100/50 animate-pulse">
              {t("oracle.loading")}
            </p>
          )}
        </div>

        {!isStreaming && text && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-amber-500/20">
            <ShareButtonInline t={t} />
            <button
              onClick={onRestart}
              className="flex-1 py-3 rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 transition-colors"
            >
              {t("share.again")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ShareButtonInline({ t }: { t: (key: string) => string }) {
  // Placeholder — actual share logic in ShareButton component
  return (
    <button
      className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium"
      id="share-trigger"
    >
      {t("share.save")}
    </button>
  );
}
```

- [ ] **Step 5: Create ShareButton**

```tsx
// src/components/ShareButton.tsx
import { useCallback } from "react";

interface Props {
  cards: { name: string; position: string }[];
  oracleText: string;
  branding: string;
}

export function useShareImage() {
  const generateImage = useCallback(
    async ({ cards, oracleText, branding }: Props): Promise<Blob | null> => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, "#070714");
      gradient.addColorStop(0.5, "#1a1540");
      gradient.addColorStop(1, "#070714");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Stars
      ctx.fillStyle = "#d4af37";
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1080;
        const y = Math.random() * 1920;
        const r = Math.random() * 2;
        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Title
      ctx.font = "bold 64px serif";
      ctx.fillStyle = "#d4af37";
      ctx.textAlign = "center";
      ctx.fillText("ArcanaWave", 540, 200);

      // Card positions
      const cardY = 400;
      cards.forEach((card, i) => {
        const x = 200 + i * 340;
        ctx.font = "bold 28px serif";
        ctx.fillStyle = "#d4af37";
        ctx.fillText(card.position, x, cardY);
        ctx.font = "24px serif";
        ctx.fillStyle = "#fef3c7";
        ctx.fillText(card.name, x, cardY + 40);
      });

      // Oracle text (first 100 chars)
      const excerpt = oracleText.slice(0, 150) + (oracleText.length > 150 ? "..." : "");
      ctx.font = "italic 32px serif";
      ctx.fillStyle = "#fef3c7";
      ctx.textAlign = "center";
      const lines = wrapText(ctx, `"${excerpt}"`, 900);
      lines.forEach((line, i) => {
        ctx.fillText(line, 540, 700 + i * 50);
      });

      // Branding
      ctx.font = "20px serif";
      ctx.fillStyle = "#78716c";
      ctx.fillText(branding, 540, 1820);

      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    },
    []
  );

  const download = useCallback(async (props: Props) => {
    const blob = await generateImage(props);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arcanawave-reading-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateImage]);

  return { download };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split("");
  const lines: string[] = [];
  let current = "";

  for (const char of words) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 6);
}
```

- [ ] **Step 6: Create ProgressBadge**

```tsx
// src/components/ProgressBadge.tsx
interface Props {
  current: number;
  total: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function ProgressBadge({ current, total, t }: Props) {
  return (
    <div className="fixed top-4 left-4 z-40 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-amber-500/30 text-amber-200 text-sm font-medium">
      {t("draw.progress", { current: Math.min(current + 1, total) })}
    </div>
  );
}
```

- [ ] **Step 7: Create GestureGuide**

```tsx
// src/components/GestureGuide.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  text: string;
  isFirstTime?: boolean;
}

export function GestureGuide({ show, text, isFirstTime }: Props) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      if (isFirstTime) {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [show, isFirstTime]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-200 text-base"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/LandingScreen.tsx src/components/QuestionInput.tsx src/components/OracleReading.tsx src/components/ShareButton.tsx src/components/LanguageToggle.tsx src/components/ProgressBadge.tsx src/components/GestureGuide.tsx
git commit -m "feat: add all UI components (landing, question, oracle, share, i18n toggle, progress, guide)"
```

---

## Task 8: Rewrite App.tsx (State Machine + Full Flow Integration)

**Files:**
- Modify: `src/App.tsx`

This is the largest task. Replace the entire `App.tsx` with the new multi-screen state machine that integrates all components.

- [ ] **Step 1: Define the new app state machine**

The app phases are:

```
LANDING → QUESTION → CEREMONY_INIT → CEREMONY_FIST → CEREMONY_PALM →
FAN → (scroll/pending/draw ×3) → WAITING_REVEAL → REVEAL → ORACLE → (restart)
```

- [ ] **Step 2: Rewrite App.tsx**

```tsx
// src/App.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, useTexture } from "@react-three/drei";
import { AnimatePresence } from "framer-motion";
import * as THREE from "three";

import { HandTracker, Gesture } from "./utils/HandTracker";
import { TarotScene, SceneState } from "./components/TarotScene";
import { CosmicBackground } from "./components/CosmicBackground";
import { LandingScreen } from "./components/LandingScreen";
import { QuestionInput } from "./components/QuestionInput";
import { OracleReading } from "./components/OracleReading";
import { LanguageToggle } from "./components/LanguageToggle";
import { ProgressBadge } from "./components/ProgressBadge";
import { GestureGuide } from "./components/GestureGuide";
import { useTranslation } from "./hooks/useTranslation";
import { useOracle } from "./hooks/useOracle";
import { useShareImage } from "./components/ShareButton";
import { soundManager } from "./utils/SoundManager";

type AppPhase =
  | "LANDING"
  | "QUESTION"
  | "CEREMONY_INIT"
  | "CEREMONY_FIST"
  | "CEREMONY_PALM"
  | "FAN"
  | "PENDING"
  | "WAITING_REVEAL"
  | "REVEAL"
  | "ORACLE";

const TAROT_DECK = [
  { name: "愚者", nameEn: "The Fool", meaning: "新的开始、冒险、天真", meaningEn: "New beginnings, adventure, innocence" },
  { name: "魔术师", nameEn: "The Magician", meaning: "创造力、显化、意志力", meaningEn: "Creativity, manifestation, willpower" },
  { name: "女祭司", nameEn: "The High Priestess", meaning: "直觉、潜意识、神秘", meaningEn: "Intuition, subconscious, mystery" },
  { name: "女皇", nameEn: "The Empress", meaning: "丰饶、母性、自然", meaningEn: "Abundance, motherhood, nature" },
  { name: "皇帝", nameEn: "The Emperor", meaning: "权威、结构、控制", meaningEn: "Authority, structure, control" },
  { name: "教皇", nameEn: "The Hierophant", meaning: "传统、信仰、教育", meaningEn: "Tradition, faith, education" },
  { name: "恋人", nameEn: "The Lovers", meaning: "爱情、和谐、选择", meaningEn: "Love, harmony, choices" },
  { name: "战车", nameEn: "The Chariot", meaning: "意志、胜利、决心", meaningEn: "Willpower, victory, determination" },
  { name: "力量", nameEn: "Strength", meaning: "勇气、耐心、同情心", meaningEn: "Courage, patience, compassion" },
  { name: "隐士", nameEn: "The Hermit", meaning: "内省、孤独、指引", meaningEn: "Introspection, solitude, guidance" },
  { name: "命运之轮", nameEn: "Wheel of Fortune", meaning: "变化、命运、转折点", meaningEn: "Change, destiny, turning point" },
  { name: "正义", nameEn: "Justice", meaning: "公平、真理、因果", meaningEn: "Fairness, truth, karma" },
  { name: "倒吊人", nameEn: "The Hanged Man", meaning: "牺牲、新视角、放手", meaningEn: "Sacrifice, new perspective, letting go" },
  { name: "死神", nameEn: "Death", meaning: "结束、转变、新生", meaningEn: "Endings, transformation, rebirth" },
  { name: "节制", nameEn: "Temperance", meaning: "平衡、中庸、耐心", meaningEn: "Balance, moderation, patience" },
  { name: "恶魔", nameEn: "The Devil", meaning: "束缚、物质主义、诱惑", meaningEn: "Bondage, materialism, temptation" },
  { name: "高塔", nameEn: "The Tower", meaning: "突变、混乱、觉醒", meaningEn: "Upheaval, chaos, awakening" },
  { name: "星星", nameEn: "The Star", meaning: "希望、灵感、宁静", meaningEn: "Hope, inspiration, serenity" },
  { name: "月亮", nameEn: "The Moon", meaning: "幻觉、恐惧、潜意识", meaningEn: "Illusion, fear, subconscious" },
  { name: "太阳", nameEn: "The Sun", meaning: "快乐、成功、活力", meaningEn: "Joy, success, vitality" },
  { name: "审判", nameEn: "Judgement", meaning: "重生、内在召唤、觉醒", meaningEn: "Rebirth, inner calling, awakening" },
  { name: "世界", nameEn: "The World", meaning: "完成、整合、成就", meaningEn: "Completion, integration, achievement" },
];

const POSITIONS = ["past", "present", "future"] as const;

export default function App() {
  const { t, lang, setLang } = useTranslation();
  const oracle = useOracle();
  const { download: downloadShareImage } = useShareImage();

  const [phase, setPhase] = useState<AppPhase>("LANDING");
  const [userQuestion, setUserQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<number[]>([]);
  const [pendingCard, setPendingCard] = useState<number | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<Gesture>("UNKNOWN");
  const [instruction, setInstruction] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [isFirstFan, setIsFirstFan] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const requestRef = useRef<number>(0);
  const lastGestureRef = useRef<Gesture>("UNKNOWN");
  const gestureHoldTimeRef = useRef<number>(0);
  const stuckTimerRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);

  // Refs for animation loop access
  const phaseRef = useRef(phase);
  const drawnCardsRef = useRef(drawnCards);
  const pendingCardRef = useRef(pendingCard);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { drawnCardsRef.current = drawnCards; }, [drawnCards]);
  useEffect(() => { pendingCardRef.current = pendingCard; }, [pendingCard]);

  // Map AppPhase to SceneState for TarotScene
  const sceneState: SceneState = useMemo(() => {
    switch (phase) {
      case "LANDING":
      case "QUESTION":
      case "CEREMONY_INIT":
      case "CEREMONY_FIST":
      case "CEREMONY_PALM":
        return "IDLE";
      case "FAN":
        return "FAN";
      case "PENDING":
        return "PENDING";
      case "WAITING_REVEAL":
        return "WAITING_REVEAL";
      case "REVEAL":
      case "ORACLE":
        return "REVEAL";
      default:
        return "IDLE";
    }
  }, [phase]);

  const handleStart = () => {
    soundManager.init();
    setPhase("QUESTION");
  };

  const handleQuestionReady = async (question: string) => {
    setUserQuestion(question);
    setPhase("CEREMONY_INIT");
    setInstruction(t("ceremony.init_camera"));

    const tracker = new HandTracker();
    await tracker.init();
    if (videoRef.current) {
      await tracker.startCamera(videoRef.current);
      trackerRef.current = tracker;
      setPhase("CEREMONY_FIST");
      setInstruction(t("ceremony.fist_prompt"));
      startDetectionLoop(tracker);
    }
  };

  const startDetectionLoop = (tracker: HandTracker) => {
    const detectLoop = () => {
      const gesture = tracker.detectGesture();
      setCurrentGesture(gesture);

      // Continuous scroll tracking (no debounce needed)
      if (phaseRef.current === "FAN") {
        const delta = tracker.getScrollDelta();
        if (Math.abs(delta) > 0.002) {
          setScrollOffset((prev) => Math.max(-1, Math.min(1, prev + delta * 2)));
          lastScrollTimeRef.current = performance.now();
          stuckTimerRef.current = 0;
        } else {
          stuckTimerRef.current += 16;
          if (stuckTimerRef.current > 5000) {
            setShowGuide(true);
            stuckTimerRef.current = 0;
          }
        }
      }

      // Debounced gesture actions
      if (gesture === lastGestureRef.current && gesture !== "UNKNOWN") {
        gestureHoldTimeRef.current += 16;
      } else {
        gestureHoldTimeRef.current = 0;
        lastGestureRef.current = gesture;
      }

      if (gestureHoldTimeRef.current > 300) {
        handleGesture(gesture);
        gestureHoldTimeRef.current = 0;
      }

      requestRef.current = requestAnimationFrame(detectLoop);
    };
    requestRef.current = requestAnimationFrame(detectLoop);
  };

  const handleGesture = (gesture: Gesture) => {
    const currentPhase = phaseRef.current;

    switch (currentPhase) {
      case "CEREMONY_FIST":
        if (gesture === "FIST") {
          soundManager.playFan();
          setPhase("CEREMONY_PALM");
          setInstruction(t("ceremony.open_palm"));
        }
        break;

      case "CEREMONY_PALM":
        if (gesture === "OPEN_HAND") {
          soundManager.playFan();
          setPhase("FAN");
          setInstruction(t("fan.guide"));
          if (isFirstFan) {
            setShowGuide(true);
            setIsFirstFan(false);
            localStorage.setItem("arcanawave-guide-shown", "1");
            setTimeout(() => setShowGuide(false), 3000);
          }
        }
        break;

      case "FAN":
        if (gesture === "PALM_LIFT") {
          // Find the center card based on scrollOffset
          const centerIndex = Math.round((scrollOffset + 1) * 10.5);
          const cardIndex = Math.max(0, Math.min(21, centerIndex));
          if (!drawnCardsRef.current.includes(cardIndex)) {
            setPendingCard(cardIndex);
            setPhase("PENDING");
            setInstruction(t("draw.pending"));
          }
        }
        break;

      case "PENDING":
        if (gesture === "PINCH" && pendingCardRef.current !== null) {
          soundManager.playDraw();
          const newDrawn = [...drawnCardsRef.current, pendingCardRef.current];
          setDrawnCards(newDrawn);
          setPendingCard(null);

          if (newDrawn.length >= 3) {
            setPhase("WAITING_REVEAL");
            setInstruction(t("reveal.prompt"));
          } else {
            // Auto re-fan after 1s celebration
            setPhase("FAN");
            setInstruction(t("fan.guide"));
          }
        } else if (gesture === "OPEN_HAND") {
          setPendingCard(null);
          setPhase("FAN");
          setInstruction(t("fan.guide"));
        }
        break;

      case "WAITING_REVEAL":
        if (gesture === "WAVE") {
          soundManager.playReveal();
          setPhase("REVEAL");
          // Trigger oracle reading
          setTimeout(() => {
            setPhase("ORACLE");
            const positions = [
              t("positions.past"),
              t("positions.present"),
              t("positions.future"),
            ];
            oracle.startReading({
              cards: drawnCardsRef.current.map((id, i) => ({
                name: lang === "zh" ? TAROT_DECK[id].name : TAROT_DECK[id].nameEn,
                meaning: lang === "zh" ? TAROT_DECK[id].meaning : TAROT_DECK[id].meaningEn,
                position: positions[i],
              })),
              question: userQuestion,
              language: lang,
            });
          }, 2000);
        }
        break;

      case "ORACLE":
        if (gesture === "FIST") {
          handleRestart();
        }
        break;
    }
  };

  const handleRestart = () => {
    oracle.cancel();
    setPhase("QUESTION");
    setDrawnCards([]);
    setPendingCard(null);
    setScrollOffset(0);
    setUserQuestion("");
    setInstruction("");
  };

  const handleShare = () => {
    const positions = [
      t("positions.past"),
      t("positions.present"),
      t("positions.future"),
    ];
    downloadShareImage({
      cards: drawnCards.map((id, i) => ({
        name: lang === "zh" ? TAROT_DECK[id].name : TAROT_DECK[id].nameEn,
        position: positions[i],
      })),
      oracleText: oracle.text,
      branding: t("share.branding"),
    });
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (trackerRef.current) trackerRef.current.stopCamera();
    };
  }, []);

  // Check if first-time guide was already shown
  useEffect(() => {
    if (localStorage.getItem("arcanawave-guide-shown")) {
      setIsFirstFan(false);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-[#070714] text-amber-50 overflow-hidden relative font-serif">
      {/* 3D Canvas — always present */}
      <div className="fixed inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} color="#fef08a" />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#c084fc" />
          <CosmicBackground
            handX={trackerRef.current?.getPalmState().x}
          />
          {phase !== "LANDING" && phase !== "QUESTION" && (
            <TarotScene
              state={sceneState}
              drawnCards={drawnCards}
              pendingCard={pendingCard}
              scrollOffset={scrollOffset}
              onCardDrawn={() => {}}
              tarotDeck={TAROT_DECK}
              isResetting={false}
              cardFronts={[]}
              cardBacks={[]}
            />
          )}
        </Canvas>
      </div>

      {/* UI Layers */}
      <LanguageToggle lang={lang} onToggle={setLang} />

      <AnimatePresence mode="wait">
        {phase === "LANDING" && (
          <LandingScreen t={t} onStart={handleStart} />
        )}

        {phase === "QUESTION" && (
          <QuestionInput t={t} onReady={handleQuestionReady} />
        )}

        {phase === "ORACLE" && (
          <OracleReading
            t={t}
            text={oracle.text}
            isStreaming={oracle.isStreaming}
            error={oracle.error}
            cards={drawnCards.map((id, i) => ({
              name: lang === "zh" ? TAROT_DECK[id].name : TAROT_DECK[id].nameEn,
              position: [t("positions.past"), t("positions.present"), t("positions.future")][i],
            }))}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>

      {/* Progress badge during drawing */}
      {(phase === "FAN" || phase === "PENDING") && (
        <ProgressBadge current={drawnCards.length} total={3} t={t} />
      )}

      {/* Ceremony / Fan instructions */}
      {["CEREMONY_FIST", "CEREMONY_PALM", "FAN", "PENDING", "WAITING_REVEAL"].includes(phase) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-center">
          <div className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-sm border border-amber-500/30 text-amber-200 text-lg">
            {instruction}
          </div>
        </div>
      )}

      {/* Gesture guide overlay */}
      <GestureGuide
        show={showGuide && phase === "FAN"}
        text={t("fan.stuck_hint")}
        isFirstTime={isFirstFan}
      />

      {/* Hidden video element */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: May have warnings about texture arrays being empty — acceptable for now (textures loaded in Task 9)

- [ ] **Step 4: Run dev server and verify basic flow**

Run: `npm run dev`
Expected: App loads on `localhost:3000`, shows landing screen with cosmic background, language toggle works, clicking start shows question modal. Camera/gesture flow works if webcam available.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: rewrite App.tsx with full ceremony flow state machine"
```

---

## Task 9: Card Texture Loading

**Files:**
- Modify: `src/App.tsx` (add texture loading logic)

- [ ] **Step 1: Add texture preloading to App.tsx**

Add a `CardTextureLoader` wrapper component inside the Canvas that loads textures and passes them to TarotScene. Add this above the `export default function App()`:

```tsx
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

const CARD_NAMES = [
  "00-the-fool", "01-the-magician", "02-the-high-priestess",
  "03-the-empress", "04-the-emperor", "05-the-hierophant",
  "06-the-lovers", "07-the-chariot", "08-strength",
  "09-the-hermit", "10-wheel-of-fortune", "11-justice",
  "12-the-hanged-man", "13-death", "14-temperance",
  "15-the-devil", "16-the-tower", "17-the-star",
  "18-the-moon", "19-the-sun", "20-judgement", "21-the-world"
];

function useCardTextures() {
  const [fronts, setFronts] = useState<THREE.Texture[]>([]);
  const [backs, setBacks] = useState<THREE.Texture[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadAll = async () => {
      try {
        const frontPromises = CARD_NAMES.map(
          (name) => new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(`/cards/fronts/${name}.png`, resolve, undefined, reject);
          })
        );
        const backPromises = Array.from({ length: 6 }, (_, i) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(`/cards/backs/back-${i + 1}.png`, resolve, undefined, reject);
          })
        );

        const [loadedFronts, loadedBacks] = await Promise.all([
          Promise.allSettled(frontPromises),
          Promise.allSettled(backPromises),
        ]);

        setFronts(
          loadedFronts
            .filter((r): r is PromiseFulfilledResult<THREE.Texture> => r.status === "fulfilled")
            .map((r) => r.value)
        );
        setBacks(
          loadedBacks
            .filter((r): r is PromiseFulfilledResult<THREE.Texture> => r.status === "fulfilled")
            .map((r) => r.value)
        );
      } catch {
        // Textures optional — fallback to colored planes
      }
      setLoaded(true);
    };
    loadAll();
  }, []);

  return { fronts, backs, loaded };
}
```

Then in the Canvas, wrap TarotScene with the textures:

```tsx
<TarotScene
  state={sceneState}
  drawnCards={drawnCards}
  pendingCard={pendingCard}
  scrollOffset={scrollOffset}
  onCardDrawn={() => {}}
  tarotDeck={TAROT_DECK}
  isResetting={false}
  cardFronts={cardTextures.fronts}
  cardBacks={cardTextures.backs}
/>
```

- [ ] **Step 2: Call useCardTextures at the top of the App component**

```typescript
const cardTextures = useCardTextures();
```

- [ ] **Step 3: Verify dev server shows cards (with placeholders or real images)**

Run: `npm run dev`
Expected: Cards render with either texture images or fallback colored planes if images not found

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add card texture loading with graceful fallback"
```

---

## Task 10: Share Image Integration + Final Polish

**Files:**
- Modify: `src/components/OracleReading.tsx`

- [ ] **Step 1: Wire share button to actual download**

Update OracleReading to accept an `onShare` prop and wire it:

```tsx
interface Props {
  t: (key: string) => string;
  text: string;
  isStreaming: boolean;
  error: string | null;
  cards: { name: string; position: string }[];
  onRestart: () => void;
  onShare: () => void;
}
```

Replace the `ShareButtonInline` with:

```tsx
{!isStreaming && text && (
  <div className="flex gap-3 mt-6 pt-4 border-t border-amber-500/20">
    <button
      onClick={onShare}
      className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium"
    >
      {t("share.save")}
    </button>
    <button
      onClick={onRestart}
      className="flex-1 py-3 rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 transition-colors"
    >
      {t("share.again")}
    </button>
  </div>
)}
```

- [ ] **Step 2: Pass onShare to OracleReading in App.tsx**

```tsx
<OracleReading
  t={t}
  text={oracle.text}
  isStreaming={oracle.isStreaming}
  error={oracle.error}
  cards={...}
  onRestart={handleRestart}
  onShare={handleShare}
/>
```

- [ ] **Step 3: Remove the unused ShareButtonInline function from OracleReading.tsx**

Delete the `ShareButtonInline` component entirely.

- [ ] **Step 4: Verify full flow end-to-end**

Run: `npm run dev`
Test:
1. Landing → click start
2. Question → type question → click ready
3. Camera init → make fist → open palm
4. Cards fan → scroll → lift → pinch → repeat ×3
5. Wave → cards reveal → oracle text streams
6. Click "Save Reading" → PNG downloads
7. Click "Read Again" → back to question

- [ ] **Step 5: Commit**

```bash
git add src/components/OracleReading.tsx src/App.tsx
git commit -m "feat: wire share image download, complete E2E flow"
```

---

## Task 11: Final Type Check + Dev Server Verification

**Files:** (no new files — verification only)

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Fix any remaining type errors**

Address any issues found — likely candidates:
- Missing imports
- Prop type mismatches between components
- `SceneState` enum additions

- [ ] **Step 3: Run dev server and test golden path**

Run: `npm run dev`
Verify:
- No console errors on load
- Cosmic background renders (stars, rings, shooting stars)
- Language toggle switches all visible text
- Gesture flow works if webcam present
- Oracle reading streams text (requires valid API key in `.env.local`)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve type errors, finalize P1 build"
```

---

## Summary

| Task | What it builds | Est. |
|------|---------------|------|
| 1 | i18n (zh/en JSON + hook) | 5 min |
| 2 | 3D cosmic background | 5 min |
| 3 | HandTracker: PINCH, palm tracking, scroll delta | 10 min |
| 4 | Card extraction script + placeholders | 5 min |
| 5 | TarotScene: textures, carousel, pending state | 10 min |
| 6 | useOracle hook (Claude + Gemini streaming) | 10 min |
| 7 | UI components (7 files) | 10 min |
| 8 | App.tsx rewrite (state machine) | 15 min |
| 9 | Texture loading integration | 5 min |
| 10 | Share image + final wiring | 5 min |
| 11 | Type check + verification | 5 min |
| **Total** | | **~85 min** |
