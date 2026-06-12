import React, { useState } from 'react';
import NavSum from '../components/NavSum';
import axios from 'axios';
import { API_BASE } from '../config';

const Rewrite = () => {
  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = `${API_BASE}/api/nlp/rewrite`;

  const toneOptions = ["Formal", "Informal", "Professional", "Friendly", "Humorous", "Assertive", "Persuasive"];
  const styleOptions = ["Bullet Points", "Narrative", "Dialogue", "Technical", "Academic", "Creative"];
  const audienceOptions = ["General Public", "Kids", "Professionals", "Beginners", "Experts"];

  const typeWriter = (fullText) => {
    setOutput("");
    setIsTyping(true);
    let i = 0;

    const interval = setInterval(() => {
      setOutput((prev) => prev + fullText.charAt(i));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);
  };

  const handleRewrite = async () => {
    if (!tone || !style || !audience || !prompt) return;
    
    setLoading(true);
    setError('');
    setOutput("Thinking...");

    try {
      const target = `${tone} tone, ${style} style, for ${audience}`;

      const response = await axios.post(
        API_URL,
        { text: prompt, target },
        { headers: { "Content-Type": "application/json" } }
      );

      const rewritten = response.data.rewritten || "No output returned.";
      typeWriter(rewritten);

    } catch (err) {
      setError("Rewrite failed. Check backend or HuggingFace access.");
      console.error("🔥 HF ERROR:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavSum />
      </div>

      <div className="flex-1 px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Rewrite Document</h1>
          <p className="text-gray-600 mb-8">
            Transform the tone, writing style, and target audience using AI.
          </p>

          <div className="space-y-6">

            <div>
              <label className="block mb-1 font-medium">Tone</label>
              <select className="w-full border rounded-lg p-3" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="">Select Tone</option>
                {toneOptions.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Style</label>
              <select className="w-full border rounded-lg p-3" value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="">Select Style</option>
                {styleOptions.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Audience</label>
              <select className="w-full border rounded-lg p-3" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="">Select Audience</option>
                {audienceOptions.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Text to Rewrite</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border rounded-lg p-3 h-40"
                placeholder="Paste or type content..."
              />
            </div>

            <button
              onClick={handleRewrite}
              className={`bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition ${
                (!tone || !style || !audience || !prompt) && "opacity-50 pointer-events-none"
              }`}
            >
              {loading ? "Rewriting..." : "Rewrite"}
            </button>

            {error && <div className="text-red-600 font-medium">{error}</div>}

            {output && (
              <div className="mt-6 p-4 border rounded bg-gray-50 whitespace-pre-wrap min-h-[160px]">
                <h2 className="font-semibold mb-2 text-lg">AI Output</h2>
                {output}
                {isTyping && <span className="animate-pulse ml-1">▌</span>}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewrite;
