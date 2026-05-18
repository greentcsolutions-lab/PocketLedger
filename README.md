# 💸 PocketLedger

> **Track every dollar. No account. No subscription. No nonsense.**

A dead-simple, beautiful expense tracker that lives entirely in your browser. No sign-up. No cloud. No monthly fee. Just open it and start tracking.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔒 100% Private | Everything stored in `localStorage` — never leaves your device |
| 📴 Works Offline | Pure static site, no server required |
| 🌙 Dark / Light Mode | Toggle with one click, preference saved |
| 🏷 7 Categories | Food, Transport, Shopping, Housing, Health, Fun, Other |
| 📊 Category Breakdown | Animated bar chart of spending by category |
| 🔍 Live Search | Filter transactions instantly as you type |
| 📅 Time Filters | View All time / This month / This week / Today |
| 💰 Monthly Budget | Set a budget and watch the progress bar turn red |
| 📥 CSV Export | One-click export of all transactions |
| 🗑 Delete & Clear | Per-item delete with confirmation, or nuke everything |
| 🎉 Micro-interactions | Confetti, shake animations, smooth transitions |
| 📱 Mobile-First | Looks great on every screen size |

---

## 🚀 Deploy in 60 Seconds

### Option A — GitHub Pages (Free)

1. Create a new GitHub repository (e.g. `pocketledger`)
2. Upload the files maintaining this exact structure:
   ```
   pocketledger/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   └── app.js
   └── README.md
   ```
3. Go to **Settings → Pages → Source → Deploy from branch → `main` → `/` (root) → Save**
4. Your app is live at `https://yourusername.github.io/pocketledger`

### Option B — Drop in any folder

Just open `index.html` in any modern browser. Done.

### Option C — Netlify Drag & Drop

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder in
3. Live in seconds with a free URL

---

## 📸 Screenshots

> *(Add screenshots here after deploying)*

| Dark Mode | Light Mode |
|---|---|
| ![Dark](screenshots/dark.png) | ![Light](screenshots/light.png) |

---

## 🗂 File Structure

```
pocketledger/
├── index.html        # Single-page app shell, Tailwind CDN, all markup
├── css/
│   └── style.css     # Custom CSS: category buttons, expense items, animations
├── js/
│   └── app.js        # All logic: state, localStorage, render, events
└── README.md
```

**No build step. No `npm install`. No config.** Open `index.html` and it works.

---

## 💾 Data Storage

All data is stored in your browser's `localStorage` under two keys:

- `pl_expenses_v1` — array of expense objects
- `pl_budget` — monthly budget number
- `pl_theme` — `"dark"` or `"light"`

**To back up your data:** use the CSV export button in the header.

**To move data to another browser/device:** export CSV, keep it safe. (Full import feature is on the roadmap.)

---

## 🔮 Future Ideas

- [ ] CSV **import** to restore from backup
- [ ] Recurring expenses (rent, subscriptions)
- [ ] Monthly comparison chart (this month vs last month)
- [ ] Emoji custom categories
- [ ] Notes field on each expense
- [ ] PWA / installable app
- [ ] Multi-currency support
- [ ] Weekly/monthly summary email (opt-in, client-side mailto)

---

## 🤔 Why PocketLedger?

Because every other expense app wants:

- ❌ A $9.99/month subscription
- ❌ Your email address
- ❌ Cloud sync you didn't ask for
- ❌ A 47-step onboarding flow

PocketLedger wants nothing. Open it. Track stuff. Close it. That's it.

---

## 📄 License

MIT — do whatever you want with it.

---

*Built with HTML, Tailwind CSS CDN, and vanilla JavaScript. Zero dependencies. Zero tracking. Zero nonsense.*
