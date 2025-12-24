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
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: {
          name: "Rubik",
          weights: [400, 500, 700]
        },
        body: {
          name: "Rubik",
          weights: [400, 500]
        },
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#ffffff",
          lightgray: "#e5e5e5",
          gray: "#666666",
          darkgray: "#000000",
          dark: "#000000",
          secondary: "#0047AB",
          tertiary: "#000000",
          highlight: "rgba(0, 71, 171, 0.1)",
          textHighlight: "#0047AB88",
        },
        darkMode: {
          light: "#000000",
          lightgray: "#333333",
          gray: "#666666",
          darkgray: "#ffffff",
          dark: "#ffffff",
          secondary: "#ed2100",
          tertiary: "#ffffff",
          highlight: "rgba(237, 33, 0, 0.1)",
          textHighlight: "#ed210088",
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
