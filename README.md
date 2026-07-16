# 🎮 Tic Tac Toe — Parlor Edition

A polished, portfolio-ready Tic Tac Toe built with **HTML, CSS, and vanilla JavaScript** — no frameworks, no libraries. Glassmorphism board, brass-and-felt color palette, animated winning strike line, live scoreboard, and sound — all in three clean files.

## 🌐 Live Demo

https://tic-tac-toe-game-zeta-lemon-94.vercel.app/

## ✨ Features

**Gameplay**

- Classic 2-player X vs O on a 3×3 board
- Turn indicator with a glowing dot that switches color per player
- Win detection across all 8 patterns, with the winning row/column/diagonal highlighted
- Animated brass "strike line" drawn across the winning cells
- Draw detection with its own message
- Winner modal with title, description of the winning line, and a **Play Again** action
- **New Round** button (clears the board, keeps the score)
- **Reset Match** button (clears the board and the scoreboard)

**Scoreboard**

- Live X wins / O wins / Draws counters with a bump animation on every update

**Polish**

- Glassmorphism panels over a deep emerald "felt table" gradient background
- Distinct accent colors for X (copper) and O (teal) with soft glow
- Pop-in animation when a mark is placed, hover/press feedback on every button
- Confetti burst on a win, themed to the game's palette
- Sound effects generated with the Web Audio API (no audio files) — mutable with one tap
- Dark / light theme toggle
- Fully responsive, from mobile to desktop
- Keyboard accessible — arrow keys move focus around the grid, all controls are tab-reachable with visible focus rings
- Respects `prefers-reduced-motion` for users who've disabled animations

## 🛠️ Tech Stack

- HTML5
- CSS3 (custom properties, no framework)
- Vanilla JavaScript (ES6+, no dependencies)

## 📁 Project Structure

```
├── index.html   # Markup and layout
├── style.css    # Design tokens, layout, and animations
├── app.js       # Game logic, scoring, sound, and theme handling
└── README.md
```

## ▶️ Running Locally

No build step required.

```bash
git clone <your-repo-url>
cd tic-tac-toe
```

Then just open `index.html` in your browser, or serve it locally:

```bash
npx serve .
```

## 👨‍💻 Author

Abhishek Akkal
