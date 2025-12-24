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
        header: "Inter",
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#eceff4",
          lightgray: "#d8dee9",
          gray: "#4c566a",
          darkgray: "#3b4252",
          dark: "#2e3440",
          secondary: "#bf616a",
          tertiary: "#d08770",
          highlight: "rgba(191, 97, 106, 0.15)",
          textHighlight: "#bf616a88",
        },
        darkMode: {
          light: "#2e3440",
          lightgray: "#3b4252",
          gray: "#4c566a",
          darkgray: "#d8dee9",
          dark: "#eceff4",
          secondary: "#bf616a",
          tertiary: "#d08770",
          highlight: "rgba(191, 97, 106, 0.15)",
          textHighlight: "#bf616a88",
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
