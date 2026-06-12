'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import NavSum from '../components/NavSum';
import axios from 'axios';
import { API_BASE } from '../config';

const pastelColors = ["#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF","#E3BAFF","transparent"];

export default function Edit() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState(null);

  // NEW ➕ Themes & autosave
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [changes, setChanges] = useState(0);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  // ✨ Load saved draft
  useEffect(() => {
    const saved = localStorage.getItem('doc-draft');
    if (saved && quill) quill.root.innerHTML = saved;
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold','italic','underline','strike'],
        [{ list: 'ordered'}, {list:'bullet' }],
        ['link','image'],
        [{ background: pastelColors }],
        ['clean'],
      ],
    },
    keyboard: {   // NEW ➕ shortcuts
      bindings: {
        bold: { key: 'B', shortKey: true, handler: () => quill.format('bold', true) },
        italic: { key: 'I', shortKey: true, handler: () => quill.format('italic', true) },
        underline: { key:'U', shortKey: true, handler: () => quill.format('underline', true) },
      },
    },
  };

  const { quill, quillRef } = useQuill({ theme:'snow', modules, placeholder:'Start writing...' });

  useEffect(() => {
    if (!quill) return;

    quill.on('text-change', () => {
      startTransition(() => setValue(quill.root.innerHTML));
      localStorage.setItem('doc-draft', quill.root.innerHTML);
      setChanges((prev) => prev + 1);
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
  }, [quill]);

  // ➕ AI rewrite selected text
  const rewriteText = async () => {
    if (!selectedText || !quill) return;
    const range = quill.getSelection();
    try {
      const res = await axios.post(`${API_BASE}/api/nlp/rewrite`, { text: selectedText });
      quill.deleteText(range.index, range.length);
      quill.insertText(range.index, res.data.rewritten || selectedText);
    } catch (err) {
      console.error('Rewrite failed:', err);
      alert('Rewrite failed. Check the console for details.');
    } finally {
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
      color: pastelColors[Math.floor(Math.random()*(pastelColors.length-1))],
      range,
    };
    if (newComment.text) {
      setComments([newComment, ...comments]);
      quill.formatText(range.index, range.length, 'background', newComment.color);
    }
    setShowPopup(false);
  };

  const deleteComment = (id) => {
    const c = comments.find(c => c.id === id);
    if (quill && c?.range) quill.formatText(c.range.index, c.range.length, 'background', 'transparent');
    setComments(comments.filter((c) => c.id !== id));
  };

  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/upload`, fd);
      startTransition(() => {
        setValue(res.data.text);
        quill.root.innerHTML = res.data.text;
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const blob = new Blob([value], { type:'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download='document.pdf';
    link.click();
  };

  return (
    <div className={`${theme === 'dark' ? "bg-gray-900 text-white" : "bg-white text-black"} flex flex-col min-h-screen`}>
      
      <div className="sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-900">
        <NavSum />
      </div>

      <div className="flex flex-1">

        {/* EDITOR */}
        <div className="flex-1 px-8 py-10 relative">
          <button onClick={toggleTheme} className="mb-3 text-sm opacity-70 hover:opacity-100">
            Toggle Theme 🌗
          </button>

          <div className="mb-4 text-xs text-gray-500 dark:text-gray-300">
            Changes saved: {changes}
          </div>

          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="mb-3" />
          {loading && <p>Extracting text...</p>}

          <div className="bg-white dark:bg-gray-800 border rounded shadow-sm relative">
            <div ref={quillRef} style={{ minHeight:'350px' }} />

            {showPopup && popupPos && (
              <div style={{ position:'absolute', top: popupPos.top+40, left: popupPos.left+20 }} className="flex gap-2">
                <button onClick={addComment} className="bg-black text-white px-2 py-1 text-xs rounded">Comment</button>
                <button onClick={rewriteText} className="bg-indigo-600 text-white px-2 py-1 text-xs rounded">Rewrite ⚡</button>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button className="bg-black text-white px-5 py-2 rounded">Save</button>
            <button onClick={downloadPDF} className="bg-gray-300 px-5 py-2 rounded">Export PDF</button>
            {isPending && <span>Updating...</span>}
          </div>
        </div>

        {/* COMMENTS */}
        <div className="w-80 border-l p-3 bg-gray-50 dark:bg-gray-800">
          <h2 className="font-bold mb-2">Comments</h2>
          <ul>
            {comments.map((c) => (
              <li key={c.id} className="mb-2 p-2 rounded" style={{background:c.color}}>
                <p className="text-sm font-semibold">{c.target}</p>
                <p>{c.text}</p>
                <button onClick={() => deleteComment(c.id)} className="text-xs text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
