# Scott Anketell's Portfolio - Quartz 4 Site

This is Scott Anketell's portfolio and CV website built with [Quartz 4](https://quartz.jzhao.xyz/) that automatically syncs content from an Obsidian vault via GitHub Actions and deploys to Netlify.

## 🚀 Features

- **Automated Content Sync**: Content is automatically pulled from your Obsidian Vault repository
- **Static Site Generation**: Fast, secure, and reliable hosting with Quartz 4
- **Modern Design**: Clean, responsive layout with dark mode support
- **Search & Navigation**: Built-in search and intuitive navigation
- **GitHub Actions**: Automated build and deployment pipeline
- **Netlify Deployment**: Seamless deployment to Netlify

## 📁 Project Structure

```
Portfolio/
├── content/                 # Your portfolio content (synced from Obsidian)
├── quartz/                  # Quartz framework files
├── .github/workflows/        # GitHub Actions workflows
├── quartz.config.ts          # Quartz configuration
├── quartz.layout.ts          # Quartz layout configuration
├── package.json             # Node.js dependencies
└── README.md               # This file
```

## 🔄 How It Works

1. **Content Source**: Your Obsidian Vault repository pushes content to this repository via GitHub Actions
2. **Build Process**: GitHub Actions triggers when content is updated
3. **Site Generation**: Quartz builds the static site from markdown files
4. **Deployment**: The built site is deployed directly to Netlify

## 🛠️ Local Development

To work on this site locally:

```bash
# Install dependencies
npm install

# Build the site
node quartz/bootstrap-cli.mjs build

# Serve locally (optional)
node quartz/bootstrap-cli.mjs build --serve
```

## 📝 Content Management

Content is managed in your Obsidian vault and automatically synced here. The main files you'll see:

- `content/index.md` - Homepage content
- Additional markdown files will appear as they're synced from your vault

## ⚙️ Configuration

- **Site Settings**: Edit `quartz.config.ts`
- **Layout Settings**: Edit `quartz.layout.ts`
- **GitHub Actions**: `.github/workflows/build.yml`

## 🌐 Deployment

The site is configured to:
- Build automatically on pushes to the main branch
- Deploy directly to Netlify for production hosting

## 🔧 Customization

### Site Appearance
Modify `quartz.config.ts` to update:
- Site title and description
- Theme colors
- Typography
- Plugins and features

### GitHub Actions
The workflow (`.github/workflows/build.yml`) can be modified to:
- Change Node.js version
- Add build steps
- Modify deployment targets

## 📚 Quartz Documentation

For detailed Quartz configuration options, visit:
[https://quartz.jzhao.xyz/configuration](https://quartz.jzhao.xyz/configuration)

## 🚀 Getting Started with Content

Once your Obsidian vault starts pushing content here:

1. Content will appear in the `content/` directory
2. The site will automatically rebuild and deploy
3. Your portfolio will be live on your Netlify domain

## 🤝 Contributing

This is a personal portfolio site. For issues or questions about the Quartz setup, refer to the [Quartz documentation](https://quartz.jzhao.xyz/).

---

*Built with ❤️ using Quartz 4*
