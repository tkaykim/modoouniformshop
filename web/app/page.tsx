"use client";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function Home() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">상담 챗봇</h1>
      <ChatContainer />
    </main>
  );
}
