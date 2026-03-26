<div align="center">

# 🙏 Blessings365

### _Daily Bible Reading Companion_

<img src="public/assets/bcc.png" alt="Blessings365 Logo" width="120" height="120">

**Read the Bible daily with a beautiful 365-day reading plan**

[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)](https://github.com/gunawanjason/Blessings365)
[![Platform](https://img.shields.io/badge/platform-Web-green?style=for-the-badge)](https://daily.blessings365.top)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[🌐 **Live Demo**](https://daily.blessings365.top) · [📖 **Documentation**](#-) · [🐛 **Report Bug**](https://github.com/gunawanjason/Blessings365/issues) · [✨ **Request Feature**](https://github.com/gunawanjason/Blessings365/issues)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🌐 Supported Translations](#-supported-translations)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Technical Architecture](#-technical-architecture)
- [🎯 Component Overview](#-component-overview)
- [📱 Screenshots](#-screenshots)
- [🎨 Customization](#-customization)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📖 Daily Reading Plan

- **365-day structured plan** covering the entire Bible
- **Date picker** to navigate to any day of the year
- **Pericope headings** for better context
- **Verse selection** with click-to-select
- **Copy verses** in multiple formats

</td>
<td width="50%">

### ⚖️ Compare Versions

- **Side-by-side comparison** of translations
- **Synchronized scrolling** between panels
- **Aligned verses** for easy comparison
- **Mobile-friendly** swipe navigation

</td>
</tr>
<tr>
<td width="50%">

### 🎨 User Experience

- **Dark/Light theme** with system preference detection
- **Adjustable font sizes** (Small/Medium/Large)
- **Smooth animations** and transitions
- **Mobile-first responsive design**

</td>
<td width="50%">

### 📱 Progressive Web App

- **Offline-capable** with service worker
- **Install on mobile** home screen
- **Fast loading** with optimized assets
- **Cross-platform** support

</td>
</tr>
</table>

---

## 🌐 Supported Translations

Blessings365 supports **11 Bible translations** across multiple languages:

| Flag | Translation               | Language            | Code          |
| :--: | :------------------------ | :------------------ | :------------ |
|  🇮🇩  | **TB (Terjemahan Baru)**  | Indonesian          | `TB`          |
|  🇺🇸  | **ESV**                   | English             | `ESV`         |
|  🇺🇸  | **KJV**                   | English             | `KJV`         |
|  🇺🇸  | **NASB**                  | English             | `NASB`        |
|  🇺🇸  | **NIV**                   | English             | `NIV`         |
|  🇺🇸  | **NLT**                   | English             | `NLT`         |
|  🇺🇸  | **TLB**                   | English             | `TLB`         |
|  🇨🇳  | **新译本 (CNVS)**         | Chinese Simplified  | `CNVS`        |
|  🇨🇳  | **新标点和合本 (上帝版)** | Chinese Simplified  | `CUNPSS-上帝` |
|  🇨🇳  | **新标点和合本 (神版)**   | Chinese Simplified  | `CUNPSS-神`   |
|  🇭🇰  | **和合本 (CUV)**          | Chinese Traditional | `CUV`         |

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

| Requirement | Version | Download                          |
| :---------- | :-----: | :-------------------------------- |
| Node.js     |  v18+   | [nodejs.org](https://nodejs.org/) |
| pnpm        | latest  | `npm install -g pnpm`             |

### Installation

```bash
# Clone the repository
git clone https://github.com/gunawanjason/Blessings365.git
cd Blessings365

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
# Create optimized production build
pnpm run build

# Preview production build locally
pnpm run preview
```

### Deployment

The project is configured for **Vercel** deployment with [`vercel.json`](vercel.json):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 📁 Project Structure

```
Blessings365/
├── 📄 index.html              # Main HTML entry point
├── 📄 package.json            # Project dependencies & scripts
├── 📄 vite.config.js          # Vite build configuration
├── 📄 vercel.json             # Vercel deployment config
│
├── 📂 public/
│   ├── 📄 Translated_Bacaan_Alkitab_365.json   # 365-day reading plan
│   ├── 📄 Alkitab365 - Jadwal Bacaan Tahunan.pdf
│   └── 📂 assets/
│       ├── 🖼️ bcc.ico             # App favicon
│       ├── 🖼️ bcc.png             # App icon
│       ├── 🖼️ favicon.ico         # Browser favicon
│       ├── 🖼️ apple-touch-icon-*.png  # iOS icons
│       ├── 🖼️ icon-*.webp         # PWA icons
│       └── 📄 manifest.json       # PWA manifest
│
├── 📂 src/
│   ├── 📜 main.js                 # App initialization & routing
│   │
│   ├── 📂 components/
│   │   ├── 📜 BottomNav.js        # Mobile bottom navigation
│   │   ├── 📜 DatePicker.js       # Date selection component
│   │   ├── 📜 Header.js           # App header with navigation
│   │   ├── 📜 ScrollToTop.js      # Scroll-to-top FAB
│   │   ├── 📜 SettingsPanel.js    # Settings drawer
│   │   ├── 📜 VerseDisplay.js     # Verse rendering & tabs
│   │   ├── 📜 VerseSelection.js   # Verse selection manager
│   │   └── 📜 VersionSelector.js  # Translation dropdown
│   │
│   ├── 📂 pages/
│   │   ├── 📜 DailyPage.js        # Daily reading page
│   │   ├── 📜 ComparePage.js      # Version comparison page
│   │   └── 📜 NotFoundPage.js     # 404 error page
│   │
│   ├── 📂 data/
│   │   ├── 📜 bookNames.js        # Book name translations
│   │   └── 📜 config.js           # App configuration
│   │
│   ├── 📂 styles/
│   │   ├── 🎨 base.css            # Base styles & resets
│   │   ├── 🎨 variables.css       # CSS custom properties
│   │   ├── 🎨 typography.css      # Typography styles
│   │   ├── 🎨 animations.css      # Keyframe animations
│   │   ├── 🎨 index.css           # Main CSS imports
│   │   └── 📂 components/         # Component-specific styles
│   │       ├── 🎨 actions.css     # Action buttons
│   │       ├── 🎨 bottom-nav.css  # Bottom navigation
│   │       ├── 🎨 buttons.css     # Button styles
│   │       ├── 🎨 compare.css     # Comparison view
│   │       ├── 🎨 controls.css    # Form controls
│   │       ├── 🎨 feedback.css    # Feedback messages
│   │       ├── 🎨 header.css      # Header styles
│   │       ├── 🎨 hero.css        # Hero section
│   │       ├── 🎨 not-found.css   # 404 page
│   │       ├── 🎨 settings.css    # Settings panel
│   │       ├── 🎨 tabs.css        # Tab navigation
│   │       ├── 🎨 verses.css      # Verse display
│   │       └── 🎨 widgets.css     # UI widgets
│   │
│   └── 📂 utils/
│       ├── 📜 analytics.js        # Google Analytics integration
│       ├── 📜 api.js              # API fetch functions
│       ├── 📜 comparisonSync.js   # Verse synchronization
│       ├── 📜 confetti.js         # Celebration effects
│       └── 📜 helpers.js          # Utility functions
│
└── 📂 print/                      # Print-specific pages
    ├── 📄 index.html
    └── 📄 build.html
```

---

## 🔧 Technical Architecture

### Routing System

The app uses a lightweight **hash-based router** defined in [`src/main.js`](src/main.js):

```javascript
// Supported routes
#/           → Daily reading page (default)
#/compare    → Compare versions page
```

### API Integration

Verses are fetched from the Blessings365 API:

```javascript
// Base URL: https://api.blessings365.top

// Fetch verses
GET /{translation}/multiple?verses={references}

// Fetch pericope headings
GET /{translation}/headings?book={bookName}
```

<details>
<summary>📖 API Usage Example</summary>

```javascript
import { fetchDayData } from "./utils/api.js";

// Fetch all data for a day
const { versesData, headingsMap } = await fetchDayData("ESV", "Genesis 1:1-31");

// versesData contains all verse objects
// headingsMap contains pericope headings keyed by "Book Chapter:Verse"
```

</details>

### Reading Plan Format

The 365-day reading plan in [`public/Translated_Bacaan_Alkitab_365.json`](public/Translated_Bacaan_Alkitab_365.json):

```json
{
  "1": ["Genesis 1:1-2:3", "Genesis 2:4-25", "Genesis 3:1-24"],
  "2": ["Genesis 4:1-16", "Genesis 4:17-26", "Genesis 5:1-32"],
  "365": ["Revelation 21:1-27", "Revelation 22:1-21"]
}
```

### Settings Persistence

User preferences are automatically saved to `localStorage`:

| Key        | Values                                                                   | Description            |
| :--------- | :----------------------------------------------------------------------- | :--------------------- |
| `theme`    | `'light'` \| `'dark'`                                                    | Color theme            |
| `fontSize` | `'verse-line--small'` \| `'verse-line--medium'` \| `'verse-line--large'` | Text size              |
| `boldCopy` | `'true'` \| `'false'`                                                    | Bold text when copying |

---

## 🎯 Component Overview

### Core Components

| Component           | File                                                      | Description                               |
| :------------------ | :-------------------------------------------------------- | :---------------------------------------- |
| **VerseDisplay**    | [`VerseDisplay.js`](src/components/VerseDisplay.js)       | Renders verses with accordion/tabs layout |
| **VerseSelection**  | [`VerseSelection.js`](src/components/VerseSelection.js)   | Manages verse selection state             |
| **SettingsPanel**   | [`SettingsPanel.js`](src/components/SettingsPanel.js)     | Slide-out settings drawer                 |
| **DatePicker**      | [`DatePicker.js`](src/components/DatePicker.js)           | Calendar date selection                   |
| **VersionSelector** | [`VersionSelector.js`](src/components/VersionSelector.js) | Translation dropdown                      |

### Page Components

| Page          | File                                           | Route       | Description             |
| :------------ | :--------------------------------------------- | :---------- | :---------------------- |
| **Daily**     | [`DailyPage.js`](src/pages/DailyPage.js)       | `#/`        | Main reading view       |
| **Compare**   | [`ComparePage.js`](src/pages/ComparePage.js)   | `#/compare` | Side-by-side comparison |
| **Not Found** | [`NotFoundPage.js`](src/pages/NotFoundPage.js) | `*`         | 404 error page          |

### Utility Modules

| Module        | File                                               | Purpose               |
| :------------ | :------------------------------------------------- | :-------------------- |
| **API**       | [`api.js`](src/utils/api.js)                       | Bible API client      |
| **Sync**      | [`comparisonSync.js`](src/utils/comparisonSync.js) | Verse synchronization |
| **Analytics** | [`analytics.js`](src/utils/analytics.js)           | Google Analytics      |
| **Helpers**   | [`helpers.js`](src/utils/helpers.js)               | Utility functions     |

---

## 📱 Screenshots

<div align="center">

### Light Theme

| Daily Reading | Compare View  |
| :-----------: | :-----------: |
| _Coming Soon_ | _Coming Soon_ |

### Dark Theme

| Daily Reading | Compare View  |
| :-----------: | :-----------: |
| _Coming Soon_ | _Coming Soon_ |

### Mobile View

|     Home      |   Settings    |  Navigation   |
| :-----------: | :-----------: | :-----------: |
| _Coming Soon_ | _Coming Soon_ | _Coming Soon_ |

</div>

---

## 🎨 Customization

### Theme Variables

Customize the app appearance using CSS variables in [`src/styles/variables.css`](src/styles/variables.css):

```css
:root {
  /* Light Theme */
  --color-bg: #ffffff;
  --color-text: #1a1a2e;
  --color-primary: #4f46e5;

  /* Dark Theme */
  [data-theme="dark"] {
    --color-bg: #0f172a;
    --color-text: #e2e8f0;
    --color-primary: #818cf8;
  }
}
```

### Adding New Translations

1. Add the translation code to [`src/data/config.js`](src/data/config.js):

```javascript
export const BIBLE_VERSIONS = [
  // ... existing versions
  { value: "NEW-VERSION", label: "New Translation" },
];
```

2. Ensure the API supports the new translation

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Development Workflow

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Blessings365.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes and commit
git commit -m '✨ Add amazing feature'

# 5. Push to your branch
git push origin feature/amazing-feature

# 6. Open a Pull Request
```

### Contribution Guidelines

- 🐛 **Bug fixes** are always welcome
- ✨ **New features** should be discussed in an issue first
- 📝 **Documentation** improvements are appreciated
- 🎨 **UI/UX** enhancements should include screenshots

### Code Style

- Use **ES6+ JavaScript** features
- Follow the existing **file structure**
- Add **comments** for complex logic
- Keep components **modular and reusable**

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Blessings365

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

<table>
<tr>
<td align="center" width="33%">

### 📖 Bible API

[api.blessings365.top](https://api.blessings365.top)

Providing reliable verse data

</td>
<td align="center" width="33%">

### 🔤 Typography

[Inter](https://fonts.google.com/specimen/Inter)

Beautiful, readable fonts

</td>
<td align="center" width="33%">

### ⚡ Build Tool

[Vite](https://vitejs.dev/)

Lightning-fast HMR

</td>
</tr>
<tr>
<td align="center" width="33%">

### 📊 Analytics

[Google Analytics](https://analytics.google.com/)

Usage insights

</td>
<td align="center" width="33%">

### 🚀 Hosting

[Vercel](https://vercel.com/)

Edge deployment

</td>
<td align="center" width="33%">

### 🎨 Icons

Custom SVG icons

Lightweight & crisp

</td>
</tr>
</table>

---

<div align="center">

## 📖 Start Reading Today!

### [**Visit Blessings365 →**](https://daily.blessings365.top)

---

**Made with ❤️ for daily Bible reading**

[⬆ Back to Top](#-blessings365)

</div>
