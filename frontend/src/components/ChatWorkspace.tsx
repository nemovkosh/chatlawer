import { Message } from "../types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface ChatWorkspaceProps {
  messages: Message[];
  onSendMessage: (value: string) => Promise<void>;
  isStreaming: boolean;
}

export function ChatWorkspace({ messages, onSendMessage, isStreaming }: ChatWorkspaceProps) {
  return (
    <section className="flex flex-1 flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Lexi — Legal AI Assistant</h1>
          <p className="text-sm text-slate-500">
            Structured legal reasoning grounded in your uploaded case materials.
          </p>
        </div>
      </header>
      <MessageList messages={messages} />
      <MessageInput onSubmit={onSendMessage} disabled={isStreaming} />
    </section>
  );
}

