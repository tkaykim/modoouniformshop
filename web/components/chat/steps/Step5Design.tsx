"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step5Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

const OPTIONS = [
  { key: "complete", label: "디자인은 모두 완성되어 있어요" },
  { key: "assets_only", label: "로고/이미지는 있는데 아직 배치하지 못했어요" },
  { key: "need_help", label: "디자인을 도와주세요" },
] as const;

export function Step5({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, loading, markDirty, dirtySteps, answers } = useChatStore();
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (dirtySteps.has(5)) return;
    const obj = answers?.[5] as { design?: string } | undefined;
    const a = obj?.design;
    if (a) setValue(a);
  }, [answers, dirtySteps]);

  const submit = async () => {
    logger.event("ui:step5:submit", { value });
    const parsed = Step5Schema.safeParse({ design: value });
    if (!parsed.success) return;
    await setAnswer(5, parsed.data);
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>디자인은 어느정도 되어있나요?</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex flex-wrap gap-2 mb-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            className={`px-4 py-2 rounded-full border ${value === o.key ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => { setValue(o.key); markDirty(5); }}
          >
            {o.key === "assets_only" ? (
              <span className="text-[12px] md:text-[14px]" style={{ wordBreak: "keep-all" }}>
                로고/이미지는 있는데<wbr /> 아직 배치하지 못했어요
              </span>
            ) : (
              o.label
            )}
          </button>
        ))}
      </div>
      </BubbleAnswer>
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={(loading || !value) && !dirtySteps.has(5)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(5, { design: undefined });
            }}
          >
            {dirtySteps.has(5) ? "저장" : "건너뛰기"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

