# 🙏 Blessings365 — Daily Bible Reading

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web-green" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="License">
</p>

> **Read the Bible daily with Blessings365** — A beautiful 365-day reading plan with multiple translations, verse comparison, and a seamless reading experience.

---

## ✨ Features

### 📖 Daily Reading

- **365-day structured reading plan** covering the entire Bible
- **Date picker** to navigate to any day of the year
- **Pericope headings** for better context and understanding
- **Verse selection** — click any verse to select it

### 🌐 Multiple Translations

Support for **11 Bible translations** across multiple languages:

| Translation              | Language            | Code          |
| ------------------------ | ------------------- | ------------- |
| 🇮🇩 TB (Terjemahan Baru)  | Indonesian          | `TB`          |
| 🇺🇸 ESV                   | English             | `ESV`         |
| 🇺🇸 KJV                   | English             | `KJV`         |
| 🇺🇸 NASB                  | English             | `NASB`        |
| 🇺🇸 NIV                   | English             | `NIV`         |
| 🇺🇸 NLT                   | English             | `NLT`         |
| 🇺🇸 TLB                   | English             | `TLB`         |
| 🇨🇳 新译本 (CNVS)         | Chinese Simplified  | `CNVS`        |
| 🇨🇳 新标点和合本 (上帝版) | Chinese Simplified  | `CUNPSS-上帝` |
| 🇨🇳 新标点和合本 (神版)   | Chinese Simplified  | `CUNPSS-神`   |
| 🇭🇰 和合本 (CUV)          | Chinese Traditional | `CUV`         |

### ⚖️ Compare Versions

- **Side-by-side comparison** of any two translations
- **Synchronized scrolling** between panels
- **Aligned verses** for easy comparison
- **Mobile-friendly** with swipe indicators

### 🎨 Customization

| Setting         | Options                |
| --------------- | ---------------------- |
| **Theme**       | Light / Dark mode      |
| **Font Size**   | Small / Medium / Large |
| **Copy Format** | Regular / Bold text    |

### 📱 Responsive Design

- **Mobile-first** design that works beautifully on any device
- **Bottom navigation** for easy access on small screens
- **Smooth animations** and transitions

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/gunawanjason/Blessings365.git
cd Blessings365

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
pnpm run build

# Preview the production build
pnpm run preview
```

---

## 📁 Project Structure

```
Blessings365/
├── index.html              # Main HTML entry point
├── package.json            # Project dependencies
├── vite.config.js          # Vite configuration
│
├── public/
│   ├── Translated_Bacaan_Alkitab_365.json   # 365-day reading plan
│   └── assets/
│       ├── bcc.ico             # App favicon
│       ├── bcc.png             # App icon
│       ├── favicon.ico         # Favicon
│       ├── apple-touch-icon-144x144.png  # iOS icon
│       ├── apple-touch-icon-180x180.png  # iOS icon
│       ├── icon-192x192.webp   # PWA icon
│       ├── icon-512x512.webp   # PWA icon
│       └── manifest.json       # PWA manifest
│
├── src/
│   ├── main.js             # App initialization & routing
│   │
│   ├── components/
│   │   ├── BottomNav.js        # Mobile bottom navigation
│   │   ├── DatePicker.js       # Date selection component
│   │   ├── Header.js           # App header
│   │   ├── ScrollToTop.js      # Scroll to top button
│   │   ├── SettingsPanel.js    # Settings drawer
│   │   ├── VerseDisplay.js     # Verse rendering
│   │   ├── VerseSelection.js   # Verse selection manager
│   │   └── VersionSelector.js  # Translation selector
│   │
│   ├── pages/
│   │   ├── DailyPage.js     # Daily reading page
│   │   └── ComparePage.js   # Version comparison page
│   │
│   ├── data/
│   │   ├── bookNames.js    # Book name translations
│   │   └── config.js       # App configuration
│   │
│   ├── styles/
│   │   ├── base.css        # Base styles
│   │   ├── variables.css   # CSS custom properties
│   │   ├── typography.css  # Typography
│   │   ├── animations.css  # Animations
│   │   ├── index.css       # Main CSS import
│   │   └── components/     # Component-specific styles
│   │       ├── actions.css
│   │       ├── bottom-nav.css
│   │       ├── buttons.css
│   │       ├── compare.css
│   │       ├── controls.css
│   │       ├── feedback.css
│   │       ├── header.css
│   │       ├── hero.css
│   │       ├── settings.css
│   │       ├── tabs.css
│   │       ├── verses.css
│   │       └── widgets.css
│   │
│   └── utils/
│       ├── analytics.js        # Google Analytics
│       ├── api.js               # API fetch functions
│       ├── comparisonSync.js   # Verse synchronization
│       ├── confetti.js          # Celebration effects
│       └── helpers.js           # Utility functions
```

---

## 🔧 How It Works

### Routing

The app uses a simple **hash-based router**:

```javascript
// Routes
#/         → Daily reading page (default)
#/compare   → Compare versions page
```

### Reading Plan

The 365-day reading plan is stored in [`public/Translated_Bacaan_Alkitab_365.json`](./public/Translated_Bacaan_Alkitab_365.json):

```json
{
  "1": ["Genesis 1:1-2:3", "Genesis 2:4-25", "Genesis 3:1-24"],
  "2": ["Genesis 4:1-16", "Genesis 4:17-26", "Genesis 5:1-32"],
  ...
}
```

### API Integration

Verses are fetched from the Blessings365 API:

```javascript
// Fetch verses
const url = `https://api.blessings365.top/${translation}/multiple?verses=${versesString}`;
const data = await fetch(url).then((res) => res.json());
```

### Settings Persistence

User preferences are stored in `localStorage`:

```javascript
// Saved settings
localStorage.getItem("theme"); // 'light' | 'dark'
localStorage.getItem("fontSize"); // 'verse-line--small' | 'verse-line--medium' | 'verse-line--large'
localStorage.getItem("boldCopy"); // 'true' | 'false'
```

---

## 🎯 Key Components

### Settings Panel

The settings panel provides a slide-out drawer with customization options:

| Control            | Function                             |
| ------------------ | ------------------------------------ |
| ☀️/🌙 Theme Toggle | Switch between light and dark mode   |
| Aa Font Size       | Choose small, medium, or large text  |
| **B** Copy Format  | Toggle bold text when copying verses |

### Verse Display

- **Tab navigation** between books
- **Click to select** individual verses
- **Headings** for pericope divisions
- **Copy button** for selected verses

### Comparison View

- **Two-column layout** for side-by-side reading
- **Synchronized scrolling** across panels
- **Mobile indicators** showing current panel
- **Auto-alignment** of verses between translations

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a [Pull Request](https://github.com/gunawanjason/Blessings365/pulls).

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Bible API** — [api.blessings365.top](https://api.blessings365.top)
- **Fonts** — [Inter](https://fonts.google.com/specimen/Inter) by Google Fonts
- **Build Tool** — [Vite](https://vitejs.dev/)
- **Analytics** — [Google Analytics](https://analytics.google.com/)

---

<div align="center">

### 📖 Start Reading Today!

[**Visit Blessings365 →**](https://daily.blessings365.top)

_Made with ❤️ for daily Bible reading_

</div>
