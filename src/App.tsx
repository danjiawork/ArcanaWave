import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
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

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadAll = async () => {
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
    };
    loadAll();
  }, []);

  return { fronts, backs };
}

export default function App() {
  const { t, lang, setLang } = useTranslation();
  const oracle = useOracle();
  const { download: downloadShareImage } = useShareImage();
  const cardTextures = useCardTextures();

  const [phase, setPhase] = useState<AppPhase>("LANDING");
  const [userQuestion, setUserQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<number[]>([]);
  const [pendingCard, setPendingCard] = useState<number | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<Gesture>("UNKNOWN");
  const [instruction, setInstruction] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [isFirstFan, setIsFirstFan] = useState(true);
  const [handX, setHandX] = useState<number | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const requestRef = useRef<number>(0);
  const lastGestureRef = useRef<Gesture>("UNKNOWN");
  const gestureHoldTimeRef = useRef<number>(0);
  const stuckTimerRef = useRef<number>(0);

  const phaseRef = useRef(phase);
  const drawnCardsRef = useRef(drawnCards);
  const pendingCardRef = useRef(pendingCard);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { drawnCardsRef.current = drawnCards; }, [drawnCards]);
  useEffect(() => { pendingCardRef.current = pendingCard; }, [pendingCard]);

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

      const palmState = tracker.getPalmState();
      if (palmState.visible) {
        setHandX(palmState.x);
      }

      if (phaseRef.current === "FAN") {
        const delta = tracker.getScrollDelta();
        if (Math.abs(delta) > 0.002) {
          setScrollOffset((prev) => Math.max(-1, Math.min(1, prev + delta * 2)));
          stuckTimerRef.current = 0;
        } else {
          stuckTimerRef.current += 16;
          if (stuckTimerRef.current > 5000) {
            setShowGuide(true);
            stuckTimerRef.current = 0;
          }
        }
      }

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
    setShowGuide(false);
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

  useEffect(() => {
    if (localStorage.getItem("arcanawave-guide-shown")) {
      setIsFirstFan(false);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-[#070714] text-amber-50 overflow-hidden relative font-serif">
      {/* 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} color="#fef08a" />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#c084fc" />
          <CosmicBackground handX={handX} />
          {phase !== "LANDING" && phase !== "QUESTION" && (
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
          )}
        </Canvas>
      </div>

      {/* Language Toggle */}
      <LanguageToggle lang={lang} onToggle={setLang} />

      {/* Phase-based UI overlays */}
      <AnimatePresence mode="wait">
        {phase === "LANDING" && (
          <LandingScreen key="landing" t={t} onStart={handleStart} />
        )}

        {phase === "QUESTION" && (
          <QuestionInput key="question" t={t} onReady={handleQuestionReady} />
        )}

        {phase === "ORACLE" && (
          <OracleReading
            key="oracle"
            t={t}
            text={oracle.text}
            isStreaming={oracle.isStreaming}
            error={oracle.error}
            cards={drawnCards.map((id, i) => ({
              name: lang === "zh" ? TAROT_DECK[id].name : TAROT_DECK[id].nameEn,
              position: [t("positions.past"), t("positions.present"), t("positions.future")][i],
            }))}
            onRestart={handleRestart}
            onShare={handleShare}
          />
        )}
      </AnimatePresence>

      {/* Progress badge */}
      {(phase === "FAN" || phase === "PENDING") && (
        <ProgressBadge current={drawnCards.length} total={3} t={t} />
      )}

      {/* Ceremony / interaction instructions */}
      {["CEREMONY_FIST", "CEREMONY_PALM", "FAN", "PENDING", "WAITING_REVEAL"].includes(phase) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-center">
          <div className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-sm border border-amber-500/30 text-amber-200 text-lg">
            {instruction}
          </div>
        </div>
      )}

      {/* Gesture guide */}
      <GestureGuide
        show={showGuide && phase === "FAN"}
        text={t("fan.stuck_hint")}
        isFirstTime={isFirstFan}
      />

      {/* Hidden video */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
