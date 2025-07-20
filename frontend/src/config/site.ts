
export const siteConfig = {
  name: "Mozaia AI",
  description: "Orquestrador de LLMs com consenso inteligente para Moçambique",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://mozaia.ai",
  ogImage: "/og.jpg",
  links: {
    github: "https://github.com/muzaia/muzaia",
    docs: "/docs",
  },
  creator: "Muzaia Team",
  keywords: [
    "AI",
    "LLM",
    "Moçambique",
    "Consenso",
    "Inteligência Artificial",
    "Chat"
  ],
  contact: {
    email: "contact@mozaia.ai",
    support: "support@mozaia.ai"
  }
}

export type SiteConfig = typeof siteConfig
