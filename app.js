/* ===================================================================
   Tic Tac Toe — Parlor Edition
   Vanilla JS game logic + small audio/confetti helpers.
   =================================================================== */

(() => {
  "use strict";

  // ---------------------------------------------------------------
  // Elements
  // ---------------------------------------------------------------
  const cells = Array.from(document.querySelectorAll(".cell"));
  const board = document.getElementById("board");
  const strikeLine = document.getElementById("strike-line");

  const turnIndicator = document.getElementById("turn-indicator");
  const turnText = document.getElementById("turn-text");

  const scoreXEl = document.getElementById("score-x");
  const scoreOEl = document.getElementById("score-o");
  const scoreDEl = document.getElementById("score-d");

  const newGameBtn = document.getElementById("new-game-btn");
  const resetBtn = document.getElementById("reset-btn");

  const modalOverlay = document.getElementById("modal-overlay");
  const modalIcon = document.getElementById("modal-icon");
  const modalTitle = document.getElementById("modal-title");
  const modalSub = document.getElementById("modal-sub");
  const modalBtn = document.getElementById("modal-btn");

  const themeToggle = document.getElementById("theme-toggle");
  const soundToggle = document.getElementById("sound-toggle");

  const confettiCanvas = document.getElementById("confetti-canvas");
  const ctx = confettiCanvas.getContext("2d");

  const WIN_PATTERNS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  let boardState = Array(9).fill("");
  let currentPlayer = "X";
  let gameActive = true;
  let soundOn = true;
  const scores = { X: 0, O: 0, draws: 0 };

  // ---------------------------------------------------------------
  // Audio (Web Audio API — no external files)
  // ---------------------------------------------------------------
  let audioCtx = null;
  const getAudioCtx = () => {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  };

  const playTone = (
    freq,
    duration,
    type = "sine",
    delay = 0,
    gainPeak = 0.09,
  ) => {
    if (!soundOn) return;
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ac.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  };

  const sounds = {
    place: (mark) => playTone(mark === "X" ? 420 : 330, 0.12, "triangle"),
    win: () =>
      [523.25, 659.25, 783.99].forEach((f, i) =>
        playTone(f, 0.28, "sine", i * 0.09, 0.08),
      ),
    draw: () => playTone(220, 0.4, "sine", 0, 0.06),
    click: () => playTone(280, 0.08, "square", 0, 0.04),
  };

  // ---------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------
  const setTurnIndicator = () => {
    turnText.textContent = `${currentPlayer} to move`;
    turnIndicator.classList.toggle("turn-o", currentPlayer === "O");
    turnIndicator.classList.remove("game-over");
  };

  const placeMark = (cell, index) => {
    boardState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.dataset.mark = currentPlayer;
    cell.disabled = true;
    cell.classList.add("pop");
    cell.setAttribute("aria-label", `${currentPlayer} placed`);
    sounds.place(currentPlayer);
  };

  const disableAllCells = () => cells.forEach((c) => (c.disabled = true));

  const drawStrikeLine = (pattern) => {
    const boardRect = board.getBoundingClientRect();
    const startRect = cells[pattern[0]].getBoundingClientRect();
    const endRect = cells[pattern[2]].getBoundingClientRect();

    const svg = document.getElementById("strike-svg");
    svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);

    const x1 = startRect.left + startRect.width / 2 - boardRect.left;
    const y1 = startRect.top + startRect.height / 2 - boardRect.top;
    const x2 = endRect.left + endRect.width / 2 - boardRect.left;
    const y2 = endRect.top + endRect.height / 2 - boardRect.top;

    strikeLine.setAttribute("x1", x1);
    strikeLine.setAttribute("y1", y1);
    strikeLine.setAttribute("x2", x2);
    strikeLine.setAttribute("y2", y2);

    const length = Math.hypot(x2 - x1, y2 - y1) + 20;
    strikeLine.style.strokeDasharray = length;
    strikeLine.style.strokeDashoffset = length;
    strikeLine.classList.add("draw-line");
    strikeLine.style.opacity = "1";

    // Force reflow so the transition below actually animates.
    strikeLine.getBoundingClientRect();
    strikeLine.style.strokeDashoffset = "0";
  };

  const resetStrikeLine = () => {
    strikeLine.classList.remove("draw-line");
    strikeLine.style.opacity = "0";
    strikeLine.removeAttribute("x1");
    strikeLine.removeAttribute("y1");
    strikeLine.removeAttribute("x2");
    strikeLine.removeAttribute("y2");
  };

  const bumpScore = (el) => {
    el.classList.remove("bump");
    void el.offsetWidth; // restart animation
    el.classList.add("bump");
  };

  // ---------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------
  const showModal = ({ icon, title, sub }) => {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalSub.textContent = sub;
    modalOverlay.classList.remove("hide");
    modalBtn.focus();
  };

  const hideModal = () => modalOverlay.classList.add("hide");

  // ---------------------------------------------------------------
  // Confetti
  // ---------------------------------------------------------------
  let confettiParticles = [];
  let confettiRAF = null;
  const CONFETTI_COLORS = [
    "#c9a227",
    "#e8c565",
    "#e8935a",
    "#5cd6c3",
    "#f3ecdc",
  ];

  const resizeCanvas = () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  };

  const launchConfetti = () => {
    resizeCanvas();
    confettiParticles = Array.from({ length: 120 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height * 0.4,
      size: 4 + Math.random() * 5,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedY: 2 + Math.random() * 3,
      speedX: -1.5 + Math.random() * 3,
      rotation: Math.random() * 360,
      spin: -8 + Math.random() * 16,
    }));

    const start = performance.now();
    const duration = 2600;

    const tick = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      confettiParticles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < duration) {
        confettiRAF = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    };

    cancelAnimationFrame(confettiRAF);
    confettiRAF = requestAnimationFrame(tick);
  };

  // ---------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------
  const findWinningPattern = () => {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (
        boardState[a] &&
        boardState[a] === boardState[b] &&
        boardState[b] === boardState[c]
      ) {
        return pattern;
      }
    }
    return null;
  };

  const isBoardFull = () => boardState.every((v) => v !== "");

  const handleWin = (pattern, winner) => {
    gameActive = false;
    disableAllCells();
    pattern.forEach((i) => cells[i].classList.add("win-cell"));
    drawStrikeLine(pattern);

    scores[winner] += 1;
    const scoreEl = winner === "X" ? scoreXEl : scoreOEl;
    scoreEl.textContent = scores[winner];
    bumpScore(scoreEl);

    turnText.textContent = `${winner} wins the round`;
    turnIndicator.classList.add("game-over");

    sounds.win();
    launchConfetti();

    setTimeout(() => {
      showModal({
        icon: winner,
        title: `${winner} Wins!`,
        sub: describePattern(pattern),
      });
    }, 550);
  };

  const handleDraw = () => {
    gameActive = false;
    scores.draws += 1;
    scoreDEl.textContent = scores.draws;
    bumpScore(scoreDEl);

    turnText.textContent = "It's a draw";
    turnIndicator.classList.add("game-over");

    sounds.draw();

    setTimeout(() => {
      showModal({
        icon: "=",
        title: "It's a Draw",
        sub: "Every square is full — no three in a row.",
      });
    }, 300);
  };

  const describePattern = (pattern) => {
    const rows = {
      "0,1,2": "top row",
      "3,4,5": "middle row",
      "6,7,8": "bottom row",
    };
    const cols = {
      "0,3,6": "left column",
      "1,4,7": "middle column",
      "2,5,8": "right column",
    };
    const diags = {
      "0,4,8": "the falling diagonal",
      "2,4,6": "the rising diagonal",
    };
    const key = pattern.join(",");
    return `Three in a row along ${rows[key] || cols[key] || diags[key]}.`;
  };

  const handleCellClick = (cell, index) => {
    if (!gameActive || boardState[index] !== "") return;

    placeMark(cell, index);

    const winPattern = findWinningPattern();
    if (winPattern) {
      handleWin(winPattern, currentPlayer);
      return;
    }

    if (isBoardFull()) {
      handleDraw();
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    setTurnIndicator();
  };

  // ---------------------------------------------------------------
  // Round / match control
  // ---------------------------------------------------------------
  const startNewRound = () => {
    boardState = Array(9).fill("");
    currentPlayer = "X";
    gameActive = true;

    cells.forEach((cell) => {
      cell.disabled = false;
      cell.textContent = "";
      cell.removeAttribute("data-mark");
      cell.removeAttribute("aria-label");
      cell.classList.remove("pop", "win-cell");
    });

    resetStrikeLine();
    setTurnIndicator();
    hideModal();
  };

  const resetMatch = () => {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;
    scoreXEl.textContent = "0";
    scoreOEl.textContent = "0";
    scoreDEl.textContent = "0";
    startNewRound();
  };

  // ---------------------------------------------------------------
  // Theme + sound toggles
  // ---------------------------------------------------------------
  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    sounds.click();
  };

  const toggleSound = () => {
    soundOn = !soundOn;
    document.body.classList.toggle("muted", !soundOn);
    if (soundOn) sounds.click();
  };

  // ---------------------------------------------------------------
  // Keyboard navigation across the grid
  // ---------------------------------------------------------------
  const handleBoardKeydown = (e) => {
    const key = e.key;
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrowKeys.includes(key)) return;

    const focused = document.activeElement;
    const index = cells.indexOf(focused);
    if (index === -1) return;

    e.preventDefault();
    const row = Math.floor(index / 3);
    const col = index % 3;
    let nextIndex = index;

    if (key === "ArrowUp") nextIndex = ((row + 2) % 3) * 3 + col;
    if (key === "ArrowDown") nextIndex = ((row + 1) % 3) * 3 + col;
    if (key === "ArrowLeft") nextIndex = row * 3 + ((col + 2) % 3);
    if (key === "ArrowRight") nextIndex = row * 3 + ((col + 1) % 3);

    cells[nextIndex].focus();
  };

  // ---------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------
  cells.forEach((cell, index) => {
    cell.addEventListener("click", () => handleCellClick(cell, index));
  });

  board.addEventListener("keydown", handleBoardKeydown);
  newGameBtn.addEventListener("click", startNewRound);
  resetBtn.addEventListener("click", resetMatch);
  modalBtn.addEventListener("click", startNewRound);
  themeToggle.addEventListener("click", toggleTheme);
  soundToggle.addEventListener("click", toggleSound);
  window.addEventListener("resize", resizeCanvas);

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  resizeCanvas();
  setTurnIndicator();
})();
