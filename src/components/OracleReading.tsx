import { motion } from "framer-motion";

interface Props {
  t: (key: string) => string;
  text: string;
  isStreaming: boolean;
  error: string | null;
  cards: { name: string; position: string }[];
  onRestart: () => void;
  onShare: () => void;
}

export function OracleReading({
  t,
  text,
  isStreaming,
  error,
  cards,
  onRestart,
  onShare,
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
      </div>
    </motion.div>
  );
}
