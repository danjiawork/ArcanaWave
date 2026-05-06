import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

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
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private isRunning = false;
  private wristHistory: { x: number; time: number }[] = [];
  private palmState: PalmState = { x: 0.5, y: 0.5, rotation: 0, visible: false };
  private prevPalmX = 0.5;
  private prevRotation = 0;
  private palmYHistory: { y: number; time: number }[] = [];

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  async startCamera(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    this.video.srcObject = stream;
    return new Promise((resolve) => {
      this.video!.onloadedmetadata = () => {
        this.video!.play();
        this.isRunning = true;
        resolve(true);
      };
    });
  }

  stopCamera() {
    this.isRunning = false;
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  getPalmState(): PalmState {
    return this.palmState;
  }

  getScrollDelta(): number {
    if (!this.palmState.visible) return 0;
    const xDelta = this.palmState.x - this.prevPalmX;
    const rotDelta = this.palmState.rotation - this.prevRotation;
    return Math.abs(xDelta) > Math.abs(rotDelta * 0.3) ? xDelta : rotDelta * 0.3;
  }

  detectGesture(): Gesture {
    if (!this.handLandmarker || !this.video || !this.isRunning)
      return "UNKNOWN";

    const results = this.handLandmarker.detectForVideo(
      this.video,
      performance.now()
    );

    if (results.landmarks && results.landmarks.length > 0) {
      // Helper to calculate 3D distance between two landmarks
      const dist = (p1: any, p2: any) => {
        return Math.sqrt(
          Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
      };

      // Check for PRAY (Prayer/Clap gesture) if two hands are present
      if (results.landmarks.length >= 2) {
        const h1 = results.landmarks[0];
        const h2 = results.landmarks[1];

        // Distance between wrists or middle finger MCPs
        const wristDist = dist(h1[0], h2[0]);
        const midDist = dist(h1[9], h2[9]);

        // If hands are close to each other, it's a PRAY gesture
        if (wristDist < 0.15 && midDist < 0.15) {
          return "PRAY";
        }
      }

      const landmarks = results.landmarks[0];

      // Update palm state
      this.prevPalmX = this.palmState.x;
      this.prevRotation = this.palmState.rotation;
      this.palmState.x = landmarks[0].x;
      this.palmState.y = landmarks[0].y;
      this.palmState.visible = true;
      const dx = landmarks[9].x - landmarks[0].x;
      const dy = landmarks[9].y - landmarks[0].y;
      this.palmState.rotation = Math.atan2(dx, -dy);

      // Track vertical movement for PALM_LIFT detection
      const now2 = performance.now();
      this.palmYHistory.push({ y: landmarks[0].y, time: now2 });
      this.palmYHistory = this.palmYHistory.filter((h) => now2 - h.time < 500);

      // A finger is considered extended if its tip is further from the wrist than its PIP joint,
      // AND further from its MCP joint than its PIP joint. This makes it rotation invariant.
      const isExtended = (tip: number, pip: number, mcp: number) => {
        return (
          dist(landmarks[tip], landmarks[0]) >
            dist(landmarks[pip], landmarks[0]) &&
          dist(landmarks[tip], landmarks[mcp]) >
            dist(landmarks[pip], landmarks[mcp])
        );
      };

      const isThumbUp = isExtended(4, 3, 2);
      const isIndexUp = isExtended(8, 6, 5);
      const isMiddleUp = isExtended(12, 10, 9);
      const isRingUp = isExtended(16, 14, 13);
      const isPinkyUp = isExtended(20, 18, 17);

      const fingersUpCount = [
        isIndexUp,
        isMiddleUp,
        isRingUp,
        isPinkyUp,
      ].filter(Boolean).length;

      // OK Gesture: Thumb and Index tips are close, other fingers extended
      const thumbIndexDist = dist(landmarks[4], landmarks[8]);
      const isOkGesture =
        thumbIndexDist < 0.08 && isMiddleUp && isRingUp && isPinkyUp;

      // Wave Gesture: Hand open, significant horizontal movement
      const now = performance.now();
      this.wristHistory.push({ x: landmarks[0].x, time: now });
      this.wristHistory = this.wristHistory.filter((h) => now - h.time < 1000);

      let isWaving = false;
      if (fingersUpCount >= 4 && this.wristHistory.length > 10) {
        let minX = 1,
          maxX = 0;
        this.wristHistory.forEach((h) => {
          if (h.x < minX) minX = h.x;
          if (h.x > maxX) maxX = h.x;
        });

        if (maxX - minX > 0.15) {
          let directionChanges = 0;
          let lastDirection = 0;
          let smoothed = [];
          for (let i = 0; i < this.wristHistory.length; i += 3) {
            smoothed.push(this.wristHistory[i].x);
          }
          for (let i = 1; i < smoothed.length; i++) {
            const diff = smoothed[i] - smoothed[i - 1];
            if (Math.abs(diff) > 0.02) {
              const dir = Math.sign(diff);
              if (lastDirection !== 0 && dir !== lastDirection) {
                directionChanges++;
              }
              lastDirection = dir;
            }
          }
          if (directionChanges >= 1) {
            isWaving = true;
          }
        }
      }

      // PINCH Gesture: Thumb and Index tips close together, index reaching out (not curled like a fist)
      const isIndexPartiallyExtended = dist(landmarks[8], landmarks[0]) > dist(landmarks[6], landmarks[0]);
      const isPinch = thumbIndexDist < 0.08 && isIndexPartiallyExtended && !isMiddleUp;

      // PALM_LIFT: Open hand moving upward
      let isPalmLift = false;
      if (fingersUpCount >= 3 && this.palmYHistory.length > 5) {
        const oldest = this.palmYHistory[0].y;
        const newest = this.palmYHistory[this.palmYHistory.length - 1].y;
        // In MediaPipe, y decreases going up
        if (oldest - newest > 0.06) {
          isPalmLift = true;
        }
      }

      if (isPinch) {
        return "PINCH";
      } else if (isWaving) {
        return "WAVE";
      } else if (isPalmLift) {
        return "PALM_LIFT";
      } else if (isOkGesture) {
        return "OK";
      } else if (fingersUpCount >= 3 && isThumbUp) {
        return "OPEN_HAND";
      } else if (fingersUpCount >= 4) {
        return "OPEN_HAND";
      } else if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        return "ONE_FINGER";
      } else if (fingersUpCount <= 1 && !isIndexUp && !isMiddleUp) {
        return "FIST";
      }
    }

    this.palmState.visible = false;
    return "UNKNOWN";
  }
}
