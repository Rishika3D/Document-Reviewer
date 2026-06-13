'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import NavSum from '../components/NavSum';
import axios from 'axios';
import { API_BASE } from '../config';
import { authHeaders } from '../auth';
import { getDocument, createDocument, updateDocument } from '../documents';
import { FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';

const pastelColors = ["#f6d9cb", "#f3e6c4", "#e3e9cd", "#d7e4dc", "#dce3ee", "#ecdcea", "transparent"];

const SAVE_DEBOUNCE_MS = 1200;

// Stable, module-level config. Cmd/Ctrl+B/I/U are handled by Quill natively,
// so no custom keyboard bindings are needed (the old ones referenced `quill`
// before it existed and force-applied formatting without toggling).
const editorModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      [{ background: pastelColors }],
      ['clean'],
    ],
  },
};

export default function Edit() {
  const { id } = useParams();

  const [title, setTitle] = useState('Untitled document');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState(null);
  const [rewriting, setRewriting] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);

  // Refs so the debounced save always sees the latest values
  const docIdRef = useRef(null);
  const titleRef = useRef(title);
  const saveTimer = useRef(null);
  const dirtyRef = useRef(false);        // unsaved changes pending?
  const createPromiseRef = useRef(null); // in-flight create, guards duplicates
  const mountedRef = useRef(true);

  const { quill, quillRef } = useQuill({ theme: 'snow', modules: editorModules, placeholder: 'Start writing…' });

  // Persist the current state. Lazily creates the document on the first real
  // edit (so visiting /edit and leaving never leaves an empty junk document).
  const save = ({ keepalive = false } = {}) => {
    if (!quill || !dirtyRef.current) return;
    const payload = { title: titleRef.current, content: quill.root.innerHTML };
    dirtyRef.current = false;
    const setIfMounted = (fn) => { if (mountedRef.current) fn(); };

    (async () => {
      try {
        if (docIdRef.current) {
          await updateDocument(docIdRef.current, payload, { keepalive });
        } else {
          if (!createPromiseRef.current) createPromiseRef.current = createDocument(payload, { keepalive });
          const { document: doc } = await createPromiseRef.current;
          docIdRef.current = doc.id;
          // Reflect the new id in the URL without remounting / reloading
          window.history.replaceState(window.history.state, '', `/edit/${doc.id}`);
        }
        setIfMounted(() => { setSaveState('saved'); setSavedAt(new Date()); });
      } catch (err) {
        console.error('Save failed:', err);
        createPromiseRef.current = null;
        dirtyRef.current = true; // allow a later retry
        setIfMounted(() => setSaveState('error'));
      }
    })();
  };

  const scheduleSave = () => {
    dirtyRef.current = true;
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), SAVE_DEBOUNCE_MS);
  };

  // Load an existing document. New documents are created lazily on first edit.
  useEffect(() => {
    if (!quill) return;
    if (!id) {
      // Fresh blank draft — nothing to load, nothing created yet.
      docIdRef.current = null;
      setSaveState('idle');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const { document: doc } = await getDocument(id);
        if (cancelled) return;
        docIdRef.current = doc.id;
        titleRef.current = doc.title;
        setTitle(doc.title);
        if (quill.root.innerHTML !== doc.content) {
          quill.root.innerHTML = doc.content || '';
        }
        setSaveState('saved');
        setSavedAt(doc.updatedAt ? new Date(doc.updatedAt + 'Z') : null);
      } catch (err) {
        console.error('Could not load document:', err);
        if (!cancelled) setSaveState('error');
      }
    })();

    return () => { cancelled = true; };
  }, [quill, id]);

  useEffect(() => {
    if (!quill) return;

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source !== 'user') return;
      scheduleSave();
    });

    quill.on('selection-change', (range) => {
      if (range && range.length > 0) {
        const text = quill.getText(range.index, range.length);
        setSelectedText(text);
        const b = quill.getBounds(range.index, range.length);
        setPopupPos({ top: b.top, left: b.left + b.width });
        setShowPopup(true);
      } else {
        setShowPopup(false);
        setPopupPos(null);
      }
    });

    // Best-effort flush if the tab is closed/refreshed mid-edit
    const handleBeforeUnload = () => { if (dirtyRef.current) save({ keepalive: true }); };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(saveTimer.current);
      // Flush any pending change on SPA navigation away (page still alive)
      if (dirtyRef.current) save();
    };
  }, [quill]);

  // Track mount status so async saves don't setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    scheduleSave();
  };

  // AI rewrite of the selected passage
  const rewriteText = async () => {
    if (!selectedText || !quill) return;
    const range = quill.getSelection();
    setRewriting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/nlp/rewrite`, { text: selectedText }, { headers: authHeaders() });
      quill.deleteText(range.index, range.length);
      quill.insertText(range.index, res.data.rewritten || selectedText);
      scheduleSave();
    } catch (err) {
      console.error('Rewrite failed:', err);
      alert(err.response?.data?.error || 'Rewrite failed.');
    } finally {
      setRewriting(false);
      setShowPopup(false);
    }
  };

  const addComment = () => {
    if (!selectedText || !quill) return;
    const range = quill.getSelection();
    const newComment = {
      id: Date.now(),
      text: prompt(`Comment for: "${selectedText}"`) || '',
      target: selectedText,
      color: pastelColors[Math.floor(Math.random() * (pastelColors.length - 1))],
      range,
    };
    if (newComment.text) {
      setComments([newComment, ...comments]);
      quill.formatText(range.index, range.length, 'background', newComment.color);
      scheduleSave();
    }
    setShowPopup(false);
  };

  const deleteComment = (commentId) => {
    const c = comments.find((c) => c.id === commentId);
    if (quill && c?.range) quill.formatText(c.range.index, c.range.length, 'background', 'transparent');
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/upload`, fd, { headers: authHeaders() });
      startTransition(() => {
        if (quill) quill.root.innerHTML = res.data.text;
      });
      // Use the filename as the title if the doc is still untitled
      if (titleRef.current === 'Untitled document' && res.data.filename) {
        const base = res.data.filename.replace(/\.[^.]+$/, '');
        titleRef.current = base;
        setTitle(base);
      }
      scheduleSave();
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'File upload failed.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const downloadDocument = () => {
    const html = quill ? quill.root.innerHTML : '';
    const blob = new Blob(
      [`<html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`],
      { type: 'text/html' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'document'}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const statusLine = loading
    ? 'Extracting text…'
    : saveState === 'saving'
    ? 'Saving…'
    : saveState === 'error'
    ? 'Could not save — check your connection'
    : savedAt
    ? `Saved ${savedAt.toLocaleTimeString()}`
    : 'Saved to your account as you type';

  return (
    <div className="grain flex flex-col min-h-screen bg-paper">
      <div className="sticky top-0 z-50">
        <NavSum />
      </div>

      <div className="flex flex-1">
        {/* EDITOR */}
        <div className="flex-1 px-6 lg:px-10 py-8 relative min-w-0">
          <div className="max-w-3xl mx-auto">
            <header className="rise rise-1 flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-rust mb-1">Editor</p>
                <input
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Untitled document"
                  className="w-full font-display text-3xl font-light tracking-tight bg-transparent focus:outline-none border-b border-transparent focus:border-line transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-card border border-line rounded-xl cursor-pointer hover:border-rust/50 hover:shadow-lift transition-all">
                  <FiUpload className="text-ink-soft" />
                  Import
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={downloadDocument}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-ink text-paper rounded-xl hover:bg-rust transition-colors"
                >
                  <FiDownload />
                  Export
                </button>
              </div>
            </header>

            <p className={`rise rise-2 mb-3 font-mono text-[11px] ${saveState === 'error' ? 'text-rust-deep' : 'text-ink-faint'}`}>
              {statusLine}
              {isPending && ' · updating…'}
            </p>

            <div className="rise rise-2 bg-card border border-line rounded-xl shadow-lift relative">
              <div ref={quillRef} style={{ minHeight: '420px' }} />

              {showPopup && popupPos && (
                <div
                  style={{ position: 'absolute', top: popupPos.top + 52, left: Math.min(popupPos.left + 16, 480) }}
                  className="flex gap-1.5 p-1 bg-ink rounded-xl shadow-pop z-40"
                >
                  <button
                    onClick={addComment}
                    className="px-3 py-1.5 text-xs text-paper rounded-lg hover:bg-white/15 transition"
                  >
                    💬 Comment
                  </button>
                  <button
                    onClick={rewriteText}
                    disabled={rewriting}
                    className="px-3 py-1.5 text-xs bg-rust text-paper rounded-lg hover:bg-rust-deep transition disabled:opacity-60"
                  >
                    {rewriting ? 'Rewriting…' : '✦ Rewrite'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COMMENTS */}
        <aside className="w-72 shrink-0 border-l border-line bg-cream/60 p-4 hidden lg:block">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">
            Comments · {comments.length}
          </p>

          {comments.length === 0 ? (
            <p className="text-sm text-ink-faint leading-relaxed">
              Select text in the document and choose “Comment” to leave a note.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="p-3 rounded-xl border border-line bg-card"
                  style={{ borderLeft: `4px solid ${c.color}` }}
                >
                  <p className="text-xs text-ink-faint italic truncate mb-1">“{c.target.trim()}”</p>
                  <p className="text-sm leading-snug">{c.text}</p>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-ink-faint hover:text-rust transition"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
