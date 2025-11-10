import { useEffect, useMemo, useState } from "react";
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
import { CaseSummary, ChatSummary, DocumentSummary, Message } from "./types";

const DEMO_USER_ID = "demo-user";

function App() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");

  useEffect(() => {
    fetchCases(DEMO_USER_ID)
      .then((data) => setCases(data))
      .catch((error) => console.error("Failed to load cases", error));
  }, []);

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
    if (!activeChatId) {
      console.warn("No active chat selected.");
      return;
    }
    setIsStreaming(true);
    try {
      const userMessage = await createMessage(activeChatId, { role: "user", content });
      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");

      await streamAssistantMessage(activeChatId, { role: "user", content }, (token) => {
        setStreamingContent((prev) => prev + token);
      });

      setStreamingContent("");
      const latestMessages = await fetchMessages(activeChatId);
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

  return (
    <div className="flex h-screen w-full bg-slate-100">
      <CaseSidebar
        cases={cases}
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
