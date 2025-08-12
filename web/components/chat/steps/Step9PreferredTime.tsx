"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step9Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { finalizeInquiry } from "@/lib/api";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

export function Step9({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, sessionId, loading, reset, markDirty, dirtySteps, answers } = useChatStore();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (dirtySteps.has(9)) return;
    const prev = answers?.[9] as { preferred_time_start?: string; preferred_time_end?: string } | undefined;
    if (prev?.preferred_time_start) setStart(prev.preferred_time_start);
    if (prev?.preferred_time_end) setEnd(prev.preferred_time_end);
  }, [answers, dirtySteps]);

  const submit = async () => {
    logger.event("ui:step9:submit", { start, end });
    const parsed = Step9Schema.safeParse({ preferred_time_start: start, preferred_time_end: end });
    if (!parsed.success) return;
    const ok = await setAnswer(9, parsed.data);
    if (!ok) return;
    await finalizeInquiry(sessionId);
    logger.event("ui:finalize:done");
    // 세션 종료 및 새로고침
    reset();
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>상담 희망 시간대를 입력해 주세요</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="time"
          className="border rounded px-2 py-1 text-sm w-28"
          value={start}
          onChange={(e) => { setStart(e.target.value); markDirty(9); }}
        />
        <span>부터</span>
        <input
          type="time"
          className="border rounded px-2 py-1 text-sm w-28"
          value={end}
          onChange={(e) => { setEnd(e.target.value); markDirty(9); }}
        />
        <span>사이</span>
      </div>
      </BubbleAnswer>
      {!isCurrent && dirtySteps.has(9) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={(loading || !start || !end) && !dirtySteps.has(9)}>
            제출
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

