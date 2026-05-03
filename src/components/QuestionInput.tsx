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
