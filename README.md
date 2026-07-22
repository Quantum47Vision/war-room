# ⚔ War Room — Tribal Wars Command

Unofficial Tribal Wars planning panel userscript for [Tribal Wars](https://www.tribalwars.net/) — farm queue, attack timing, attacker intel, build guide. Fills the rally point but never sends.

> **The tool fills and aims · You press Enter, you command.**

War Room plans attacks, fills the rally point, and moves the cursor onto the Attack button — but it **never sends an attack on its own**. You press the key to send, every time. No auto-send, no auto-click, no bot behaviour.

![War Room panel](docs/screenshot.png) <!-- add a screenshot later -->

---

## ⚠️ Read before installing

- This is an **unofficial, community userscript**. It is NOT an official or Innogames-approved Tribal Wars script and is not hosted on the official Scripts Database.
- Installing unofficial userscripts **may be against the rules of your world/server**. Whether you may use it is **your responsibility** — check your world's script rules first.
- Use entirely at your own risk. The author accepts no liability for account penalties.
- The optional "World Data" feature only reads the **public** map exports (`village.txt`, `player.txt`, `ally.txt`) that you paste in yourself. It stores data locally in your browser and sends nothing anywhere.

---

## ✨ Features

| Tab | What it does |
|-----|--------------|
| **01 · Farm Run** | Paste a target list, set your troops, get a full order of march. Fill & focus Attack so you send with one keypress. Live return-timer board. |
| **02 · Attack** | Eight independent attack forms — each with its own source, target, troops and speeds. |
| **03 · Attacker Intel** | Reads an incoming attack's timing backwards to name the **slowest unit that could anchor it** — tells you if a noble or siege is inside. Names the attacker from public world data. |
| **04 · Attack Timing** | Work backwards from a landing time to know exactly when to click send — for every unit at once. Includes a **noble-train calculator** for back-to-back nobles. |
| **05 · Build Guide** | Reads your village's real building levels, works out the stage, and tells you the single most important next build. |
| **06 · World Data** | Load your world's public village/player/ally lists so Intel can name attackers and show tribe tags. |
| **07 · Settings** | Custom fill hotkey, default world speeds, world-wrap support, full backup & restore. |

---

## 📦 Installation

1. Install a userscript manager for your browser:
   - [Tampermonkey](https://www.tampermonkey.net/) (recommended — Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (open-source alternative)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox only)
2. Click the link below to install:
   - **[Install War Room](https://github.com/YOUR_USERNAME/war-room/raw/main/war-room.user.js)**
3. Confirm the install in the popup.
4. Open Tribal Wars — the ⚔ War Room button appears in the bottom-right corner.

---

## 🛠️ Usage

- Click the **⚔ War Room** button to open the panel.
- Drag the button to reposition it; drag the panel title bar or edges to move/resize.
- Press **Q** (configurable) on the Farm tab to fill the next queued target.
- Press **Esc** to close the panel.
- Use **Grab my coords** in the title bar to auto-read your current village.

---

## 🔒 Data & Privacy

- All data (settings, farm queues, attack forms, world data) is stored **locally in your browser** via `GM_setValue` / `localStorage`.
- The script **never phones home** — no analytics, no server, no external requests.
- Export a backup anytime from Settings → Backup & restore.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please read the code carefully before submitting — this tool is used by real players in live games, so stability and safety matter more than features.

---

## 📄 License

[MIT](LICENSE) — provided as-is, no warranty.

---

## 🙏 Acknowledgements

Built for the Tribal Wars community. Not affiliated with or endorsed by Innogames.
