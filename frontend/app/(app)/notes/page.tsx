"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { notesApi, type NoteRow } from "@/lib/api";

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const data = await notesApi.list();
    setNotes(data.notes);
    return data.notes;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await notesApi.list();
        if (cancelled) return;
        setNotes(data.notes);
        if (data.notes.length > 0) {
          const first = data.notes[0];
          setSelectedId(first.id);
          setTitle(first.title ?? "");
          setContent(first.content);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load notes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openNote = (n: NoteRow) => {
    setSelectedId(n.id);
    setTitle(n.title ?? "");
    setContent(n.content);
    setError(null);
  };

  const newNote = () => {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setPreview(false);
    setError(null);
  };

  const saveNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Note content cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (selectedId) {
        const updated = await notesApi.update(
          selectedId,
          content.trim(),
          title.trim() || null
        );
        setTitle(updated.title ?? "");
        setContent(updated.content);
        await loadList();
      } else {
        const created = await notesApi.create(content.trim(), title.trim() || null);
        setSelectedId(created.id);
        setTitle(created.title ?? "");
        setContent(created.content);
        await loadList();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!selectedId) return;
    if (!window.confirm("Delete this note?")) return;
    setSaving(true);
    setError(null);
    try {
      await notesApi.delete(selectedId);
      const list = await loadList();
      setSelectedId(null);
      setTitle("");
      setContent("");
      if (list.length > 0) openNote(list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-white">
        <div className="size-12 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 sm:flex-row sm:px-6">
      <aside className="flex shrink-0 flex-col gap-2 sm:w-64">
        <button
          type="button"
          onClick={newNote}
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          New note
        </button>
        <ul className="max-h-48 space-y-1 overflow-y-auto sm:max-h-[calc(100dvh-12rem)]">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => openNote(n)}
                className={`w-full truncate rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === n.id
                    ? "border-purple-500/50 bg-purple-950/40 text-white"
                    : "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {n.title?.trim() || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <form
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
        onSubmit={saveNote}
      >
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
        />
        <div className="flex gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`rounded-md px-2 py-1 ${preview ? "" : "bg-slate-700 text-white"}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`rounded-md px-2 py-1 ${preview ? "bg-slate-700 text-white" : ""}`}
          >
            Preview
          </button>
          <span className="self-center">Markdown-friendly</span>
        </div>
        {preview ? (
          <div className="min-h-[12rem] flex-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
            {content || <span className="text-slate-500">Nothing to preview</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note (Markdown-style formatting supported)…"
            className="min-h-[12rem] flex-1 resize-y rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {selectedId ? "Save" : "Create"}
          </button>
          <button
            type="button"
            onClick={deleteNote}
            disabled={!selectedId || saving}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
