import { CanvasTexture, LinearSRGBColorSpace } from "three";
import gsap from "gsap";
import { codeSnippets, type CodeSnippet, type TerminalLine } from "../../../content/code-snippets";
import { playSound } from "../../../features/sounds/utils/sounds";

// A live code editor drawn on a canvas and used as the right monitor's texture: the
// developer types real Laravel code with a human rhythm (bursts, pauses at line ends,
// the odd typo fixed with backspace), then runs a command in the terminal panel and
// moves on to the next file. Only redrawn when something changes (~15×/s while typing).

// Canvas width is fixed; the height follows each screen's aspect (the monitor's UV
// rect is 0.498 × 0.329 ≈ 1.51:1 → 678).
const WIDTH = 1024;

const FONT_FAMILY = '"Fira Code", ui-monospace, Menlo, Consolas, monospace';
const FONT_SIZE = 26;
const LINE_HEIGHT = 35;
const TAB_BAR = 46;
const GUTTER = 64;
const PAD_X = 18;
const TERMINAL_HEIGHT = 168;
const CODE_TOP = TAB_BAR + 12;

// One Dark-ish palette — same hues as the original static screen texture.
const C = {
  bg: "#2b2d33",
  bar: "#21252b",
  lineHighlight: "#31343b",
  gutter: "#4b5263",
  gutterActive: "#abb2bf",
  text: "#abb2bf",
  keyword: "#c678dd",
  string: "#98c379",
  variable: "#e06c75",
  fn: "#61afef",
  type: "#e5c07b",
  number: "#d19a66",
  comment: "#5c6370",
  cursor: "#528bff",
  ok: "#98c379",
  info: "#61afef",
  muted: "#7f848e",
  prompt: "#98c379",
  path: "#56b6c2",
};

type Token = { text: string; color: string };

const TOKEN_RE =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'?)|(\$\w+)|(<\?php)|\b(namespace|use|class|extends|public|private|protected|function|fn|return|new|static|void|true|false|null|if|else|foreach|as)\b|(\b\w+(?=\s*\())|(\b[A-Z]\w*)|(\b\d+(?:\.\d+)?\b)/g;

const tokenize = (line: string): Token[] => {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    if (index > last) tokens.push({ text: line.slice(last, index), color: C.text });
    const color = m[1]
      ? C.comment
      : m[2]
        ? C.string
        : m[3]
          ? C.variable
          : m[4] || m[5]
            ? C.keyword
            : m[6]
              ? C.fn
              : m[7]
                ? C.type
                : C.number;
    tokens.push({ text: m[0], color });
    last = index + m[0].length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), color: C.text });
  return tokens;
};

type Phase = "typing" | "thinking" | "command" | "output" | "done";

export type CodeEditorOptions = {
  height?: number; // canvas height for the screen's aspect (width is 1024)
  flipY?: boolean; // false for glTF-UV screens, true for a plain PlaneGeometry
  sound?: boolean; // play the keyboard sound while typing (default true)
};

export type CodeEditor = ReturnType<typeof createCodeEditor>;

