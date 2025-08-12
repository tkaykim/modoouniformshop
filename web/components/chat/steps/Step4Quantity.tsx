"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step4Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

export function Step4({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, loading, markDirty, dirtySteps, answers } = useChatStore();
  const [qty, setQty] = useState<string>("");

  useEffect(() => {
    if (dirtySteps.has(4)) return;
    const obj = answers?.[4] as { quantity?: number } | undefined;
    const a = obj?.quantity;
    if (a !== undefined) setQty(String(a));
  }, [answers, dirtySteps]);

  const submit = async () => {
    const value = Number(qty);
    logger.event("ui:step4:submit", { quantity: value });
    const parsed = Step4Schema.safeParse({ quantity: value });
    if (!parsed.success) return;
    await setAnswer(4, parsed.data);
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>총 제작 수량은 몇 개(벌)인가요?</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-2 py-1 text-sm w-40"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => { setQty(e.target.value); markDirty(4); }}
          placeholder="수량 입력"
        />
      </div>
      </BubbleAnswer>
      {!isCurrent && dirtySteps.has(4) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={(loading || !qty) && !dirtySteps.has(4)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(4, { quantity: undefined });
            }}
          >
            {dirtySteps.has(4) ? "저장" : "건너뛰기"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

