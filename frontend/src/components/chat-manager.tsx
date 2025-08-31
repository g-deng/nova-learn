import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"
import api from "@/lib/api"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type Chat = {
  id: string
  title: string
  messages: Message[]
  attachment?: { type: "exam" | "flashcard"; id: string; text: string }
}

export default function ChatManager() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  const activeChat = chats.find((c) => c.id === activeChatId)

  const createChat = async () => {
    const response = await api.post("/chats", { title: "New Chat" })
    const newChat = response.data
    setChats((prev) => [...prev, newChat])
    setActiveChatId(newChat.id)
  }

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (activeChatId === id) setActiveChatId(null)
  }

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return
    const newMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, messages: [...c.messages, newMsg] } : c
      )
    )
    setInput("")
    // TODO: Call backend here and append assistant response
  }

  return (
    <div className="flex h-full">
      {/* Sidebar: list of chats */}
      <div className="w-1/3 border-r p-2 space-y-2">
        <Button onClick={createChat} className="w-full" variant="secondary">
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={`cursor-pointer ${
                  activeChatId === chat.id ? "border-primary" : ""
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between p-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {chat.title}
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChat(chat.id)
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
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Pinned attachment */}
            {activeChat.attachment && (
              <div className="bg-muted p-2 text-xs border-b">
                Attached {activeChat.attachment.type}:{" "}
                {activeChat.attachment.text}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 space-y-2">
              {activeChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg max-w-[75%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </ScrollArea>

            {/* Input */}
            <div className="p-2 border-t flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a chat
          </div>
        )}
      </div>
    </div>
  )
}
