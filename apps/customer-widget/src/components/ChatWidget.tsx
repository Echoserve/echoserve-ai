import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useChat } from "../hooks/useChat";
import Vapi from "@vapi-ai/web";

export const ChatWidget: React.FC = () => {
  const { messages, input, setInput, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [listening, setListening] = useState(false);
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi({ apiKey: process.env.VAPI_API_KEY });
    }
    const vapi = vapiRef.current;
    if (!vapi) return;
    if (listening) {
      vapi.start();
      vapi.on("transcript", (text: string) => {
        if (text.trim()) {
          sendMessage(text);
        }
      });
    } else {
      vapi.stop();
    }
    return () => {
      vapi.off("transcript");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // Read bot reply aloud
  useEffect(() => {
    if (!vapiRef.current) return;
    const vapi = vapiRef.current;
    if (messages.length > 0 && messages[messages.length - 1].role === "bot") {
      const lastBotMsg = messages[messages.length - 1].text;
      vapi.tts(lastBotMsg);
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <Card className="rounded-2xl shadow-2xl border-0 bg-white/95">
        <CardContent className="p-0 flex flex-col h-[420px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-gray-400 mb-1">
                  {msg.sender === "user" ? "You:" : "EchoServe AI:"}
                </span>
                <div
                  className={`px-4 py-2 rounded-xl max-w-[80%] text-sm whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-400 mb-1">EchoServe AI:</span>
                <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4 text-blue-500" />
                  <span>Typing…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input + Voice Toggle */}
          <div className="flex items-center border-t px-3 py-2 bg-white gap-2">
            <Input
              className="flex-1 rounded-full bg-gray-50 focus:bg-white"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isLoading}
              autoFocus
            />
            <Button
              className="rounded-full px-4"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="default"
            >
              Send
            </Button>
            <Button
              className={`rounded-full p-2 ${listening ? "bg-blue-100" : "bg-gray-100"}`}
              onClick={() => setListening((l) => !l)}
              variant="ghost"
              aria-label={listening ? "Stop voice" : "Start voice"}
            >
              {listening ? <MicOff className="w-5 h-5 text-blue-500 animate-pulse" /> : <Mic className="w-5 h-5 text-gray-500" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWidget;
