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
