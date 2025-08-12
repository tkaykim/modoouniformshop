import { PropsWithChildren } from "react";

export function BubbleQuestion({ children }: PropsWithChildren) {
  return (
    <div className="flex w-full items-end gap-2">
      <div className="w-7 h-7 rounded-lg bg-[#0052cc] text-white text-xs font-bold flex items-center justify-center select-none">
        M
      </div>
      <div className="max-w-[80%] bg-blue-50 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

