import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  FileQuestion,
  FolderOpen,
  MessagesSquare,
  Paperclip
} from "lucide-react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Pane } from "@/FocusLayout";

type Message = {
  role: "user" | "assistant";
  content: string;
  created_at: Date;
};

type Attachment = {
  id: string;
  type: "exam_question" | "flashcard" | "topic";
};

type Chat = {
  id: string;
  stack_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  messages: Message[];
  attachments: Attachment[];
};

export default function ChatManager({ layout }: { layout: string }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [creationLoading, setCreationLoading] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const stackId = useOutletContext<string>();
  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeAttachments = activeChat?.attachments.map((a) => {
    if (a.type === "topic") {
      console.log(topics.find((t) => t.id === a.id));
      console.log(topics);
      console.log(a.id);
      return (
        <Badge
          key={a.id}
          onClick={() => deleteItem(a.id)}
          className="cursor-pointer"
        >
          <BookOpen className="w-2 h-2" />
          {`${topics.find((t) => t.id === a.id)?.name}`}
        </Badge>
      );
    } else if (a.type === "flashcard") {
      console.log(a.id);
      return (
        <Badge
          key={a.id}
          onClick={() => deleteItem(a.id)}
          className="cursor-pointer"
        >
          <FolderOpen className="w-2 h-2" />
          {`Flashcard: ${flashcards.find((f) => f.id === a.id)?.front}`}
        </Badge>
      );
    } else if (a.type === "exam_question") {
      return (
        <Badge
          key={a.id}
          onClick={() => deleteItem(a.id)}
          className="cursor-pointer"
        >
          <FileQuestion className="w-2 h-2" />
          {`Question: ${questions.find((q) => q.id === a.id)?.text.slice(0, 30)}...`}
        </Badge>
      );
    }
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [t, f, q] = await Promise.all([
          api.get(`/stacks/${stackId}/topics`),
          api.get(`/flashcards/stack/${stackId}`),
          api.get(`/exams/stack/${stackId}/questions`)
        ]);
        setTopics(t.data);
        setFlashcards(f.data);
        setQuestions(q.data);
      } catch (e) {
        console.error("Error loading data:", e);
      }
    }
    loadData();
  }, [stackId]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get(`/chats/stacks/${stackId}/sessions`);
        setChats(
          response.data
            .map((chat: any) => {
              return {
                ...chat,
                created_at: new Date(chat.created_at),
                updated_at: new Date(chat.updated_at),
                attachments: chat.attachments.map((att: any) => ({
                  id: att.ref_id,
                  type: att.type
                }))
              };
            })
            .sort(
              (a: Chat, b: Chat) =>
                b.updated_at.getTime() - a.updated_at.getTime()
            )
        );
        if (layout === "chat0" || layout === "chat1") {
          setActiveChatId(response.data[0]?.id || null);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, [stackId, layout]);

  const createChat = async () => {
    try {
      setCreationLoading(true);
      const response = await api.post(`/chats/stacks/${stackId}/create`);
      const newChat = {
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at)
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setCreationLoading(false);
    }
  };

  const deleteChat = (id: string) => {
    try {
      api.post(`/chats/sessions/${id}/delete`);
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const newMsg: Message = {
      role: "user",
      content: input,
      created_at: new Date()
    };
    try {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? { ...c, messages: [...c.messages, newMsg] }
            : c
        )
      );
      setAssistantLoading(true);
      await api.post(`/chats/sessions/${activeChat.id}/messages`, newMsg);
      const assistantResponse = await api.post(
        `/chats/sessions/${activeChat.id}/llm`
      );
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                title: assistantResponse.data.title,
                messages: [...c.messages, assistantResponse.data.message]
              }
            : c
        )
      );
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const attachItem = async (
    type: "topic" | "flashcard" | "exam_question",
    refId: string
  ) => {
    try {
      const response = await api.post(
        `/chats/sessions/${activeChatId}/attachments`,
        { type, ref_id: refId }
      );
      const attachment = response.data;
      activeChatId &&
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  attachments: [
                    ...c.attachments,
                    { id: attachment.ref_id, type: attachment.type }
                  ]
                }
              : c
          )
        );
    } catch (error) {
      console.error("Error attaching item:", error);
    }
  };

  const deleteItem = async (attachmentId: string) => {
    try {
      await api.post(`/chats/sessions/${activeChatId}/delete_attachment`, {
        attachment_id: attachmentId
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                attachments: c.attachments.filter(
                  (att) => att.id !== attachmentId
                )
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="flex min-h-0 h-full">
      {/* Sidebar: list of chats */}
      <div className="w-1/4 border-r p-2 space-y-2">
        <Button
          disabled={creationLoading}
          onClick={createChat}
          className="w-full"
          variant="secondary"
        >
          {creationLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}{" "}
          New Chat
        </Button>
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={`p-0 cursor-pointer ${
                  activeChatId === chat.id ? "border-primary" : ""
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between p-2">
                  <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium wrap">
                      {chat.title}
                    </CardTitle>
                    <CardDescription className="flex flex-col text-xs">
                      {chat.updated_at.toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeChat ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Pinned attachments */}
            {activeChat.attachments && activeChat.attachments.length > 0 && (
              <div className="bg-muted text-xs border-b p-2 flex items-center flex-wrap gap-2">
                Attachments:
                {activeAttachments &&
                  activeAttachments.length > 0 &&
                  activeAttachments}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2 p-4">
                {activeChat.messages.map((m, ind) => (
                  <div
                    key={`msg-${ind}`}
                    className={`p-2 rounded-lg max-w-[75%] ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ))}
                {assistantLoading && (
                  <div className="p-2 rounded-lg max-w-[75%] bg-muted">
                    <span className="flex space-x-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex-none p-2 border-t flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[400px] rounded-lg border shadow-lg bg-background"
                >
                  <Command className="">
                    <CommandInput placeholder="Search to attach..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Exam Questions">
                        {questions.map((q) => (
                          <CommandItem
                            key={q.id}
                            onSelect={() => attachItem("exam_question", q.id)}
                          >
                            <FileQuestion className="w-4 h-4" />{" "}
                            {q.text.slice(0, 50)}...
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Topics">
                        {topics.map((t) => (
                          <CommandItem
                            key={t.id}
                            onSelect={() => attachItem("topic", t.id)}
                          >
                            <BookOpen className="w-4 h-4" /> {t.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Flashcards">
                        {flashcards.map((f) => (
                          <CommandItem
                            key={f.id}
                            onSelect={() => attachItem("flashcard", f.id)}
                          >
                            <FolderOpen className="w-4 h-4" /> {f.front}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={assistantLoading}
              />
              <Button onClick={sendMessage} disabled={assistantLoading}>
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a chat
          </div>
        )}
      </div>
    </div>
  );
}

export const handleDiscuss = async (
  stackId: string,
  type: "topic" | "flashcard" | "exam_question",
  refId: string,
  setLayout: Dispatch<SetStateAction<Pane>>
) => {
  try {
    setLayout((prev) => (prev === "chat0" ? "chat1" : "chat0"));
    console.log("layout set");
    console.log(stackId, type, refId);
    const chatRes = await api.post(`/chats/stacks/${stackId}/create`, {
      title: "New Chat"
    });
    const chatId = chatRes.data.id;

    await api.post(`/chats/sessions/${chatId}/attachments`, {
      type,
      ref_id: refId
    });
    setLayout((prev) => (prev === "chat0" ? "chat1" : "chat0"));
  } catch (err) {
    console.error("Failed to start discuss flow:", err);
  }
};

export function DiscussionButton({
  stackId,
  type,
  refId,
  setLayout
}: {
  stackId: string;
  type: "topic" | "flashcard" | "exam_question";
  refId: string;
  setLayout: (func: (layout: string) => void) => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDiscuss = async () => {
    try {
      setLoading(true);
      setLayout((prev) => (prev === "chat0" ? "chat1" : "chat0"));
      console.log("layout set");
      console.log(stackId, type, refId);
      const chatRes = await api.post(`/chats/stacks/${stackId}/create`, {
        title: "New Chat"
      });
      const chatId = chatRes.data.id;

      await api.post(`/chats/sessions/${chatId}/attachments`, {
        type,
        ref_id: refId
      });
      setLayout((prev) => (prev === "chat0" ? "chat1" : "chat0"));
    } catch (err) {
      console.error("Failed to start discuss flow:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      className="ml-2 rounded-full h-8 w-8"
      variant="outline"
      onClick={handleDiscuss}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessagesSquare className="h-4 w-4" />
      )}
    </Button>
  );
}
