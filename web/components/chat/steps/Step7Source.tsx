"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step7Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

const OPTIONS = [
  "지인소개",
  "네이버 검색",
  "네이버 블로그",
  "인스타그램",
  "쓰레드",
  "기타",
  "길거리 또는 제휴매장 광고",
];

export function Step7({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, loading, markDirty, dirtySteps, answers } = useChatStore();
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (dirtySteps.has(7)) return;
    const prev = answers?.[7] as { heard_about?: string } | undefined;
    if (prev?.heard_about) setValue(prev.heard_about);
  }, [answers, dirtySteps]);

  const submit = async () => {
    logger.event("ui:step7:submit", { heard_about: value });
    const parsed = Step7Schema.safeParse({ heard_about: value });
    if (!parsed.success) return;
    await setAnswer(7, parsed.data);
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>모두의 유니폼을 알게된 계기는?</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex flex-wrap gap-2 mb-2">
        {OPTIONS.map((o) => (
          <button
            key={o}
            className={`px-4 py-2 rounded-full border ${value === o ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => { setValue(o); markDirty(7); }}
          >
            {o}
          </button>
        ))}
      </div>
      </BubbleAnswer>
      {!isCurrent && dirtySteps.has(7) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={(loading || !value) && !dirtySteps.has(7)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(7, { heard_about: undefined });
            }}
          >
            {dirtySteps.has(7) ? "저장" : "건너뛰기"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

