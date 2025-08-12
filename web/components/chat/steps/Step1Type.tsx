"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { logger } from "@/lib/logger";
import { Step1Schema } from "@/lib/validators";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

export function Step1({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, dirtySteps, markDirty, answers } = useChatStore();
  const [value, setValue] = useState<string>("");

  // Prefill from stored answers so past selections appear highlighted
  useEffect(() => {
    if (dirtySteps.has(1)) return; // don't override unsaved edits
    const prev = answers?.[1] as { inquiry_kind?: string } | undefined;
    const a = prev?.inquiry_kind;
    if (a) setValue(a);
  }, [answers, dirtySteps]);

  const submit = async () => {
    logger.event("ui:step1:submit", { value });
    const parsed = Step1Schema.safeParse({ inquiry_kind: value });
    if (!parsed.success) return;
    await setAnswer(1, parsed.data);
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>
        단체복/커스텀 굿즈에 관심이 있으신가요?
        <div className="text-xs text-gray-500 mt-1">간단한 설문 후 담당자가 곧 답변드릴 예정입니다.</div>
      </BubbleQuestion>
      <BubbleAnswer>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            className={`px-4 py-2 rounded-full border ${value === "단체복" ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => { setValue("단체복"); markDirty(1); }}
          >
            단체복
          </button>
          <button
            className={`px-4 py-2 rounded-full border ${value === "커스텀 소량 굿즈" ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => { setValue("커스텀 소량 굿즈"); markDirty(1); }}
          >
            커스텀 소량 굿즈
          </button>
        </div>
      </BubbleAnswer>
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={!value && !dirtySteps.has(1)}>
            다음
          </button>
          <button className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap" onClick={() => setValue("")}
          >건너뛰기</button>
        </div>
      </div>
      )}
      {!isCurrent && dirtySteps.has(1) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap"
              onClick={submit} disabled={!value}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}

