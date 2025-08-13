"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step6Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { todayKstISODate } from "@/lib/time";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

function formatDateYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function Step6({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, loading, markDirty, dirtySteps } = useChatStore();
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    // 기본 1주 뒤 (KST 기준)
    const base = new Date(todayKstISODate());
    const week = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    setDateStr(formatDateYYYYMMDD(week));
  }, []);

  const submit = async () => {
    logger.event("ui:step6:submit", { needed_date: dateStr });
    const parsed = Step6Schema.safeParse({ needed_date: dateStr });
    if (!parsed.success) return;
    await setAnswer(6, parsed.data);
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>제품이 필요한 날짜는 언제인가요?</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm"
          value={dateStr}
          onChange={(e) => { setDateStr(e.target.value); markDirty(6); }}
        />
      </div>
      </BubbleAnswer>
      {!isCurrent && dirtySteps.has(6) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={(loading || !dateStr) && !dirtySteps.has(6)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(6, { needed_date: undefined });
            }}
          >
            건너뛰기
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

