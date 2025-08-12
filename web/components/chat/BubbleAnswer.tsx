import { PropsWithChildren } from "react";

export function BubbleAnswer({ children }: PropsWithChildren) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[80%] bg-white text-gray-900 rounded-2xl rounded-br-sm px-3 py-2 shadow-md self-end">
        {children}
      </div>
    </div>
  );
}

