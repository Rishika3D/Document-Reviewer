import NavSum from "./NavSum";

// Shared chrome for the AI tool pages: sticky nav, editorial header,
// and a consistent paper/card treatment.
export function ToolShell({ kicker, title, accent, blurb, children }) {
  return (
    <div className="grain flex flex-col min-h-screen bg-paper">
      <div className="sticky top-0 z-50">
        <NavSum />
      </div>

      <div className="flex-1 px-6 lg:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <header className="rise rise-1 mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-rust mb-3">
              {kicker}
            </p>
            <h1 className="font-display text-4xl font-light tracking-tight">
              {title} {accent && <em className="text-rust font-normal">{accent}</em>}
            </h1>
            {blurb && (
              <p className="mt-3 max-w-xl text-ink-soft leading-relaxed">{blurb}</p>
            )}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}

export function Panel({ label, className = "", children }) {
  return (
    <section className={`bg-card border border-line rounded-2xl ${className}`}>
      {label && (
        <p className="px-5 pt-4 pb-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          {label}
        </p>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PrimaryButton({ loading, loadingLabel, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="inline-flex items-center justify-center gap-2 bg-ink text-paper font-medium px-7 py-2.5 rounded-xl transition-all hover:bg-rust hover:shadow-lift active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-paper/40 border-t-paper rounded-full animate-spin" />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}

export const inputClass =
  "w-full px-4 py-3 text-[15px] bg-paper border border-line rounded-xl focus:outline-none focus:border-rust focus:ring-2 focus:ring-rust/15 transition";

export const textareaClass = `${inputClass} resize-none leading-relaxed`;
