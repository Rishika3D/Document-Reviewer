import React, { useState } from "react";
import { API_BASE } from "../config";
import { ToolShell, Panel, PrimaryButton, textareaClass } from "../components/ToolShell";

const GrammarCheck = () => {
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const typeWriter = (text) => {
    setOutput("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setOutput(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 10);
  };

  const handleGrammarCheck = async () => {
    if (!inputText.trim()) {
      setError("Write or paste some text first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOutput("");

      const res = await fetch(`${API_BASE}/api/nlp/grammar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grammar check failed");
      typeWriter(data.correctedText || "No correction generated.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      kicker="AI tool · 04"
      title="Grammar,"
      accent="corrected."
      blurb="Fixes grammar, spelling, and punctuation — your wording and tone stay exactly as written."
    >
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="rise rise-2 flex flex-col gap-4">
          <Panel label="Your text">
            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={textareaClass}
              placeholder="Write or paste your paragraph here…"
            />
          </Panel>

          <div className="flex items-center gap-4">
            <PrimaryButton onClick={handleGrammarCheck} loading={loading} loadingLabel="Fixing…">
              Fix grammar
            </PrimaryButton>
            {error && <p className="text-sm text-rust-deep">{error}</p>}
          </div>
        </div>

        <Panel label="Corrected" className="rise rise-3 lg:sticky lg:top-24">
          <div className="min-h-65 whitespace-pre-wrap text-[15px] leading-relaxed">
            {output || (
              <span className="text-ink-faint">The corrected text will appear here.</span>
            )}
            {loading && <span className="inline-block w-2 h-4 ml-1 bg-rust align-middle animate-[blink-caret_1s_steps(1)_infinite]" />}
          </div>
        </Panel>
      </div>
    </ToolShell>
  );
};

export default GrammarCheck;
