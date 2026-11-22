import { CanvasTexture, Group, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { drawClaudeSpark, drawOpenAIBlossom } from "./book-logos";

// Logos on the two books on the shelf, as decals laid a hair over the baked faces:
// the Claude spark on the orange book's cover (the face the camera sees) and the
// OpenAI blossom with its name down the grey book's spine.
//
// Coordinates are the books' faces in the shelf mesh's local space (from room.glb).
// The cover decal sits towards the spine (+X) so the plant pot in front of the shelf
// doesn't hide the name.
const ORANGE_COVER = { x: -2.247 + 0.12, y: 4.48, z: 5.774 - 0.004, width: 0.5, height: 0.64 };
const GREY_SPINE = { x: -1.855 + 0.004, y: 4.456, z: 6.243, width: 0.2, height: 0.72 };

let group: Group | null = null;
const FONT = '800 {size}px "Urbanist", "Arial", sans-serif';

const makeDecal = (width: number, height: number, pxPerUnit: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * pxPerUnit);
  canvas.height = Math.round(height * pxPerUnit);
  const ctx = canvas.getContext("2d")!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = LinearSRGBColorSpace;
  texture.anisotropy = 4;
  const paint = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);
    texture.needsUpdate = true;
  };
  paint();
  // Repaint once the site font is ready (the canvas can't wait for CSS on its own).
  document.fonts?.load(FONT.replace("{size}", "40")).then(paint).catch(() => {});
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  return new Mesh(new PlaneGeometry(width, height), material);
};

const init = (parent: Group, shelf: Object3D) => {
  if (group) return;
  group = new Group();
  group.name = "book-logos";
  group.position.copy(shelf.position);
  parent.add(group);

  const cream = "#fdf6ea";
  const cover = makeDecal(ORANGE_COVER.width, ORANGE_COVER.height, 800, (ctx, w, h) => {
    drawClaudeSpark(ctx, w / 2, h * 0.4, w * 0.27, cream);
    ctx.fillStyle = cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = FONT.replace("{size}", String(Math.round(w * 0.17)));
    ctx.fillText("Claude", w / 2, h * 0.78);
  });
  cover.position.set(ORANGE_COVER.x, ORANGE_COVER.y, ORANGE_COVER.z);
  cover.rotation.y = Math.PI; // faces -Z, like the cover
  group.add(cover);

  const ink = "#232531";
  const spine = makeDecal(GREY_SPINE.width, GREY_SPINE.height, 1000, (ctx, w, h) => {
    drawOpenAIBlossom(ctx, w / 2, w * 0.62, w * 0.36, ink);
    ctx.save();
    ctx.translate(w / 2, h * 0.62);
    ctx.rotate(Math.PI / 2); // reads top to bottom, like a real spine
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = FONT.replace("{size}", String(Math.round(w * 0.4)));
    ctx.fillText("OpenAI", 0, 0);
    ctx.restore();
  });
  spine.position.set(GREY_SPINE.x, GREY_SPINE.y, GREY_SPINE.z);
  spine.rotation.y = Math.PI / 2; // faces +X, like the spine
  group.add(spine);
};

const destroy = () => {
  group?.removeFromParent();
  group = null;
};

export const books = { init, destroy };
