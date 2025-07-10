import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Hi! How can I assist you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const saveMessage = async (role: "user" | "bot", message: string) => {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, role, message }),
    });
  };

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setLoading(true);
    await saveMessage("user", input);
    try {
      // Call the backend API with the full message history
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", text: input }] }),
      });
      const data = await res.json();
      // Simulate typing delay
      await new Promise((r) => setTimeout(r, 1000));
      let aiReply = data.reply || "Sorry, something went wrong.";
      let escalation = false;
      if (aiReply.includes("[create_ticket]")) {
        escalation = true;
      }
      // Always show the AI reply (with [create_ticket] trimmed if present)
      const aiReplyTrimmed = aiReply.replace("[create_ticket]", "").trim();
      setMessages((prev) => [...prev, { role: "bot", text: aiReplyTrimmed }]);
      await saveMessage("bot", aiReplyTrimmed);
      if (escalation) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "I’m escalating this to our human support team. You’ll hear back shortly.",
          },
        ]);
        await saveMessage("bot", "I’m escalating this to our human support team. You’ll hear back shortly.");
        // Call /api/ticket with last user message and original AI reply
        const lastUserMessage = input;
        const ticketRes = await fetch("/api/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: lastUserMessage,
            aiResponse: aiReply,
          }),
        });
        const ticketData = await ticketRes.json();
        if (ticketData && ticketData.ticketId) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: `Your support ticket has been created: ${ticketData.ticketId}`,
            },
          ]);
          await saveMessage("bot", `Your support ticket has been created: ${ticketData.ticketId}`);
        }
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, there was an error. Please try again." }]);
      await saveMessage("bot", "Sorry, there was an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    input: "",
    setInput: () => {}, // Placeholder for compatibility; actual input state should be managed in the component
  };
}
