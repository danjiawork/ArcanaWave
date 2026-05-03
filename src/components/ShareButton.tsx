import { useCallback } from "react";

interface ShareProps {
  cards: { name: string; position: string }[];
  oracleText: string;
  branding: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
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

export function useShareImage() {
  const generateImage = useCallback(
    async ({ cards, oracleText, branding }: ShareProps): Promise<Blob | null> => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, "#070714");
      gradient.addColorStop(0.5, "#1a1540");
      gradient.addColorStop(1, "#070714");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

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

      ctx.font = "bold 64px serif";
      ctx.fillStyle = "#d4af37";
      ctx.textAlign = "center";
      ctx.fillText("ArcanaWave", 540, 200);

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

      const excerpt = oracleText.slice(0, 150) + (oracleText.length > 150 ? "..." : "");
      ctx.font = "italic 32px serif";
      ctx.fillStyle = "#fef3c7";
      ctx.textAlign = "center";
      const lines = wrapText(ctx, `"${excerpt}"`, 900);
      lines.forEach((line, i) => {
        ctx.fillText(line, 540, 700 + i * 50);
      });

      ctx.font = "20px serif";
      ctx.fillStyle = "#78716c";
      ctx.fillText(branding, 540, 1820);

      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    },
    []
  );

  const download = useCallback(async (props: ShareProps) => {
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