// One independent editor per screen (the hero monitor, the contact laptop).
export const createCodeEditor = (snippets: CodeSnippet[], options: CodeEditorOptions = {}) => {

  const HEIGHT = options.height ?? 678;
  const CODE_BOTTOM = HEIGHT - TERMINAL_HEIGHT - 8;
  const VISIBLE_ROWS = Math.floor((CODE_BOTTOM - CODE_TOP) / LINE_HEIGHT);

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let texture: CanvasTexture | null = null;
  let charWidth = FONT_SIZE * 0.6;

  let snippetIndex = 0;
  let lines: string[] = [];
  let lineTokens: Token[][] = [];
  let typed = 0; // characters of the snippet's code typed so far (newlines included)
  let typo = ""; // wrong characters currently on screen, about to be backspaced
  let phase: Phase = "typing";
  let commandTyped = 0;
  let outputShown = 0;
  let scrollRow = 0;
  let cursorOn = true;
  let lastKeySound = 0;

  let stepCall: gsap.core.Tween | null = null;
  let blinkCall: gsap.core.Tween | null = null;
  let isActive: () => boolean = () => true;
  let running = false;

  const snippet = (): CodeSnippet => snippets[snippetIndex]!;

  const loadSnippet = (index: number) => {
    snippetIndex = index % snippets.length;
    lines = snippet().code.split("\n");
    lineTokens = lines.map(tokenize);
    typed = lines.slice(0, snippet().prefill).join("\n").length + 1;
    typo = "";
    phase = "typing";
    commandTyped = 0;
    outputShown = 0;
    scrollRow = 0;
  };

  // Row/column of the caret after `count` typed characters.
  const caretAt = (count: number) => {
    let remaining = count;
    for (let row = 0; row < lines.length; row++) {
      const len = lines[row]!.length;
      if (remaining <= len) return { row, col: remaining };
      remaining -= len + 1; // + newline
    }
    return { row: lines.length - 1, col: lines[lines.length - 1]!.length };
  };

  const drawTokens = (tokens: Token[], x: number, y: number, maxChars: number) => {
    if (!ctx) return x;
    let drawn = 0;
    for (const token of tokens) {
      if (drawn >= maxChars) break;
      const text = token.text.slice(0, maxChars - drawn);
      ctx.fillStyle = token.color;
      ctx.fillText(text, x, y);
      x += text.length * charWidth;
      drawn += text.length;
    }
    return x;
  };

  const drawTabBar = () => {
    if (!ctx) return;
    ctx.fillStyle = C.bar;
    ctx.fillRect(0, 0, WIDTH, TAB_BAR);

    const name = snippet().file;
    ctx.font = `500 20px ${FONT_FAMILY}`;
    const tabWidth = 64 + ctx.measureText(name).width + 28;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, tabWidth, TAB_BAR);
    ctx.fillStyle = "#8892bf"; // PHP badge, the language's own purple
    ctx.beginPath();
    ctx.roundRect(16, 13, 40, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#1e1f24";
    ctx.font = `700 14px ${FONT_FAMILY}`;
    ctx.fillText("php", 23, 28);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = `500 20px ${FONT_FAMILY}`;
    ctx.fillText(name, 66, 30);

    // A second, inactive tab for a lived-in look.
    const other = snippets[(snippetIndex + 1) % snippets.length]!.file;
    ctx.fillStyle = C.muted;
    ctx.fillText(other, tabWidth + 24, 30);
  };

  const drawCode = () => {
    if (!ctx) return;
    const caret = caretAt(typed);
    // Keep the caret in view: scroll once it reaches the last visible row.
    if (caret.row - scrollRow > VISIBLE_ROWS - 1) scrollRow = caret.row - (VISIBLE_ROWS - 1);

    ctx.font = `400 ${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = "middle";

    let remaining = typed;
    for (let row = 0; row < lines.length; row++) {
      const len = lines[row]!.length;
      const visibleChars = Math.max(0, Math.min(len, remaining));
      remaining -= len + 1;

      const screenRow = row - scrollRow;
      if (screenRow < 0) continue;
      if (screenRow >= VISIBLE_ROWS) break;
      if (row > caret.row) break;

      const y = CODE_TOP + screenRow * LINE_HEIGHT + LINE_HEIGHT / 2;
      const isCaretRow = row === caret.row && phase === "typing";

      if (isCaretRow) {
        ctx.fillStyle = C.lineHighlight;
        ctx.fillRect(0, y - LINE_HEIGHT / 2, WIDTH, LINE_HEIGHT);
      }

      ctx.fillStyle = isCaretRow ? C.gutterActive : C.gutter;
      ctx.textAlign = "right";
      ctx.fillText(String(row + 1), GUTTER - 14, y);
      ctx.textAlign = "left";

      let x = drawTokens(lineTokens[row]!, GUTTER + PAD_X, y, visibleChars);

      if (row === caret.row) {
        if (typo) {
          ctx.fillStyle = C.text;
          ctx.fillText(typo, x, y);
          x += typo.length * charWidth;
        }
        if (phase === "typing" && cursorOn) {
          ctx.fillStyle = C.cursor;
          ctx.fillRect(x, y - FONT_SIZE * 0.62, 3, FONT_SIZE * 1.24);
        }
      }
    }
  };

  const toneColor = (line: TerminalLine) =>
    line.tone === "ok" ? C.ok : line.tone === "info" ? C.info : line.tone === "muted" ? C.muted : C.text;

  const drawTerminal = () => {
    if (!ctx) return;
    const top = HEIGHT - TERMINAL_HEIGHT;
    ctx.fillStyle = C.bar;
    ctx.fillRect(0, top, WIDTH, TERMINAL_HEIGHT);
    ctx.fillStyle = "#3a3f4b";
    ctx.fillRect(0, top, WIDTH, 2);

    ctx.textBaseline = "middle";
    ctx.font = `600 15px ${FONT_FAMILY}`;
    ctx.fillStyle = C.muted;
    ctx.fillText("TERMINAL", 22, top + 20);

    const rowH = 30;
    let y = top + 52;
    ctx.font = `400 21px ${FONT_FAMILY}`;
    ctx.fillStyle = C.prompt;
    ctx.fillText("➜", 22, y);
    ctx.fillStyle = C.path;
    ctx.fillText("app", 50, y);
    let x = 50 + ctx.measureText("app ").width;
    const cmd = snippet().command.slice(0, commandTyped);
    ctx.fillStyle = "#e6e6e6";
    ctx.fillText(cmd, x, y);
    x += ctx.measureText(cmd).width;
    if ((phase === "thinking" || phase === "command") && cursorOn) {
      ctx.fillStyle = C.cursor;
      ctx.fillRect(x + 2, y - 11, 11, 22);
    }

    // Output scrolls up if it has more lines than the panel fits.
    const output = snippet().output.slice(0, outputShown);
    const fit = 3;
    for (const line of output.slice(-fit)) {
      y += rowH;
      ctx.fillStyle = toneColor(line);
      ctx.fillText(line.text, 22, y);
    }
  };

  const draw = () => {
    if (!ctx || !texture) return;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawTabBar();
    drawCode();
    drawTerminal();
    texture.needsUpdate = true;
  };

  const keySound = () => {
    if (options.sound === false) return;
    const now = performance.now();
    // The "keyboard" sprite is ~1.65 s of typing; don't stack copies.
    if (now - lastKeySound < 1700) return;
    lastKeySound = now;
    playSound("keyboard");
  };

  const schedule = (seconds: number) => {
    stepCall?.kill();
    stepCall = gsap.delayedCall(seconds, step);
  };

  const step = () => {
    if (!running) return;
    // Paused while the room isn't on screen or the avatar isn't at this keyboard.
    if (!isActive()) {
      schedule(0.4);
      return;
    }

    const code = snippet().code;

    if (phase === "typing") {
      if (typo) {
        typo = typo.slice(0, -1);
        draw();
        schedule(0.07 + Math.random() * 0.05);
        return;
      }
      if (typed >= code.length) {
        phase = "thinking";
        draw();
        schedule(0.9 + Math.random() * 0.6);
        return;
      }

      const char = code[typed]!;
      // Auto-indent: leading spaces of a new line appear at once, like an editor would.
      if (char === "\n") {
        typed++;
        while (code[typed] === " ") typed++;
        draw();
        schedule(0.18 + Math.random() * 0.45);
        return;
      }
      // Occasional typo at a word start, fixed a beat later.
      if (/[a-z]/.test(char) && /[\s(>$:]/.test(code[typed - 1] ?? " ") && Math.random() < 0.06) {
        typo = "qwertyuiop"[Math.floor(Math.random() * 10)]! + (Math.random() < 0.5 ? char : "");
        keySound();
        draw();
        schedule(0.25 + Math.random() * 0.2);
        return;
      }

      typed++;
      keySound();
      draw();
      // Bursts with short hesitations; punctuation is a touch slower.
      const base = /[;{}()[\]]/.test(char) ? 0.09 : 0.045;
      const pause = Math.random() < 0.04 ? 0.35 + Math.random() * 0.5 : 0;
      schedule(base + Math.random() * 0.05 + pause);
      return;
    }

    if (phase === "thinking") {
      phase = "command";
      schedule(0.1);
      return;
    }

    if (phase === "command") {
      const command = snippet().command;
      if (commandTyped < command.length) {
        commandTyped++;
        keySound();
        draw();
        schedule(0.04 + Math.random() * 0.05);
        return;
      }
      phase = "output";
      draw();
      schedule(0.6);
      return;
    }

    if (phase === "output") {
      if (outputShown < snippet().output.length) {
        outputShown++;
        draw();
        schedule(0.25 + Math.random() * 0.3);
        return;
      }
      phase = "done";
      schedule(3);
      return;
    }

    // done → next file
    loadSnippet(snippetIndex + 1);
    draw();
    schedule(0.8);
  };

  const blink = () => {
    blinkCall = gsap.delayedCall(0.53, () => {
      // Solid caret while keys are flowing; blink only when idle.
      const idle = phase !== "typing" || !isActive();
      const next = idle ? !cursorOn : true;
      if (next !== cursorOn) {
        cursorOn = next;
        draw();
      }
      blink();
    });
  };

  // Everything finished and static — for prefers-reduced-motion.
  const showStill = () => {
    stop();
    loadSnippet(snippetIndex);
    typed = snippet().code.length;
    phase = "done";
    commandTyped = snippet().command.length;
    outputShown = snippet().output.length;
    cursorOn = false;
    draw();
  };

  const start = () => {
    if (running) return;
    running = true;
    if (phase === "done" && typed >= snippet().code.length) loadSnippet(snippetIndex + 1);
    draw();
    schedule(0.5);
    blink();
  };

  const stop = () => {
    running = false;
    stepCall?.kill();
    stepCall = null;
    blinkCall?.kill();
    blinkCall = null;
  };

  const init = (activeCheck: () => boolean) => {
    isActive = activeCheck;
    canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext("2d");

    texture = new CanvasTexture(canvas);
    texture.colorSpace = LinearSRGBColorSpace;
    texture.flipY = options.flipY ?? false;
    texture.anisotropy = 4;

    loadSnippet(0);

    // Draw once with the fallback font right away, again once Fira Code is ready.
    const measure = () => {
      if (!ctx) return;
      ctx.font = `400 ${FONT_SIZE}px ${FONT_FAMILY}`;
      charWidth = ctx.measureText("M").width;
      draw();
    };
    measure();
    document.fonts?.load(`400 ${FONT_SIZE}px "Fira Code"`).then(measure, () => {});

    return texture;
  };

  const destroy = () => {
    stop();
    texture?.dispose();
    texture = null;
    canvas = null;
    ctx = null;
  };

  return { init, start, stop, showStill, destroy };
};

// The developer's right monitor in the hero room.
export const codeEditor = createCodeEditor(codeSnippets);
