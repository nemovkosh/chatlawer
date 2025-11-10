import { FormEvent, useState } from "react";

interface MessageInputProps {
  disabled?: boolean;
  onSubmit: (value: string) => Promise<void>;
}

export function MessageInput({ disabled, onSubmit }: MessageInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    const trimmed = value.trim();
    setValue("");
    await onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
        <textarea
          className="h-20 w-full resize-none border-0 bg-transparent text-sm text-slate-800 outline-none"
          placeholder="Ask Lexi for legal analysis..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">Shift+Enter for newline. Answers include explicit citations when possible.</p>
    </form>
  );
}

