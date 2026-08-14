import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#3a0d3a] to-[#15162c] text-white">
      <div className="container flex max-w-4xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Turn podcasts into{" "}
          <span className="text-purple-400">viral clips</span>
        </h1>
        <p className="max-w-2xl text-lg text-white/70">
          Upload a podcast and our AI detects the most engaging moments, crops
          to the active speaker, and renders vertical clips with subtitles —
          ready for TikTok and YouTube Shorts.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}