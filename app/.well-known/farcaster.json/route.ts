export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "Base Habit Tracker",
      homeUrl: "https://base-habit-tracker-d8k1.vercel.app",
      iconUrl: "https://base-habit-tracker-d8k1.vercel.app/icon.png",
      splashImageUrl: "https://base-habit-tracker-d8k1.vercel.app/splash.png",
      splashBackgroundColor: "#0052FF",
      subtitle: "Track daily habits on-chain",
      description: "A simple and beautiful way to track your daily habits on Base blockchain. Each check-in costs just 0.00001 ETH.",
      screenshotUrls: [],
      primaryCategory: "productivity",
      tags: ["habits", "productivity", "blockchain", "base"],
      heroImageUrl: "https://base-habit-tracker-d8k1.vercel.app/hero.png",
      tagline: "Build better habits on-chain",
      ogTitle: "Base Habit Tracker",
      ogDescription: "Track your daily habits on-chain with Base",
      ogImageUrl: "https://base-habit-tracker-d8k1.vercel.app/og.png",
      noindex: false
    }
  };

  return Response.json(manifest);
}
