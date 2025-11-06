import React, { useEffect, useRef } from "react";

const PLACEHOLDER = "What would you like AI to do for your business?";

export function Hero({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = React.useState("");
  const [placeholder, setPlaceholder] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-type placeholder
  useEffect(() => {
    let i = 0;
    setPlaceholder("");
    const interval = setInterval(() => {
      setPlaceholder(PLACEHOLDER.slice(0, i + 1));
      i++;
      if (i >= PLACEHOLDER.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (placeholder === PLACEHOLDER) {
      inputRef.current?.focus();
    }
  }, [placeholder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isSubmitting) {
      setIsSubmitting(true);
      await onSubmit(value.trim());
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-12">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          The AI Guy
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform your business with AI. Get personalized recommendations and book a free discovery session.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            ref={inputRef}
            className="input-field text-lg py-4 pr-12"
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isSubmitting}
          />
          {value && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <span className="text-green-500">✓</span>
            </div>
          )}
        </div>
        
        <button
          className="button-primary w-full text-lg py-4 relative overflow-hidden"
          type="submit"
          disabled={!value.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Starting conversation...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <span>Get Started</span>
              <span>→</span>
            </span>
          )}
        </button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-4">Trusted by businesses worldwide</p>
        <div className="flex justify-center space-x-8 opacity-60">
          <div className="text-2xl">🏢</div>
          <div className="text-2xl">🚀</div>
          <div className="text-2xl">💡</div>
          <div className="text-2xl">⚡</div>
        </div>
      </div>
    </div>
  );
}
