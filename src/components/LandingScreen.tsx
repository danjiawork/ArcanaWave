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
