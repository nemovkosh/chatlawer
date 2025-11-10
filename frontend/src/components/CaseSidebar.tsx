import clsx from "clsx";
import type { ChatSummary, CaseSummary } from "../types";

interface CaseSidebarProps {
  cases: CaseSummary[];
  onRefreshCases: () => void;
  activeCaseId: string | null;
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectCase: (caseId: string) => void;
  onSelectChat: (chatId: string) => void;
  onCreateChat: (caseId: string) => void;
}

export function CaseSidebar({
  cases,
  onRefreshCases,
  activeCaseId,
  chats,
  activeChatId,
  onSelectCase,
  onSelectChat,
  onCreateChat,
}: CaseSidebarProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Cases</h2>
          <button
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            onClick={onRefreshCases}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cases.map((legalCase) => {
          const isActiveCase = legalCase.id === activeCaseId;
          return (
            <div key={legalCase.id} className="border-t border-slate-100">
              <button
                className={clsx(
                  "flex w-full flex-col px-5 py-3 text-left transition",
                  isActiveCase ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                )}
                onClick={() => onSelectCase(legalCase.id)}
              >
                <span className="text-sm font-medium">{legalCase.title}</span>
                <span className="mt-1 text-xs text-slate-500">
                  {legalCase.tags?.length ? legalCase.tags.join(" • ") : "No tags"}
                </span>
              </button>
              {isActiveCase && (
                <div className="space-y-1 bg-slate-50 px-4 py-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Chats</span>
                    <button
                      className="text-primary-600 hover:text-primary-700"
                      onClick={() => onCreateChat(legalCase.id)}
                    >
                      + New
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={clsx(
                          "rounded-md px-2 py-2 text-left text-sm transition",
                          chat.id === activeChatId
                            ? "bg-white font-medium text-primary-600 shadow"
                            : "hover:bg-white"
                        )}
                      >
                        {chat.title}
                      </button>
                    ))}
                    {!chats.length && (
                      <p className="rounded-md bg-white px-2 py-2 text-xs text-slate-400">
                        No chats yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!cases.length && (
          <div className="px-5 py-6 text-sm text-slate-500">No cases yet. Create one from the backend.</div>
        )}
      </div>
    </aside>
  );
}

