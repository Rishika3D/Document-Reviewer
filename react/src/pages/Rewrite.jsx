import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { ToolShell, Panel, PrimaryButton, textareaClass } from '../components/ToolShell';

const toneOptions = ["Formal", "Informal", "Professional", "Friendly", "Humorous", "Assertive", "Persuasive"];
const styleOptions = ["Bullet Points", "Narrative", "Dialogue", "Technical", "Academic", "Creative"];
const audienceOptions = ["General Public", "Kids", "Professionals", "Beginners", "Experts"];

// Pill-style single select
const ChipGroup = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-sm text-ink-soft mb-2">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt === value ? '' : opt)}
          className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
            value === opt
              ? "bg-ink text-paper border-ink"
              : "bg-paper text-ink-soft border-line hover:border-ink-faint hover:text-ink"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const Rewrite = () => {
  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeWriter = (fullText) => {
    setOutput("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setOutput(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 10);
  };

  const handleRewrite = async () => {
    if (!tone || !style || !audience || !prompt) return;

    setLoading(true);
    setError('');
    setOutput('');

    try {
      const target = `${tone} tone, ${style} style, for ${audience}`;

      const response = await axios.post(
        `${API_BASE}/api/nlp/rewrite`,
        { text: prompt, target },
        { headers: { "Content-Type": "application/json" } }
      );

      typeWriter(response.data.rewritten || "No output returned.");
    } catch (err) {
      setError(err.response?.data?.error || "Rewrite failed. Is the backend running?");
      console.error("Rewrite error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const ready = tone && style && audience && prompt.trim();

  return (
    <ToolShell
      kicker="AI tool · 03"
      title="Rewrite it"
      accent="your way."
      blurb="Pick a tone, a style, and who it's for — the meaning stays, the voice changes."
    >
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="rise rise-2 flex flex-col gap-4">
          <Panel label="Voice">
            <div className="flex flex-col gap-5">
              <ChipGroup label="Tone" options={toneOptions} value={tone} onChange={setTone} />
              <ChipGroup label="Style" options={styleOptions} value={style} onChange={setStyle} />
              <ChipGroup label="Audience" options={audienceOptions} value={audience} onChange={setAudience} />
            </div>
          </Panel>

          <Panel label="Text to rewrite">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              className={textareaClass}
              placeholder="Paste or type your content…"
            />
          </Panel>

          <div className="flex items-center gap-4">
            <PrimaryButton onClick={handleRewrite} loading={loading} loadingLabel="Rewriting…" disabled={!ready}>
              Rewrite
            </PrimaryButton>
            {!ready && !loading && (
              <p className="text-sm text-ink-faint">Choose a tone, style, and audience to begin.</p>
            )}
            {error && <p className="text-sm text-rust-deep">{error}</p>}
          </div>
        </div>

        <Panel label="Rewritten" className="rise rise-3 lg:sticky lg:top-24">
          <div className="min-h-65 whitespace-pre-wrap text-[15px] leading-relaxed">
            {output || (
              <span className="text-ink-faint">The rewritten text will appear here.</span>
            )}
            {(loading || isTyping) && (
              <span className="inline-block w-2 h-4 ml-1 bg-rust align-middle animate-[blink-caret_1s_steps(1)_infinite]" />
            )}
          </div>
        </Panel>
      </div>
    </ToolShell>
  );
};

export default Rewrite;
