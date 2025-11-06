import React, { useEffect, useRef } from "react";

export function Chat({
  chat,
  onSend,
  onBookingRequest,
  disabled,
  systemThinking,
}: {
  chat: Array<{ role: string; content: string }>;
  onSend: (text: string) => void;
  onBookingRequest: () => void;
  disabled?: boolean;
  systemThinking?: boolean;
}) {
  const [value, setValue] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat, systemThinking]);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  // Show booking button after a few exchanges
  const showBookingButton = chat.length >= 4;

  return (
    <div className="slide-up">
      <div className="card mb-6">
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">
              {systemThinking ? "Typing..." : "Online"}
            </p>
          </div>
        </div>

        <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
          {chat.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"} fade-in`}
            >
              <div className={turn.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                {turn.content}
              </div>
            </div>
          ))}
          
          {systemThinking && (
            <div className="flex justify-start fade-in">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Booking CTA - appears after some conversation */}
      {showBookingButton && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Ready to dive deeper?</p>
              <p className="text-xs text-blue-700">Book a free 30-minute discovery session</p>
            </div>
            <button
              onClick={onBookingRequest}
              className="button-primary text-sm px-4 py-2"
            >
              Book Session 📅
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          ref={inputRef}
          className="input-field flex-1"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
        />
        <button
          className="button-primary px-6"
          type="submit"
          disabled={!value.trim() || disabled}
        >
          <span className="flex items-center space-x-1">
            <span>Send</span>
            <span>↗</span>
          </span>
        </button>
      </form>
    </div>
  );
}
