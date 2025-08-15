"use client";
import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step1 } from "./steps/Step1Type";
import { Step2 } from "./steps/Step2Priorities";
import { Step3 } from "./steps/Step3Items";
import { Step4 } from "./steps/Step4Quantity";
import { Step5 } from "./steps/Step5Design";
import { Step6 } from "./steps/Step6Date";
import { Step7 } from "./steps/Step7Source";
import { Step8 } from "./steps/Step8Contact";
import { Step9 } from "./steps/Step9PreferredTime";
import { AnimatePresence, motion } from "framer-motion";

type ChatContainerProps = {
  disableAutoCenter?: boolean;
};

export function ChatContainer({ disableAutoCenter = false }: ChatContainerProps = {}) {
  const { init, currentStep, reset, setFocusedStep } = useChatStore();
  const enabled = [1,2,3,8];
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    init();
  }, [init]);

  // Keep current step visually centered by scrolling the page by the exact delta
  useEffect(() => {
    if (disableAutoCenter) return;
    const centerNow = () => {
      const el = stepRefs.current[currentStep];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const desired = window.innerHeight / 2;
      const centerY = rect.top + rect.height / 2;
      const delta = centerY - desired;
      if (Math.abs(delta) > 2) {
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
    };

    // center on step change
    centerNow();

    // recenter when current step resizes (e.g., options expand) or when layout above changes
    const el = stepRefs.current[currentStep];
    let ro: ResizeObserver | null = null;
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => centerNow());
      ro.observe(el);
    }

    // observe container mutations to recenter when previous steps mount
    const cont = containerRef.current;
    let mo: MutationObserver | null = null;
    if (cont && "MutationObserver" in window) {
      mo = new MutationObserver(() => centerNow());
      mo.observe(cont, { childList: true, subtree: true });
    }

    const onResize = () => centerNow();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [currentStep, disableAutoCenter]);

  return (
    <div ref={containerRef} className="space-y-4 relative min-h-[70vh]">
      <div className="flex justify-center">
        <button
          className="text-sm px-3 py-1.5 rounded bg-[#0052cc] text-white shadow"
          onClick={() => {
            reset();
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          새 상담 시작하기
        </button>
      </div>
      {/* 지난 스텝: currentStep 이전 단계만 노출 */}
      <div className="opacity-70 pb-24">
        <div className="space-y-[20px]">
          {currentStep > 1 && enabled.includes(1) && <div ref={(el)=> { stepRefs.current[1]=el; }} onClick={() => setFocusedStep(1)}><Step1 isCurrent={false} /></div>}
          {currentStep > 2 && enabled.includes(2) && <div ref={(el)=> { stepRefs.current[2]=el; }} onClick={() => setFocusedStep(2)}><Step2 isCurrent={false} /></div>}
          {currentStep > 3 && enabled.includes(3) && <div ref={(el)=> { stepRefs.current[3]=el; }} onClick={() => setFocusedStep(3)}><Step3 isCurrent={false} /></div>}
          {currentStep > 4 && enabled.includes(4) && <div ref={(el)=> { stepRefs.current[4]=el; }} onClick={() => setFocusedStep(4)}><Step4 isCurrent={false} /></div>}
          {currentStep > 5 && enabled.includes(5) && <div ref={(el)=> { stepRefs.current[5]=el; }} onClick={() => setFocusedStep(5)}><Step5 isCurrent={false} /></div>}
          {currentStep > 6 && enabled.includes(6) && <div ref={(el)=> { stepRefs.current[6]=el; }} onClick={() => setFocusedStep(6)}><Step6 isCurrent={false} /></div>}
          {currentStep > 7 && enabled.includes(7) && <div ref={(el)=> { stepRefs.current[7]=el; }} onClick={() => setFocusedStep(7)}><Step7 isCurrent={false} /></div>}
          {currentStep > 8 && enabled.includes(8) && <div ref={(el)=> { stepRefs.current[8]=el; }} onClick={() => setFocusedStep(8)}><Step8 isCurrent={false} /></div>}
        </div>
      </div>
      {/* 현재 편집 스텝 (항상 화면 정중앙 고정) */}
      <div className="sticky top-1/2 z-10">
        <div className="relative -translate-y-1/2">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step1 isCurrent />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step2 isCurrent />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step3 isCurrent />
            </motion.div>
          )}
          {currentStep === 4 && enabled.includes(4) && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step4 isCurrent />
            </motion.div>
          )}
          {currentStep === 5 && enabled.includes(5) && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step5 isCurrent />
            </motion.div>
          )}
          {currentStep === 6 && enabled.includes(6) && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step6 isCurrent />
            </motion.div>
          )}
          {currentStep === 7 && enabled.includes(7) && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step7 isCurrent />
            </motion.div>
          )}
          {currentStep === 8 && enabled.includes(8) && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step8 isCurrent />
            </motion.div>
          )}
          {currentStep === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.4, y: -40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <Step9 isCurrent />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

