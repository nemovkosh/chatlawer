import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./index.css";
import {
  fetchCases,
  fetchChats,
  fetchDocuments,
  fetchMessages,
  createMessage,
  createChat,
  streamAssistantMessage,
} from "./services/api";
import { CaseSidebar } from "./components/CaseSidebar";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { DocumentPanel } from "./components/DocumentPanel";
import type { CaseSummary, ChatSummary, DocumentSummary, Message } from "./types";
import { createCaseWithChat } from "./services/bootstrap";

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("legal-ai-user-id");
    if (stored) {
      setUserId(stored);
      return;
    }
    const newUserId = crypto.randomUUID();
    localStorage.setItem("legal-ai-user-id", newUserId);
    setUserId(newUserId);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    fetchCases(userId)
      .then((data) => setCases(data))
      .catch((error) => console.error("Failed to load cases", error));
  }, [userId]);

  useEffect(() => {
    if (!activeCaseId && cases.length) {
      setActiveCaseId(cases[0].id);
    }
  }, [cases, activeCaseId]);

  useEffect(() => {
    if (!activeCaseId) {
      setChats([]);
      setDocuments([]);
      return;
    }

    fetchChats(activeCaseId)
      .then((data) => {
        setChats(data);
        if (!data.find((chat) => chat.id === activeChatId)) {
          setActiveChatId(data[0]?.id ?? null);
        }
      })
      .catch((error) => console.error("Failed to load chats", error));

    fetchDocuments(activeCaseId)
      .then(setDocuments)
      .catch((error) => console.error("Failed to load documents", error));
  }, [activeCaseId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChatId)
      .then(setMessages)
      .catch((error) => console.error("Failed to load messages", error));
  }, [activeChatId]);

  const combinedMessages = useMemo(() => {
    if (!streamingContent) {
      return messages;
    }
    return [
      ...messages,
      {
        id: "streaming",
        chat_id: activeChatId ?? "",
        role: "assistant",
        content: streamingContent,
        created_at: new Date().toISOString(),
      } satisfies Message,
    ];
  }, [messages, streamingContent, activeChatId]);

  async function handleSendMessage(content: string) {
    const ensureChat = async (): Promise<string | null> => {
      if (activeCaseId && activeChatId) {
        return activeChatId;
      }
      if (!userId) {
        console.warn("No user in context; cannot create case.");
        return null;
      }
      if (!cases.length) {
        const caseTitle =
          import.meta.env.VITE_INITIAL_CASE_TITLE ||
          `Первое дело ${new Date().toLocaleString()}`;
        const chatTitle = `Чат ${new Date().toLocaleTimeString()}`;
        const { caseItem, chat } = await createCaseWithChat(userId, caseTitle, chatTitle);
        setCases([caseItem]);
        setActiveCaseId(caseItem.id);
        setChats([chat]);
        setActiveChatId(chat.id);
        setDocuments([]);
        setMessages([]);
        return chat.id;
      }
      const targetCaseId = activeCaseId ?? cases[0]?.id ?? null;
      if (!targetCaseId) {
        return null;
      }
      if (!activeCaseId) {
        setActiveCaseId(targetCaseId);
      }
      const chatTitle = `Чат ${new Date().toLocaleTimeString()}`;
      const newChat = await createChat(targetCaseId, chatTitle);
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      return newChat.id;
    };

    const resolvedChatId = await ensureChat();
    if (!resolvedChatId) {
      return;
    }

    setIsStreaming(true);
    try {
      const userMessage = await createMessage(resolvedChatId, { role: "user", content });
      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");

      await streamAssistantMessage(resolvedChatId, { role: "user", content }, (token) => {
        setStreamingContent((prev) => prev + token);
      });

      setStreamingContent("");
      const latestMessages = await fetchMessages(resolvedChatId);
      setMessages(latestMessages);
    } catch (error) {
      console.error("Failed to send message", error);
      setStreamingContent("An error occurred while generating a response. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleCreateChat(caseId: string) {
    try {
      const chatTitle = `Discussion ${new Date().toLocaleTimeString()}`;
      const newChat = await createChat(caseId, chatTitle);
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  }

  const handleCreateCase = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const title =
        prompt("Введите название дела") || `Дело ${new Date().toLocaleString()}`;
      const chatTitle = `Чат ${new Date().toLocaleTimeString()}`;
      const { caseItem, chat } = await createCaseWithChat(userId, title, chatTitle);
      setCases((prev) => [caseItem, ...prev]);
      setActiveCaseId(caseItem.id);
      setChats([chat]);
      setActiveChatId(chat.id);
      setDocuments([]);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create case", error);
    }
  }, [userId]);

  return (
    <div className="flex h-screen w-full bg-slate-100">
      <CaseSidebar
        cases={cases}
        onCreateCase={handleCreateCase}
        chats={chats}
        activeCaseId={activeCaseId}
        activeChatId={activeChatId}
        onSelectCase={setActiveCaseId}
        onSelectChat={setActiveChatId}
        onCreateChat={handleCreateChat}
      />
      <ChatWorkspace
        messages={combinedMessages}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
      />
      <DocumentPanel documents={documents} />
    </div>
  );
}

export default App;
