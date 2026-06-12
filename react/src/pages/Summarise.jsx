import React, { useState } from 'react';
import { API_BASE } from '../config';
import { authHeaders } from '../auth';
import { ToolShell, Panel, PrimaryButton, inputClass, textareaClass } from '../components/ToolShell';

const Summarise = () => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [length, setLength] = useState('');
  const [format, setFormat] = useState('paragraph');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const typeWriter = (text) => {
    setSummary("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setSummary(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 12);
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError("Paste some text to summarise first.");
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const res = await fetch(`${API_BASE}/api/nlp/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: inputText, length: Number(length) || undefined, format }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarisation failed");
      typeWriter(data.summary || "No summary generated.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <ToolShell
      kicker="AI tool · 02"
      title="Summarise"
      accent="anything."
      blurb="Paste a document and get a faithful TL;DR — at the length and shape you choose."
    >
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Input column */}
        <div className="rise rise-2 flex flex-col gap-4">
          <Panel label="Source text">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className={textareaClass}
              placeholder="Paste the text you want summarised…"
            />
            <p className="mt-2 text-right font-mono text-[11px] text-ink-faint">
              {wordCount} words
            </p>
          </Panel>

          <Panel label="Options">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-36">
                <label className="block text-sm text-ink-soft mb-1.5">Target length (words)</label>
                <input
                  type="number"
                  min="10"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className={inputClass}
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-soft mb-1.5">Format</label>
                <div className="flex rounded-xl border border-line overflow-hidden">
                  {["paragraph", "bullets"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-4 py-2.5 text-sm capitalize transition-colors ${
                        format === f ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-cream"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex items-center gap-4">
            <PrimaryButton onClick={handleSummarize} loading={isLoading} loadingLabel="Summarising…">
              Generate summary
            </PrimaryButton>
            {error && <p className="text-sm text-rust-deep">{error}</p>}
          </div>
        </div>

        {/* Output column */}
        <Panel label="Summary" className="rise rise-3 lg:sticky lg:top-24">
          <div className="min-h-65 whitespace-pre-wrap text-[15px] leading-relaxed">
            {summary || (
              <span className="text-ink-faint">
                Your summary will appear here.
              </span>
            )}
            {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-rust align-middle animate-[blink-caret_1s_steps(1)_infinite]" />}
          </div>
        </Panel>
      </div>
    </ToolShell>
  );
};

export default Summarise;
