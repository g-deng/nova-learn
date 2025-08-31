import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useOutletContext } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
  created_at: Date;
};

type Attachment = {
  id: string;
  type: "exam_question" | "flashcard" | "topic";
  text: string;
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

export default function ChatManager() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [creationLoading, setCreationLoading] = useState(false);
  const stackId = useOutletContext<string>();

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get(`/chats/stacks/${stackId}/sessions`);
        setChats(response.data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, [stackId]);

  const createChat = async () => {
    try {
      setCreationLoading(true);
      const response = await api.post(`/chats/stacks/${stackId}/create`);
      const newChat = response.data;
      setChats((prev) => [...prev, newChat]);
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
      created_at: new Date(),
    };
    try {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id ? { ...c, messages: [...c.messages, newMsg] } : c
        )
      );
      setAssistantLoading(true);
      await api.post(`/chats/sessions/${activeChat.id}/messages`, newMsg);
      const assistantResponse = await api.post(`/chats/sessions/${activeChat.id}/llm`);
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id ? { ...c, title: assistantResponse.data.title, messages: [...c.messages, assistantResponse.data.message] } : c
        )
      );
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 h-full">
      {/* Sidebar: list of chats */}
      <div className="w-1/4 border-r p-2 space-y-2">
        <Button disabled={creationLoading} onClick={createChat} className="w-full" variant="secondary">
          {creationLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} New Chat
        </Button>
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={` cursor-pointer ${activeChatId === chat.id ? "border-primary" : ""
                  }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between p-2">
                  <CardTitle className="text-sm font-medium wrap">
                    {chat.title}
                  </CardTitle>
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
            {/* Pinned attachment */}
            {activeChat.attachments && activeChat.attachments.length > 0 && (
              <div className="bg-muted p-2 text-xs border-b">
                Attached {activeChat.attachments[0].type}:{" "}
                {activeChat.attachments[0].text}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2 p-4">
                {activeChat.messages.map((m, ind) => (
                  <div
                    key={`msg-${ind}`}
                    className={`p-2 rounded-lg max-w-[75%] ${m.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                      }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
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

            {/* Input bottom */}
            <div className="flex-none p-2 border-t flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
