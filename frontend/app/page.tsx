export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold tracking-tight">
          Dance<span className="text-purple-400">GPT</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-md mx-auto">
          AI-powered study tool for dance students — upload notation, chat with
          your sheets, generate flashcards.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <span className="px-4 py-2 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 text-sm">
            Frontend ✓
          </span>
          <span className="px-4 py-2 rounded-full bg-slate-700/30 border border-slate-500/50 text-slate-400 text-sm">
            Phase 0 — Infrastructure
          </span>
        </div>
      </div>
    </main>
  );
}
