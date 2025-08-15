"use client";
import { useState, useEffect } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { X } from "lucide-react";

export function ChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <button aria-label="close" onClick={onClose} className="absolute top-3 right-3 bg-white text-[--color-brand] border border-[--color-brand] rounded-full w-8 h-8 flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">빠른 상담</h2>
          <ChatContainer disableAutoCenter />
        </div>
      </div>
    </div>
  );
}

