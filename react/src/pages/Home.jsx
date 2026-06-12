import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftBar from "../components/LeftBar";
import {
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiArrowUpRight,
} from "react-icons/fi";

const tools = [
  {
    n: "01",
    to: "/edit",
    icon: FiEdit3,
    title: "Open the editor",
    blurb: "Write, upload a PDF or DOCX, comment, and rewrite passages in place.",
  },
  {
    n: "02",
    to: "/summarise",
    icon: FiFileText,
    title: "Summarise",
    blurb: "Distill long documents into a clean TL;DR at the length you choose.",
  },
  {
    n: "03",
    to: "/rewrite",
    icon: FiRefreshCw,
    title: "Rewrite",
    blurb: "Shift tone, style, and audience without losing your meaning.",
  },
  {
    n: "04",
    to: "/grammar",
    icon: FiCheckCircle,
    title: "Grammar check",
    blurb: "Fix grammar, spelling, and punctuation — nothing else touched.",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function draftPreview() {
  const saved = localStorage.getItem("doc-draft");
  if (!saved) return null;
  const text = saved.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 180) : null;
}

function Home() {
  const draft = draftPreview();

  return (
    <div className="grain h-screen flex flex-col overflow-hidden bg-paper">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <LeftBar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
            {/* Hero */}
            <header className="rise rise-1 mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-rust mb-4">
                {greeting()} · your writing studio
              </p>
              <h1 className="font-display text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                Every draft deserves a{" "}
                <em className="text-rust font-normal">second&nbsp;pair</em> of
                eyes.
              </h1>
              <p className="mt-5 max-w-xl text-ink-soft leading-relaxed">
                Upload a document or start from a blank page — then summarise,
                rewrite, and polish it with AI that stays out of your way.
              </p>
            </header>

            {/* Continue writing */}
            {draft && (
              <Link
                to="/edit"
                className="rise rise-2 group block mb-10 p-5 bg-card border border-line rounded-2xl hover:border-rust/50 hover:shadow-lift transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-1.5">
                      Continue writing
                    </p>
                    <p className="text-sm text-ink-soft truncate">{draft}…</p>
                  </div>
                  <FiArrowUpRight className="shrink-0 text-xl text-ink-faint group-hover:text-rust group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </Link>
            )}

            {/* Tool cards */}
            <section className="grid sm:grid-cols-2 gap-4">
              {tools.map(({ n, to, icon: Icon, title, blurb }, i) => (
                <Link
                  key={to}
                  to={to}
                  className={`rise rise-${i + 2} group relative p-6 bg-card border border-line rounded-2xl overflow-hidden hover:border-rust/50 hover:shadow-lift hover:-translate-y-0.5 transition-all`}
                >
                  <span className="absolute top-4 right-5 font-display italic text-4xl text-line group-hover:text-rust-wash transition-colors select-none">
                    {n}
                  </span>
                  <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-rust-wash text-rust-deep mb-4 group-hover:bg-rust group-hover:text-paper transition-colors">
                    <Icon className="text-lg" />
                  </span>
                  <h2 className="font-display text-xl mb-1.5">{title}</h2>
                  <p className="text-sm text-ink-soft leading-relaxed pr-6">
                    {blurb}
                  </p>
                </Link>
              ))}
            </section>

            <footer className="rise rise-5 mt-14 pt-6 border-t border-line flex items-center justify-between text-xs text-ink-faint font-mono">
              <span>DocuReviewer · drafts stay on your device</span>
              <span>PDF · DOCX · TXT</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
