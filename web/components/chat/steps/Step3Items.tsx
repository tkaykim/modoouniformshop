"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { logger } from "@/lib/logger";
import { Step3Schema } from "@/lib/validators";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";

const OPTIONS = [
  "티셔츠",
  "아우터(바람막이,패딩,후드집업 등)",
  "운동유니폼(선수유니폼)",
  "앞치마",
  "직접입력",
];

export function Step3({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, markDirty, dirtySteps, answers } = useChatStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string>("");

  useEffect(() => {
    if (dirtySteps.has(3)) return;
    const a = answers?.[3] as { items?: string[]; item_custom?: string } | undefined;
    if (a?.items) setSelected(a.items);
    if (a?.item_custom) setCustom(a.item_custom);
  }, [answers, dirtySteps]);

  const toggle = (opt: string) => {
    logger.event("ui:step3:toggle", { opt });
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
    markDirty(3);
  };

  const submit = async () => {
    logger.event("ui:step3:submit", { selected, custom });
    const parsed = Step3Schema.safeParse({
      items: selected.filter((s) => s !== "직접입력"),
      item_custom: selected.includes("직접입력") ? custom : undefined,
    });
    if (!parsed.success) return;
    await setAnswer(3, parsed.data);
  };

  const showCustom = selected.includes("직접입력");

  return (
    <div className="space-y-2">
      <BubbleQuestion>어떤 품목을 제작하고 싶으신가요?</BubbleQuestion>
      <BubbleAnswer>
        <div className="flex flex-wrap gap-2 mb-2">
        {OPTIONS.map((o) => (
          <button
            key={o}
              className={`px-4 py-2 rounded-full border ${selected.includes(o) ? "bg-blue-600 text-white" : "bg-white text-black"}`}
            onClick={() => toggle(o)}
          >
            {o}
          </button>
        ))}
        </div>
      {showCustom && (
        <input
          className="border rounded px-2 py-1 text-sm mb-2 w-full"
          placeholder="직접 입력"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      )}
      </BubbleAnswer>
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={selected.length === 0 && !dirtySteps.has(3)}>
            다음
          </button>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            onClick={async () => {
              await setAnswer(3, { items: [], item_custom: undefined });
            }}
          >
            {dirtySteps.has(3) ? "저장" : "건너뛰기"}
          </button>
        </div>
      </div>
      )}
      {!isCurrent && dirtySteps.has(3) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}

