"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Step8Schema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { BubbleQuestion } from "@/components/chat/BubbleQuestion";
import { BubbleAnswer } from "@/components/chat/BubbleAnswer";
import { showToast } from "@/lib/toast";
import { finalizeInquiry } from "@/lib/api";

export function Step8({ isCurrent = true }: { isCurrent?: boolean }) {
  const { setAnswer, loading, markDirty, dirtySteps, answers, sessionId, reset } = useChatStore();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (dirtySteps.has(8)) return;
    const prev = answers?.[8] as { name?: string; contact?: string } | undefined;
    if (prev?.name) setName(prev.name);
    if (prev?.contact) setContact(prev.contact);
  }, [answers, dirtySteps]);

  const submit = async () => {
    if (!consent) {
      showToast("개인정보 수집·이용에 동의해주셔야 진행이 가능합니다.");
      return;
    }
    logger.event("ui:step8:submit", { name, contact });
    const parsed = Step8Schema.safeParse({ name, contact, privacy_consent: consent });
    if (!parsed.success) return;
    const ok = await setAnswer(8, parsed.data);
    if (ok) {
      try {
        await finalizeInquiry(sessionId);
      } catch (e) {
        logger.error("ui:finalize:error", e);
      }
      setShowComplete(true);
      setTimeout(() => {
        reset();
        if (typeof window !== 'undefined') window.location.reload();
      }, 5000);
    }
  };

  return (
    <div className="space-y-2">
      <BubbleQuestion>성함과 연락처를 남겨주세요</BubbleQuestion>
      <BubbleAnswer>
      <div className="flex flex-col gap-2 mb-2">
        <input className="border rounded px-2 py-1 text-sm" placeholder="이름" value={name} onChange={(e) => { setName(e.target.value); markDirty(8); }} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="전화번호 또는 이메일" value={contact} onChange={(e) => { setContact(e.target.value); markDirty(8); }} />
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={consent} onChange={(e)=> { setConsent(e.target.checked); markDirty(8); }} />
          <span>
            개인정보 수집·이용에 동의합니다 (이름·연락처는 상담 목적 외에 사용되지 않으며, 보관 기간은 상담 완료 후 관련 법령에 따릅니다)
          </span>
        </label>
      </div>
      </BubbleAnswer>
      {!isCurrent && dirtySteps.has(8) && (
        <div className="flex justify-end mt-1">
          <div className="flex gap-2 text-xs">
            <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit}>저장</button>
          </div>
        </div>
      )}
      {isCurrent && (
      <div className="flex justify-end mt-1">
        <div className="flex gap-2 text-xs">
          <button className="px-2 py-1 rounded border bg-white hover:bg-gray-50 whitespace-nowrap" onClick={submit} disabled={((loading || !name || !contact || !consent) && !dirtySteps.has(8))}>
            제출
          </button>
        </div>
      </div>
      )}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-lg">
            <button aria-label="close" onClick={() => { setShowComplete(false); reset(); if (typeof window !== 'undefined') window.location.reload(); }} className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8">✕</button>
            <div className="text-lg font-semibold mb-3">접수가 완료되었습니다.</div>
            <div className="text-sm text-gray-700">제작 전문 담당자가 곧 연락드​리겠습니다.😊</div>
          </div>
        </div>
      )}
    </div>
  );
}

