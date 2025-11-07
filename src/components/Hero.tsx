import React, { useEffect, useRef } from "react";
import { DemosceneCanvas } from "./DemosceneCanvas";

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
    <section className="hero-shell" aria-labelledby="hero-heading">
      <div className="hero-media" aria-hidden>
        <DemosceneCanvas className="hero-media-canvas" intensity={1.1} />
        <div className="hero-media-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-panel slide-up" role="presentation">
          <div className="flex flex-col gap-10">
            <header className="space-y-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="hero-logo">🤖</div>
                <span className="text-sm uppercase tracking-[0.35em] text-slate-200/70">
                  The AI Guy
                </span>
              </div>
              <div className="space-y-4">
                <h1
                  id="hero-heading"
                  className="text-4xl sm:text-5xl font-semibold leading-tight text-white"
                >
                  Turn ambitious ideas into automated reality.
                </h1>
                <p className="text-lg sm:text-xl text-slate-200/90 max-w-2xl mx-auto sm:mx-0">
                  Tell us what you want AI to accomplish and we will blueprint the
                  roadmap, orchestrate the agents, and book a strategy session to
                  get you there.
                </p>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Lead capture">
              <div className="relative">
                <input
                  ref={inputRef}
                  className="hero-input"
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={placeholder}
                  disabled={isSubmitting}
                  aria-label="Describe your AI opportunity"
                />
                {value && (
                  <div className="hero-input-indicator" aria-hidden>
                    <span className="text-emerald-400">✓</span>
                  </div>
                )}
              </div>

              <button
                className="hero-cta"
                type="submit"
                disabled={!value.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="hero-cta-loading" aria-live="polite">
                    <span className="hero-spinner" />
                    <span>Starting conversation…</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Launch discovery chat</span>
                    <span aria-hidden>→</span>
                  </span>
                )}
              </button>
            </form>

            <div className="hero-trust">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">
                Trusted by ambitious teams
              </p>
              <div className="hero-trust-icons">
                <span aria-hidden>🏢</span>
                <span aria-hidden>🚀</span>
                <span aria-hidden>💡</span>
                <span aria-hidden>⚡</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
