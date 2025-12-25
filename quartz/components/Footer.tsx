import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    
    // Only show footer on the main index page
    if (fileData.slug !== "index") {
      return null
    }
    
    return (
      <footer class={`${displayClass ?? ""} stealth-footer`}>
        <p>
          Swiss style visual architecture adapted from Wim Crouwel's 'New Alphabet' (1967). The construction of meaning through rigid systems.
        </p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
