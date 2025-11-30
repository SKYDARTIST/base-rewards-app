export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },

  miniapp: {
    version: "1",
    name: "Base Rewards Estimator",
    subtitle: "Check your Base activity score instantly",
    description: "A simple mini app that estimates your Base ecosystem rewards.",

    homeUrl: "https://base-rewards-app.vercel.app",
    webhookUrl: "https://base-rewards-app.vercel.app/api/webhook",

    iconUrl: "https://base-rewards-app.vercel.app/icon.png",
    screenshotUrls: [
      "https://base-rewards-app.vercel.app/screenshot.png"
    ],

    splashImageUrl: "https://base-rewards-app.vercel.app/splash.png",
    splashBackgroundColor: "#000000",

    primaryCategory: "tools",
    tags: ["base", "rewards", "analytics"],

    heroImageUrl: "https://base-rewards-app.vercel.app/splash.png",
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "https://base-rewards-app.vercel.app/splash.png"
  }
} as const;
