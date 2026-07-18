import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import { chatApi } from "./services/api";
import type { Conversation, Message } from "./types/chat";

/** Coordinates the two-panel chat app and polling intervals. */
export default function App() {
  const queryClient = useQueryClient();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: chatApi.listConversations, refetchInterval: 5000 });
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeConversation = useMemo(
    () => conversations.data?.find((conversation) => conversation.id === activeId) ?? conversations.data?.[0],
    [activeId, conversations.data]
  );

  useEffect(() => {
    chatApi.heartbeat();
    const id = window.setInterval(() => chatApi.heartbeat(), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeId && conversations.data?.[0]) setActiveId(conversations.data[0].id);
  }, [activeId, conversations.data]);

  /** Invalidates list data when message state changes. */
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
  }

  return (
    <main className={styles.shell}>
      <ConversationSidebar conversations={conversations.data ?? []} activeId={activeConversation?.id} onSelect={setActiveId} />
      {activeConversation ? <ChatPanel conversation={activeConversation} onRefresh={refresh} /> : <section className={styles.empty}>No conversations yet.</section>}
    </main>
  );
}

interface SidebarProps {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (id: number) => void;
}

/** Renders the polling conversation list with unread badges. */
function ConversationSidebar({ conversations, activeId, onSelect }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <h1>Polling Chat</h1>
      {conversations.map((conversation) => (
        <button className={`${styles.conversation} ${conversation.id === activeId ? styles.active : ""}`} key={conversation.id} onClick={() => onSelect(conversation.id)}>
          <strong>{conversation.name ?? conversation.members.map((member) => member.display_name).join(", ")}</strong>
          <span>{conversation.last_message?.content ?? "No messages yet"}</span>
          {conversation.unread_count > 0 && <b>{conversation.unread_count}</b>}
        </button>
      ))}
    </aside>
  );
}

interface ChatPanelProps {
  conversation: Conversation;
  onRefresh: () => void;
}

/** Renders messages and sends polling requests for the active conversation. */
function ChatPanel({ conversation, onRefresh }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const messages = useQuery({ queryKey: ["messages", conversation.id], queryFn: () => chatApi.getMessages(conversation.id) });
  const lastId = messages.data?.messages.at(-1)?.id;
  const newMessages = useQuery({
    queryKey: ["messages", conversation.id, "new", lastId],
    queryFn: () => chatApi.getNewMessages(conversation.id, lastId),
    enabled: Boolean(lastId),
    refetchInterval: 2000
  });
  const typingUsers = useQuery({ queryKey: ["typing", conversation.id], queryFn: () => chatApi.typingUsers(conversation.id), refetchInterval: 2000 });
  const searchResults = useQuery({ queryKey: ["search", conversation.id, search], queryFn: () => chatApi.search(search, conversation.id), enabled: search.length > 1 });
  const send = useMutation({ mutationFn: () => chatApi.sendMessage(conversation.id, draft), onSuccess: () => { setDraft(""); onRefresh(); } });
  const react = useMutation({ mutationFn: ({ id, emoji }: { id: number; emoji: string }) => chatApi.addReaction(id, emoji), onSuccess: onRefresh });

  useEffect(() => {
    if (newMessages.data?.length) {
      queryClient.setQueryData(["messages", conversation.id], (current: { messages: Message[]; nextCursor: number | null } | undefined) => ({
        messages: [...(current?.messages ?? []), ...newMessages.data],
        nextCursor: current?.nextCursor ?? null
      }));
    }
  }, [conversation.id, newMessages.data, queryClient]);

  useEffect(() => {
    if (lastId) chatApi.markRead(conversation.id, lastId);
  }, [conversation.id, lastId]);

  /** Sends a typing indicator when the draft changes. */
  function handleDraft(value: string) {
    setDraft(value);
    if (value.trim()) chatApi.typing(conversation.id);
  }

  const visibleMessages = searchResults.data?.length ? searchResults.data : messages.data?.messages ?? [];

  return (
    <section className={styles.chat}>
      <header className={styles.header}>
        <div>
          <h2>{conversation.name ?? "Direct message"}</h2>
          <p>{conversation.members.map((member) => `${member.display_name} (${member.status})`).join(" - ")}</p>
        </div>
        <input className={styles.search} placeholder="Search messages" value={search} onChange={(event) => setSearch(event.target.value)} />
      </header>
      <div className={styles.messages}>
        {visibleMessages.map((message) => (
          <article className={styles.message} key={message.id}>
            <strong>{message.sender?.display_name ?? `User ${message.user_id}`}</strong>
            <p>{message.is_deleted ? "Message deleted" : message.content}</p>
            <small>{message.is_edited ? "edited - " : ""}{new Date(message.created_at).toLocaleString()}</small>
            <div className={styles.reactions}>
              {(message.reactions ?? []).map((item) => (
                <span key={item.emoji}>{item.emoji} {item.count}</span>
              ))}
              {["👍", "❤️", "😂"].map((emoji) => (
                <button key={emoji} onClick={() => react.mutate({ id: message.id, emoji })}>{emoji}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className={styles.typing}>{typingUsers.data?.map((user) => user.display_name).join(", ")} {typingUsers.data?.length ? "typing..." : ""}</p>
      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim()) send.mutate();
        }}
      >
        <input value={draft} onChange={(event) => handleDraft(event.target.value)} placeholder="Write a message" />
        <button>Send</button>
      </form>
    </section>
  );
}

