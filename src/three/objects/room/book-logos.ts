// Logos drawn on canvases for the book decals (books.ts). Simplified, flat versions
// of the Claude spark and the OpenAI blossom, drawn with paths so they stay crisp
// and need no image assets.

// Claude's spark: rays of slightly different lengths around a centre, each a
// tapered stroke with rounded ends.
export const drawClaudeSpark = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
  const lengths = [1, 0.82, 0.95, 0.78, 1, 0.86, 0.93, 0.8, 0.98, 0.84, 0.9, 0.79];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  lengths.forEach((length, i) => {
    const angle = (i / lengths.length) * Math.PI * 2 + 0.12;
    const inner = r * 0.12;
    const outer = r * length;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(inner, -r * 0.06);
    ctx.lineTo(outer, -r * 0.1);
    ctx.arc(outer, 0, r * 0.1, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(inner, r * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// OpenAI's blossom: six rounded links, each turned 60° from the last and shifted off
// centre, so their legs cross and weave into a hexagonal knot.
export const drawOpenAIBlossom = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.17;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const w = r * 0.56; // link width
  const h = r * 1.0; // link length
  const rad = w / 2;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 3);
    ctx.translate(r * 0.18, -r * 0.38);
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2 - rad);
    ctx.lineTo(-w / 2, -h / 2 + rad);
    ctx.arc(0, -h / 2 + rad, rad, Math.PI, 0);
    ctx.lineTo(w / 2, h / 2 - rad);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
};

// Rounded label plate behind a logo, so it reads on any book colour.
export const drawPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, color: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
};
