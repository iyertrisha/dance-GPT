"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { flashcardsApi, type DeckCardRow, type FlashcardDeckRow } from "@/lib/api";

export default function DeckStudyPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = typeof params.deckId === "string" ? params.deckId : null;

  const [deck, setDeck] = useState<FlashcardDeckRow | null>(null);
  const [cards, setCards] = useState<DeckCardRow[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!deckId) return;
    const data = await flashcardsApi.getDeckCards(deckId);
    setDeck(data.deck);
    setCards(data.cards);
    setIndex(0);
    setFlipped(false);
  }, [deckId]);

  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      setError("Invalid deck.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load deck");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId, load]);

  const current = cards[index];

  const bumpMastery = async (delta: number) => {
    if (!current) return;
    const next = Math.max(0, Math.min(5, (current.mastery_level || 0) + delta));
    try {
      const updated = await flashcardsApi.updateMastery(current.id, next);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const goNext = () => {
    setFlipped(false);
    setIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  };

  const goPrev = () => {
    setFlipped(false);
    setIndex((i) => (cards.length ? (i - 1 + cards.length) % cards.length : 0));
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-white">
        <div className="size-12 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />
      </div>
    );
  }

  if (error || !deck || cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center text-slate-300">
        <p>{error || "This deck has no cards."}</p>
        <Link
          href="/flashcards"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Back to flashcards
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-4 py-6">
      <div className="mb-6 flex w-full max-w-3xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/flashcards")}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← All decks
        </button>
        <span className="truncate text-sm text-slate-400">
          {deck.title} · {index + 1}/{cards.length}
        </span>
        <span className="text-xs text-slate-500">
          Mastery {current.mastery_level}/5
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group relative h-[min(28rem,55vh)] w-full max-w-2xl [perspective:1200px]"
        aria-label={flipped ? "Show front of card" : "Show back of card"}
      >
        <div
          className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-800/90 px-8 py-6 text-center [backface-visibility:hidden] shadow-xl">
            <span className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Front
            </span>
            <p className="text-lg font-medium leading-relaxed text-white sm:text-xl">
              {current.front}
            </p>
            <span className="mt-6 text-xs text-slate-500">Tap to flip</span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-purple-500/30 bg-slate-900/95 px-8 py-6 text-center shadow-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <span className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
              Back
            </span>
            <p className="text-lg leading-relaxed text-slate-100 sm:text-xl whitespace-pre-wrap">
              {current.back}
            </p>
            <span className="mt-6 text-xs text-slate-500">Tap to flip</span>
          </div>
        </div>
      </button>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => bumpMastery(-1)}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          − Mastery
        </button>
        <button
          type="button"
          onClick={() => bumpMastery(1)}
          className="rounded-lg bg-purple-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
        >
          + Mastery
        </button>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
