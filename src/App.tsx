import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { HandTracker, Gesture } from "./utils/HandTracker";
import { TarotScene, SceneState } from "./components/TarotScene";
import { Hand, Pointer, Sparkles, CircleCheck, Waves } from "lucide-react";
import { soundManager } from "./utils/SoundManager";

const TAROT_DECK = [
  { name: "0. 愚者 (The Fool)", meaning: "新的开始、冒险、天真、无限可能" },
  { name: "I. 魔术师 (The Magician)", meaning: "创造力、显化、意志力、专注" },
  {
    name: "II. 女祭司 (The High Priestess)",
    meaning: "直觉、潜意识、神秘、内在智慧",
  },
  { name: "III. 女皇 (The Empress)", meaning: "丰饶、母性、自然、感官享受" },
  { name: "IV. 皇帝 (The Emperor)", meaning: "权威、结构、控制、稳定" },
  { name: "V. 教皇 (The Hierophant)", meaning: "传统、信仰、教育、精神指引" },
  { name: "VI. 恋人 (The Lovers)", meaning: "爱情、和谐、选择、价值观契合" },
  { name: "VII. 战车 (The Chariot)", meaning: "意志、胜利、决心、克服困难" },
  { name: "VIII. 力量 (Strength)", meaning: "勇气、耐心、同情心、内在力量" },
  { name: "IX. 隐士 (The Hermit)", meaning: "内省、孤独、指引、寻求真理" },
  {
    name: "X. 命运之轮 (Wheel of Fortune)",
    meaning: "变化、命运、转折点、好运",
  },
  { name: "XI. 正义 (Justice)", meaning: "公平、真理、因果、理性判断" },
  { name: "XII. 倒吊人 (The Hanged Man)", meaning: "牺牲、新视角、放手、暂停" },
  { name: "XIII. 死神 (Death)", meaning: "结束、转变、新生、割舍过去" },
  { name: "XIV. 节制 (Temperance)", meaning: "平衡、中庸、耐心、和谐融合" },
  { name: "XV. 恶魔 (The Devil)", meaning: "束缚、物质主义、诱惑、执念" },
  { name: "XVI. 高塔 (The Tower)", meaning: "突变、混乱、觉醒、破坏重建" },
  { name: "XVII. 星星 (The Star)", meaning: "希望、灵感、宁静、心灵疗愈" },
  { name: "XVIII. 月亮 (The Moon)", meaning: "幻觉、恐惧、潜意识、不安" },
  { name: "XIX. 太阳 (The Sun)", meaning: "快乐、成功、活力、充满希望" },
  { name: "XX. 审判 (Judgement)", meaning: "重生、内在召唤、宽恕、觉醒" },
  { name: "XXI. 世界 (The World)", meaning: "完成、整合、成就、圆满" },
];

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [sceneState, setSceneState] = useState<SceneState>("IDLE");
  const [drawnCards, setDrawnCards] = useState<number[]>([]);
  const [currentGesture, setCurrentGesture] = useState<Gesture>("UNKNOWN");
  const [instruction, setInstruction] = useState("点击开始抽牌");
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const requestRef = useRef<number>(0);
  const lastGestureRef = useRef<Gesture>("UNKNOWN");
  const gestureHoldTimeRef = useRef<number>(0);

  // State machine refs to avoid dependency issues in animation loop
  const stateRef = useRef(sceneState);
  const drawnCardsRef = useRef(drawnCards);

  useEffect(() => {
    stateRef.current = sceneState;
    drawnCardsRef.current = drawnCards;
  }, [sceneState, drawnCards]);

  const handleCardHover = (cardId: number | null) => {
    setHoveredCardId(cardId);
  };

  const handleStart = async () => {
    soundManager.init();
    setIsStarted(true);
    setInstruction("正在初始化相机...");

    const tracker = new HandTracker();
    await tracker.init();
    if (videoRef.current) {
      await tracker.startCamera(videoRef.current);
      trackerRef.current = tracker;
      setInstruction("请张开手掌以展示塔罗牌");

      // Start detection loop
      const detectLoop = (time: number) => {
        const gesture = tracker.detectGesture();
        setCurrentGesture(gesture);

        // Simple debounce/hold logic for gestures
        if (gesture === lastGestureRef.current && gesture !== "UNKNOWN") {
          gestureHoldTimeRef.current += 16; // approx 16ms per frame
        } else {
          gestureHoldTimeRef.current = 0;
          lastGestureRef.current = gesture;
        }

        // Require gesture to be held for ~300ms to trigger
        if (gestureHoldTimeRef.current > 300) {
          handleGesture(gesture);
          gestureHoldTimeRef.current = 0; // reset after trigger
        }

        requestRef.current = requestAnimationFrame(detectLoop);
      };
      requestRef.current = requestAnimationFrame(detectLoop);
    }
  };

  const handleGesture = (gesture: Gesture) => {
    const currentState = stateRef.current;
    const currentDrawn = drawnCardsRef.current;

    if (currentState === "IDLE") {
      if (gesture === "OPEN_HAND") {
        soundManager.playFan();
        setSceneState("FAN");
        setInstruction("请伸出手指抽取“过去”的卡牌");
      }
    } else if (currentState === "FAN") {
      if (gesture === "ONE_FINGER" && currentDrawn.length < 3) {
        soundManager.playDraw();
        // Draw a random card that hasn't been drawn yet
        let newCard;
        do {
          newCard = Math.floor(Math.random() * 22);
        } while (currentDrawn.includes(newCard));

        const newDrawn = [...currentDrawn, newCard];
        setDrawnCards(newDrawn);

        if (newDrawn.length === 3) {
          setSceneState("WAITING_REVEAL");
          setInstruction("挥挥手揭晓命运");
        } else {
          setSceneState("DRAWING");
          const nextCardName = ["过去", "现在", "未来"][newDrawn.length];
          setInstruction(`请伸出手指抽取“${nextCardName}”的卡牌`);

          // Briefly return to FAN state after drawing to allow next draw
          setTimeout(() => {
            if (stateRef.current === "DRAWING") {
              setSceneState("FAN");
            }
          }, 1500);
        }
      }
    } else if (currentState === "WAITING_REVEAL") {
      if (gesture === "WAVE") {
        soundManager.playReveal();
        setSceneState("REVEAL");
        setInstruction("你的命运已揭晓，握紧拳头可重新开始");
      }
    } else if (currentState === "REVEAL") {
      if (gesture === "FIST") {
        handleRestart();
      }
    }
  };

  const handleRestart = () => {
    setIsResetting(true); // 开始重置动画
    setHoveredCardId(null); // Reset hovered card
    setInstruction("请张开手掌以展示塔罗牌");

    // 动画完成后重置状态
    setTimeout(() => {
      setSceneState("IDLE");
      setDrawnCards([]);
      setIsResetting(false); // 结束重置动画
    }, 1000); // 假设动画持续 1 秒
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (trackerRef.current) trackerRef.current.stopCamera();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-amber-50 overflow-y-auto overflow-x-hidden relative font-serif">
      {/* 3D Canvas */}
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-1000 ${
          sceneState === "REVEAL"
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            color="#fef08a"
          />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#c084fc" />
          <Environment preset="night" />
          <TarotScene
            state={sceneState}
            drawnCards={drawnCards}
            onCardDrawn={() => {}}
            tarotDeck={TAROT_DECK}
            onCardHover={handleCardHover}
            isResetting={isResetting}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none flex flex-col items-center justify-start min-h-screen py-8">
        <div className="text-center space-y-4 bg-black/40 p-5 rounded-3xl backdrop-blur-md border border-amber-500/20 shadow-lg mt-2 max-w-[90vw]">
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 flex items-center justify-center gap-3 drop-shadow-lg">
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-400" />
            命运之轮
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-400" />
          </h1>
          <p className="text-lg md:text-xl text-amber-100/90 font-light tracking-[0.1em]">
            {instruction}
          </p>
        </div>

        <div className="flex-1" />

        {!isStarted && (
          <button
            onClick={handleStart}
            className="pointer-events-auto px-10 py-5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full text-2xl font-medium tracking-widest hover:scale-105 hover:from-amber-500 hover:to-yellow-500 transition-all duration-300 shadow-[0_0_30px_rgba(217,119,6,0.4)] border border-amber-300/30 text-white mb-12"
          >
            开始占卜
          </button>
        )}

        {/* Card Meanings Overlay */}
        {sceneState === "REVEAL" && (
          <div className="flex flex-col items-center justify-center w-full px-4 md:px-8 z-20 animate-[fadeIn_1s_ease-in-out_forwards] mb-12">
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 w-full max-w-6xl">
              {drawnCards.map((cardId, index) => (
                <div
                  key={cardId}
                  className="bg-black/60 backdrop-blur-2xl border border-amber-500/40 p-4 md:p-6 rounded-3xl flex-1 text-center shadow-lg transform hover:scale-105 transition-transform duration-500"
                >
                  <h3 className="text-amber-400 font-bold text-lg md:text-xl mb-2 tracking-[0.2em] border-b border-amber-500/20 pb-2">
                    {["过去", "现在", "未来"][index]}
                  </h3>
                  <h4 className="text-white text-base md:text-lg mb-2 font-medium tracking-wider">
                    {TAROT_DECK[cardId].name}
                  </h4>
                  <p className="text-amber-100/90 text-xs md:text-sm leading-relaxed">
                    {TAROT_DECK[cardId].meaning}
                  </p>
                </div>
              ))}
            </div>

            {hoveredCardId !== null && (
              <div className="mt-6 bg-black/70 backdrop-blur-xl border border-amber-500/30 p-4 rounded-2xl text-center max-w-xl shadow-xl animate-[fadeIn_0.5s_ease-in-out_forwards]">
                <h4 className="text-amber-300 font-bold text-lg mb-1">
                  {TAROT_DECK[hoveredCardId].name}
                </h4>
                <p className="text-amber-100 text-sm leading-relaxed">
                  {TAROT_DECK[hoveredCardId].meaning}
                </p>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="mt-8 pointer-events-auto px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full text-lg font-medium tracking-[0.2em] transition-all duration-300 shadow-md border border-amber-300/30 text-white hover:scale-105"
            >
              重新开始
            </button>
          </div>
        )}
      </div>

      {/* Hidden Video Element for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
