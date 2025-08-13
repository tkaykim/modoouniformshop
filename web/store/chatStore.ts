import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { upsertInquiryStep } from "@/lib/api";
import { logger } from "@/lib/logger";

type Answers = Record<number, Record<string, unknown>>;

type ChatState = {
  sessionId: string;
  currentStep: number;
  answers: Answers;
  dirtySteps: Set<number>;
  focusedStep: number | null;
  loading: boolean;
  error?: string;
  init: () => void;
  setAnswer: (step: number, payload: Record<string, unknown>, opts?: { optimistic?: boolean }) => Promise<boolean>;
  markDirty: (step: number) => void;
  clearDirty: (step: number) => void;
  setFocusedStep: (step: number | null) => void;
  reset: () => void;
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  const existing = localStorage.getItem("session_id");
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem("session_id", id);
  return id;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: "",
  currentStep: 1,
  answers: {},
  dirtySteps: new Set<number>(),
  focusedStep: null,
  loading: false,
  init: () => {
    logger.event("chat:init:start");
    const sid = getOrCreateSessionId();
    set({ sessionId: sid });
    const saved = typeof window !== "undefined" ? localStorage.getItem("answers") : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Answers;
        set({ answers: parsed });
        const enabled = [1,2,3,8];
        const lastCompleted = Math.max(0, ...Object.keys(parsed).map(Number).filter((s)=> enabled.includes(Number(s))));
        const nextIdx = Math.min(enabled.length, Math.max(1, enabled.indexOf(lastCompleted) + 2));
        const next = enabled[nextIdx - 1] ?? 1;
        set({ currentStep: next });
        logger.event("chat:init:restored", { sessionId: sid, lastCompleted, next });
      } catch {}
    }
    logger.event("chat:init:done", { sessionId: sid });
  },
  setAnswer: async (step, payload, opts) => {
    logger.event("chat:setAnswer:start", { step, payload });
    set({ error: undefined });
    const { sessionId, answers } = get();
    const enabled = [1,2,3,8];
    const idx = enabled.indexOf(step);
    const nextEnabledStep = enabled[idx + 1] ?? enabled[idx] ?? step;
    const nextAnswers: Answers = { ...answers, [step]: payload };

    if (opts?.optimistic) {
      const updatedDirty = new Set(get().dirtySteps);
      updatedDirty.delete(step);
      set({ answers: nextAnswers, currentStep: Math.max(get().currentStep, nextEnabledStep), dirtySteps: updatedDirty });
      if (typeof window !== "undefined") {
        localStorage.setItem("answers", JSON.stringify(nextAnswers));
      }
    }
    set({ loading: true });
    try {
      const res = await upsertInquiryStep({ session_id: sessionId, step, payload });
      logger.info("chat:setAnswer:success", { res });
      const enabled = [1,2,3,8];
      const current = get().currentStep;
      const idx2 = enabled.indexOf(step);
      const nextStep = Math.max(current, enabled[idx2 + 1] ?? enabled[idx2] ?? step);
      // 저장 성공 시 더티 플래그 해제 및 비낙관적 진행 처리
      const updatedDirty = new Set(get().dirtySteps);
      updatedDirty.delete(step);
      if (!opts?.optimistic) {
        set({ answers: nextAnswers, currentStep: nextStep, dirtySteps: updatedDirty });
      } else {
        set({ dirtySteps: updatedDirty });
      }
      set({ loading: false });
      if (typeof window !== "undefined") {
        localStorage.setItem("answers", JSON.stringify(nextAnswers));
      }
      return true;
    } catch (e) {
      logger.error("chat:setAnswer:error", e);
      set({ loading: false, error: (e as Error).message });
      // TODO: enqueue retry
      return false;
    }
  },
  markDirty: (step: number) => {
    const updated = new Set(get().dirtySteps);
    updated.add(step);
    set({ dirtySteps: updated });
  },
  clearDirty: (step: number) => {
    const updated = new Set(get().dirtySteps);
    updated.delete(step);
    set({ dirtySteps: updated });
  },
  setFocusedStep: (step: number | null) => set({ focusedStep: step }),
  reset: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_id");
      localStorage.removeItem("answers");
    }
    const newId = uuidv4();
    if (typeof window !== "undefined") {
      localStorage.setItem("session_id", newId);
    }
    set({ sessionId: newId, currentStep: 1, answers: {}, dirtySteps: new Set<number>(), focusedStep: 1 });
  },
}));

