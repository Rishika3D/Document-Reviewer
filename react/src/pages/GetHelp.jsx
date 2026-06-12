import React, { useState } from 'react';
import { ToolShell, Panel, PrimaryButton, inputClass, textareaClass } from '../components/ToolShell';

const GetHelp = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: connect this with the backend
    console.log({ subject, message, email });
    setSubmitted(true);

    setSubject('');
    setMessage('');
    setEmail('');
  };

  return (
    <ToolShell
      kicker="Support"
      title="We're"
      accent="listening."
      blurb="Hit a snag or have an idea? Tell us about it and we'll get back to you soon."
    >
      <div className="max-w-2xl">
        {submitted ? (
          <Panel className="rise rise-2">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-moss/15 text-moss flex items-center justify-center">✓</span>
              <div>
                <p className="font-display text-lg mb-0.5">Message sent</p>
                <p className="text-sm text-ink-soft">
                  Thanks for reaching out — we'll reply to your email shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-sm text-rust hover:text-rust-deep underline underline-offset-4"
                >
                  Send another message
                </button>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel className="rise rise-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm text-ink-soft mb-1.5">Your email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm text-ink-soft mb-1.5">Subject</label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's going on?"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-ink-soft mb-1.5">Message</label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  className={textareaClass}
                />
              </div>

              <PrimaryButton type="submit">Send message</PrimaryButton>
            </form>
          </Panel>
        )}
      </div>
    </ToolShell>
  );
};

export default GetHelp;
