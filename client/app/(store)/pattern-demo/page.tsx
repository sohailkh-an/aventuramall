import { TikTokBackground } from "@/components/ui/TikTokBackground";
import { TikTokHeroBg } from "@/components/ui/TikTokHeroBg";

export default function PatternDemoPage() {
  return (
    <div>
      {/* Demo 1: Hero background with neon lines + icons (matches reference image) */}
      <TikTokHeroBg className="min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full px-4 py-20">
          {/* Neon login card */}
          <div className="card-tt-neon p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Login to your account.
            </h2>
            <div className="flex gap-1 justify-center mb-6">
              <div className="h-1 w-6 rounded" style={{ background: "var(--tt-pink)" }} />
              <div className="h-1 w-6 rounded" style={{ background: "var(--tt-cyan)" }} />
            </div>
            <input
              type="text"
              placeholder="Email"
              className="w-full mb-3 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 outline-none focus:border-[var(--tt-pink)] transition"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full mb-6 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 outline-none focus:border-[var(--tt-pink)] transition"
            />
            <button className="w-full py-3 rounded-lg font-semibold text-white gradient-tt hover:opacity-90 transition glow-tt-pink">
              Login
            </button>
          </div>
        </div>
      </TikTokHeroBg>


      {/* Demo 2: CSS-only utility class approach */}
      <section className="bg-tiktok py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            CSS Utility Class: <code className="text-tt-cyan">.bg-tiktok</code>
          </h2>
          <p className="text-white/60 mb-8">
            No React component needed — just add the class
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card-tt-neon p-6 text-left hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 rounded-lg gradient-tt flex items-center justify-center text-white font-bold mb-4">
                  {i}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Feature Card {i}
                </h3>
                <p className="text-white/50 text-sm">
                  Neon-outlined glassmorphism cards that match the TikTok brand aesthetic.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo 3: Subtle variant */}
      <section className="bg-tiktok bg-tiktok-subtle py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Subtle Variant: <code className="text-tt-cyan">.bg-tiktok-subtle</code>
          </h2>
          <p className="text-white/60 mb-8">
            Lower opacity pattern for content-heavy sections
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <span className="px-4 py-2 rounded-full border border-tt-pink text-tt-pink text-sm glow-tt-pink">
              Pink Glow
            </span>
            <span className="px-4 py-2 rounded-full border border-tt-cyan text-tt-cyan text-sm glow-tt-cyan">
              Cyan Glow
            </span>
            <span className="px-4 py-2 rounded-full gradient-tt text-white text-sm font-semibold">
              Gradient
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
