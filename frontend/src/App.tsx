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

const USER_STORAGE_KEY = "legal-ai-user-id";
const generateCaseTitle = () =>
  import.meta.env.VITE_INITIAL_CASE_TITLE ||
  `Дело ${new Date().toLocaleString()}`;
const generateChatTitle = () => `Чат ${new Date().toLocaleTimeString()}`;

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
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      setUserId(stored);
      return;
    }
    const newUserId = crypto.randomUUID();
    localStorage.setItem(USER_STORAGE_KEY, newUserId);
    setUserId(newUserId);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    (async () => {
      try {
        const existingCases = await fetchCases(userId);
        if (existingCases.length === 0) {
          const { caseItem, chat } = await createCaseWithChat(
            userId,
            generateCaseTitle(),
            generateChatTitle(),
          );
          setCases([caseItem]);
          setActiveCaseId(caseItem.id);
          setChats([chat]);
          setActiveChatId(chat.id);
          setDocuments([]);
          setMessages([]);
        } else {
          setCases(existingCases);
          if (!activeCaseId) {
            setActiveCaseId(existingCases[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load or bootstrap cases", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
  }, [activeCaseId, activeChatId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChatId)
      .then(setMessages)
      .catch((error) => console.error("Failed to load messages", error));
  }, [activeChatId]);

  const ensureChatAvailable = useCallback(async (): Promise<string | null> => {
    if (activeCaseId && activeChatId) {
      return activeChatId;
    }
    if (!userId) {
      console.warn("No user in context; cannot create case.");
      return null;
    }

    if (!cases.length) {
      const { caseItem, chat } = await createCaseWithChat(
        userId,
        generateCaseTitle(),
        generateChatTitle(),
      );
      setCases([caseItem]);
      setActiveCaseId(caseItem.id);
      setChats([chat]);
      setActiveChatId(chat.id);
      setDocuments([]);
      setMessages([]);
      return chat.id;
    }

    const targetCaseId = activeCaseId ?? cases[0].id;
    if (!activeCaseId) {
      setActiveCaseId(targetCaseId);
    }

    if (chats.length > 0) {
      const firstChatId = chats[0].id;
      setActiveChatId(firstChatId);
      return firstChatId;
    }

    const newChat = await createChat(targetCaseId, generateChatTitle());
    setChats([newChat]);
    setActiveChatId(newChat.id);
    setMessages([]);
    return newChat.id;
  }, [activeCaseId, activeChatId, cases, chats, userId]);

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

  const handleSendMessage = useCallback(
    async (content: string) => {
      const resolvedChatId = await ensureChatAvailable();
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
    },
    [ensureChatAvailable],
  );

  const handleCreateChat = useCallback(async (caseId: string) => {
    try {
      const newChat = await createChat(caseId, generateChatTitle());
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  }, []);

  const handleCreateCase = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const { caseItem, chat } = await createCaseWithChat(
        userId,
        generateCaseTitle(),
        generateChatTitle(),
      );
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
