import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, gameScale } from "./constants";

export function createScrollingBackground(
  parent: PIXI.Container,
  renderer: PIXI.Renderer,
) {
  const bgTexture = PIXI.Assets.get("background") as PIXI.Texture;
  const W = bgTexture.width;
  const H = bgTexture.height;

  // Bake [original | mirrored] into a double-wide RenderTexture.
  const mirrorTex = PIXI.RenderTexture.create({ width: W * 2, height: H });

  const sOrig = new PIXI.Sprite(bgTexture);
  renderer.render(sOrig, { renderTexture: mirrorTex, clear: true });

  const sMirror = new PIXI.Sprite(bgTexture);
  sMirror.scale.x = -1;
  sMirror.x = W * 2;
  renderer.render(sMirror, { renderTexture: mirrorTex, clear: false });

  sOrig.destroy();
  sMirror.destroy();

  const bgLayer = new PIXI.TilingSprite(mirrorTex, GAME_WIDTH, GAME_HEIGHT);
  bgLayer.y = -20;
  bgLayer.tileScale.set(0.9);
  parent.addChild(bgLayer);

  // ── Decorations ───────────────────────────────────────────────────────────
  // Each decoration stores its base scale and Y offset FROM GROUND_Y so that
  // resize() can reposition everything proportionally.
  const decorations: {
    sprite: PIXI.Sprite;
    speedMul: number;
    groundYOffset: number; // offset from GROUND_Y at base scale
    baseScale: number; // scale at gameScale() == 1
  }[] = [];

  function addDecor(
    tex: PIXI.Texture,
    x: number,
    groundYOffset: number, // e.g. -200 means 200px above the ground line
    baseScale: number,
    speedMul: number,
  ) {
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 1);
    s.x = x;
    s.y = GROUND_Y + groundYOffset * gameScale();
    s.scale.set(baseScale * gameScale());
    parent.addChild(s);
    decorations.push({ sprite: s, speedMul, groundYOffset, baseScale });
    return s;
  }

  const bush1 = PIXI.Assets.get("bush1") as PIXI.Texture;
  const bush2 = PIXI.Assets.get("bush2") as PIXI.Texture;
  const bush3 = PIXI.Assets.get("bush3") as PIXI.Texture;
  const tree1 = PIXI.Assets.get("tree1") as PIXI.Texture;
  const tree2 = PIXI.Assets.get("tree2") as PIXI.Texture;
  const lampTex = PIXI.Assets.get("lamp") as PIXI.Texture;

  // ── Trees — varied depth via scale and y-offset ───────────────────────────
  addDecor(tree1, 60, -170, 1.15, 1.0);
  addDecor(tree1, 370, -170, 1.1, 1.0);
  addDecor(tree2, 700, -170, 1.1, 1.0);
  addDecor(tree2, 1180, -170, 1.1, 1.0);

  // ── Lamps — every ~300px offset from trees ────────────────────────────────
  addDecor(lampTex, 150, -170, 1.1, 1.0);
  addDecor(lampTex, 460, -170, 1.1, 1.0);
  addDecor(lampTex, 780, -170, 1.1, 1.0);

  // ── Bushes — fill gaps, three sizes for variety ───────────────────────────
  addDecor(bush1, 110, -170, 0.42, 1.0);
  addDecor(bush3, 400, -170, 0.32, 1.0);
  addDecor(bush2, 620, -170, 0.4, 1.0);
  addDecor(bush1, 830, -170, 0.44, 1.0);

  // ── Public API ────────────────────────────────────────────────────────────
  function resize() {
    bgLayer.width = GAME_WIDTH;
    bgLayer.height = GAME_HEIGHT;

    for (const dec of decorations) {
      dec.sprite.y = GROUND_Y + dec.groundYOffset * gameScale();
      dec.sprite.scale.set(dec.baseScale * gameScale());
    }
  }

  function update(scrollDelta: number) {
    // [original | mirrored] mirror texture tiles seamlessly — just increment
    bgLayer.tilePosition.x -= scrollDelta;

    for (const dec of decorations) {
      dec.sprite.x -= scrollDelta * dec.speedMul;
      if (dec.sprite.x < -100) dec.sprite.x += GAME_WIDTH + 200;
    }
  }

  return { update, resize };
}
