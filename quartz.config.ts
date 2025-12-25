import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Scott Anketell",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    locale: "en-US",
    baseUrl: "https://scott.anketell.net",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    analytics: {
      provider: "plausible",
    },
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#FFFFFF",       // Background: White
          lightgray: "#E5E5E5",   // Grid/Borders: Very Light Grey
          gray: "#808080",        // Secondary: Mid Grey
          darkgray: "#000000",    // Body Text: Black
          dark: "#000000",        // Headings: Black
          secondary: "#EF3340",   // Primary Accent (Pantone 032 C)
          tertiary: "#EF3340",    // Hover States (Pantone 032 C)
          highlight: "rgba(239, 51, 64, 0.12)", // Red highlight tint
          textHighlight: "#EF334033", // Red text highlight with transparency
        },
        darkMode: {
          light: "#000000",       // Background: Black
          lightgray: "#262626",   // Grid/Borders: Dark Grey
          gray: "#D1D1D1",        // Secondary: Light Grey
          darkgray: "#FFFFFF",    // Body Text: White
          dark: "#FFFFFF",        // Headings: White
          secondary: "#EF3340",   // Primary Accent (Pantone 032 C)
          tertiary: "#EF3340",    // Hover States (Pantone 032 C)
          highlight: "rgba(239, 51, 64, 0.2)", // Red highlight tint
          textHighlight: "#EF33404D", // Red text highlight with transparency
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "nord",
          dark: "nord",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
