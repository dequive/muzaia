
export const siteConfig = {
  name: "Muzaia",
  description: "AI Chat Platform with Multi-LLM Support",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.jpg",
  links: {
    github: "https://github.com/muzaia/muzaia",
    docs: "/docs",
  },
  creator: "Muzaia Team",
}
export const siteConfig = {
  name: "Mozaia AI",
  description: "Orquestrador de LLMs com consenso inteligente para Moçambique",
  url: "https://mozaia.ai",
  ogImage: "/og-image.png",
  creator: "Mozaia Team",
  links: {
    github: "https://github.com/mozaia/platform",
    twitter: "https://twitter.com/mozaiaai",
    linkedin: "https://linkedin.com/company/mozaia"
  }
}

export type SiteConfig = typeof siteConfig
