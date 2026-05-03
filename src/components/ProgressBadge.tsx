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
