import { ButtonLink } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-16 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.25),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 max-w-2xl space-y-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Dance<span className="text-accent">GPT</span>
        </h1>
        <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">
          A study companion for Bharatanatyam Gandharva exams: chat with your indexed materials, stay
          on syllabus, and review theory in one place.
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href="/login" variant="primary" size="lg" className="text-center">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" variant="secondary" size="lg" className="text-center backdrop-blur">
            Create account
          </ButtonLink>
        </div>
        <p className="text-sm text-muted-foreground">
          Materials are ingested locally; your exam level shapes what the tutor retrieves from the
          knowledge base.
        </p>
      </div>
    </main>
  );
}
