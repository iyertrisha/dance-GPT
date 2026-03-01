import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold tracking-tight">
          Dance<span className="text-purple-400">GPT</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-md mx-auto">
          AI-powered study tool for Bharatanatyam Gandharva exams — chat with
          your study materials, take notes, and generate flashcards.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium border border-slate-700"
          >
            Sign Up
          </Link>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <span className="px-4 py-2 rounded-full bg-green-600/30 border border-green-500/50 text-green-300 text-sm">
            Phase 1 Complete ✓
          </span>
        </div>
      </div>
    </main>
  );
}
