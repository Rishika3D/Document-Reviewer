import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftBar from "../components/LeftBar";
import { useAuth } from "../auth";
import { listDocuments, createDocument, updateDocument, deleteDocument } from "../documents";
import {
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiPlus,
  FiStar,
  FiTrash2,
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

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "Z");
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function DocumentList({ search, starredOnly }) {
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");

  const refresh = () => {
    listDocuments({ search, starred: starredOnly })
      .then((d) => setDocs(d.documents))
      .catch((e) => setError(e.message));
  };

  useEffect(refresh, [search, starredOnly]);

  const handleNew = async () => {
    try {
      const { document: doc } = await createDocument({});
      navigate(`/edit/${doc.id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleStar = async (doc) => {
    // Optimistic flip
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, starred: !d.starred } : d)));
    try {
      await updateDocument(doc.id, { starred: !doc.starred });
    } catch {
      refresh();
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Delete “${doc.title}”? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const heading = starredOnly ? "Starred" : search ? `Results for “${search}”` : "Your documents";

  return (
    <section className="rise rise-2 mb-12">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">{heading}</h2>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 text-sm bg-ink text-paper px-4 py-2 rounded-xl hover:bg-rust transition-colors"
        >
          <FiPlus /> New document
        </button>
      </div>

      {error && <p className="text-sm text-rust-deep mb-3">{error}</p>}

      {docs === null ? (
        <div className="h-24 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-line border-t-rust rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="p-8 bg-card border border-dashed border-line rounded-2xl text-center">
          <p className="text-ink-soft mb-1">
            {starredOnly
              ? "Nothing starred yet."
              : search
              ? "No documents match that search."
              : "No documents yet."}
          </p>
          {!starredOnly && !search && (
            <p className="text-sm text-ink-faint">
              Create one, or import a PDF/DOCX from the editor.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map((doc) => (
            <li key={doc.id} className="group relative">
              <Link
                to={`/edit/${doc.id}`}
                className="block h-full p-4 bg-card border border-line rounded-2xl hover:border-rust/50 hover:shadow-lift transition-all"
              >
                <h3 className="font-display text-lg leading-snug truncate pr-14">{doc.title}</h3>
                <p className="mt-1 text-sm text-ink-soft line-clamp-2 min-h-10">
                  {doc.snippet || <span className="text-ink-faint">Empty document</span>}
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  Edited {fmtDate(doc.updatedAt)}
                </p>
              </Link>

              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => toggleStar(doc)}
                  title={doc.starred ? "Unstar" : "Star"}
                  className={`p-1.5 rounded-lg transition ${
                    doc.starred
                      ? "text-rust"
                      : "text-ink-faint opacity-0 group-hover:opacity-100 hover:text-rust"
                  }`}
                >
                  <FiStar className={doc.starred ? "fill-current" : ""} />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-ink-faint opacity-0 group-hover:opacity-100 hover:text-rust transition"
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const starredOnly = searchParams.get("filter") === "starred";

  return (
    <div className="grain h-screen flex flex-col overflow-hidden bg-paper">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <LeftBar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
            {/* Hero */}
            <header className="rise rise-1 mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-rust mb-4">
                {greeting()}
                {user ? `, ${user.name.split(" ")[0]}` : ""} · your writing studio
              </p>
              <h1 className="font-display text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                Every draft deserves a{" "}
                <em className="text-rust font-normal">second&nbsp;pair</em> of
                eyes.
              </h1>
              {!user && (
                <p className="mt-5 max-w-xl text-ink-soft leading-relaxed">
                  Upload a document or start from a blank page — then summarise,
                  rewrite, and polish it with AI that stays out of your way.{" "}
                  <Link to="/signup" className="text-rust hover:text-rust-deep underline underline-offset-4">
                    Create a free account
                  </Link>{" "}
                  to begin.
                </p>
              )}
            </header>

            {/* Documents (logged in) */}
            {user && <DocumentList search={search} starredOnly={starredOnly} />}

            {/* Tool cards */}
            <section>
              {user && (
                <h2 className="rise rise-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint mb-4">
                  AI tools
                </h2>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
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
                    <p className="text-sm text-ink-soft leading-relaxed pr-6">{blurb}</p>
                  </Link>
                ))}
              </div>
            </section>

            <footer className="rise rise-5 mt-14 pt-6 border-t border-line flex items-center justify-between text-xs text-ink-faint font-mono">
              <span>DocuReviewer · documents save to your account</span>
              <span>PDF · DOCX · TXT</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
