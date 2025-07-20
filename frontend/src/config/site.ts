
export const siteConfig = {
  name: "Mozaia AI",
  description: "Orquestrador de LLMs com consenso inteligente para Moçambique",
  url: "https://mozaia.ai",
  ogImage: "/og-mozaia.jpg",
  links: {
    github: "https://github.com/mozaia/mozaia",
    docs: "/docs",
    twitter: "https://twitter.com/mozaia_ai",
    linkedin: "https://linkedin.com/company/mozaia"
  },
  creator: "Mozaia Team",
  keywords: [
    "AI",
    "LLM",
    "Mozambique",
    "Artificial Intelligence",
    "Language Models",
    "Consensus",
    "Orchestrator"
  ],
  authors: [
    {
      name: "Mozaia Team",
      url: "https://mozaia.ai"
    }
  ],
  themeColor: "#00884c",
  locale: "pt-MZ",
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    url: "https://mozaia.ai",
    siteName: "Mozaia AI",
    title: "Mozaia AI - Orquestrador de LLMs",
    description: "Orquestrador de LLMs com consenso inteligente para Moçambique",
    images: [
      {
        url: "/og-mozaia.jpg",
        width: 1200,
        height: 630,
        alt: "Mozaia AI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mozaia AI - Orquestrador de LLMs",
    description: "Orquestrador de LLMs com consenso inteligente para Moçambique",
    images: ["/og-mozaia.jpg"],
    creator: "@mozaia_ai"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
}

export type SiteConfig = typeof siteConfig
