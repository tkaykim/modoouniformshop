"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { logger } from "@/lib/logger";
import { Step2Schema } from "@/lib/validators";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";
import { useRouter } from "next/navigation";

const OPTIONS = ["가격", "퀄리티(원단,프린팅팅)", "납기일", "자세한 상담", "디자인"];

export function Step2({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, markDirty, answers, dirtySteps } = useChatStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [easter, setEaster] = useState(0);
  const router = useRouter();

  // Prefill from answers
  useEffect(() => {
    if (dirtySteps.has(2)) return;
    const prevObj = answers?.[2] as { priorities?: { key: string; rank: number }[] } | undefined;
    const prev = prevObj?.priorities;
    if (prev && prev.length) setSelected(prev.sort((a,b)=>a.rank-b.rank).map(p=>p.key));
  }, [answers, dirtySteps]);

  const toggle = async (opt: string) => {
    logger.event("ui:step2:toggle", { opt });
    setSelected((prev) => {
      const next = prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt];
      // 3개 선택 시 자동 제출
      if (next.length === 3) {
        const priorities = next.map((key, idx) => ({ key, rank: idx + 1 }));
        const parsed = Step2Schema.safeParse({ priorities });
        if (parsed.success) {
          setTimeout(() => setAnswer(2, parsed.data), 0);
        }
      }
      return next;
    });
    markDirty(2);
  };

  const submit = async () => {
    logger.event("ui:step2:submit", { selected });
    const priorities = selected.slice(0, 3).map((key, idx) => ({ key, rank: idx + 1 }));
    const parsed = Step2Schema.safeParse({ priorities });
    if (!parsed.success) return;
    await setAnswer(2, parsed.data);
  };

  return (
    <div className="space-y-2">
      <div onClick={() => {
        const next = easter + 1;
        setEaster(next);
        if (next >= 8) router.push("/admin");
        setTimeout(() => setEaster(0), 1500);
      }}>
        <BubbleQuestion>
          제작 시 가장 중요하시는 3가지를 우선순위대로 골라주세요!
        </BubbleQuestion>
      </div>
      <BubbleAnswer>
        <div className="flex flex-wrap gap-2 mb-2">
        {OPTIONS.map((o) => (
          <button
            key={o}
              className={`relative px-4 py-2 rounded-full border ${selected.includes(o) ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => toggle(o)}
          >
            {o}
            {selected.includes(o) && selected.indexOf(o) < 3 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black border flex items-center justify-center text-xs font-semibold">
                {selected.indexOf(o) + 1}
              </span>
            )}
          </button>
        ))}
        </div>
        <div className="text-xs text-gray-400 mb-1">선택 순서대로 1, 2, 3 번호가 표시됩니다.</div>
      </BubbleAnswer>
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={selected.length === 0 && !dirtySteps.has(2)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(2, { priorities: [] });
            }}
          >
            건너뛰기
          </button>
        </div>
      </div>
      )}
      {!isCurrent && dirtySteps.has(2) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

