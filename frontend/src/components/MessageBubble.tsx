import clsx from "clsx";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const sanitized = DOMPurify.sanitize(marked.parse(message.content) as string);

  return (
    <div className={clsx("flex w-full", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={clsx(
          "max-w-2xl rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200",
          isAssistant ? "bg-white text-slate-800" : "bg-primary-600 text-white"
        )}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}

