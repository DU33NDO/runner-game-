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

  const bush1 = PIXI.Assets.get("bush1") as PIXI.Texture;
  const bush2 = PIXI.Assets.get("bush2") as PIXI.Texture;
  const bush3 = PIXI.Assets.get("bush3") as PIXI.Texture;
  const tree1 = PIXI.Assets.get("tree1") as PIXI.Texture;
  const tree2 = PIXI.Assets.get("tree2") as PIXI.Texture;
  const lampTex = PIXI.Assets.get("lamp") as PIXI.Texture;

  // ── Decoration configs ────────────────────────────────────────────────────
  // Each entry: [texture, x, groundYOffset, baseScale, speedMul]
  // groundYOffset: pixels above GROUND_Y at base scale (negative = above ground)
  // baseScale: size multiplier at gameScale() == 1

  type DecorCfg = [PIXI.Texture, number, number, number, number];

  const PORTRAIT_CONFIGS: DecorCfg[] = [
    // Trees
    [tree1, 60, -170, 1.15, 1.0],
    [tree1, 370, -170, 1.1, 1.0],
    [tree2, 700, -170, 1.1, 1.0],
    [tree2, 1180, -170, 1.1, 1.0],
    // Lamps
    [lampTex, 150, -170, 1.1, 1.0],
    [lampTex, 460, -170, 1.1, 1.0],
    [lampTex, 780, -170, 1.1, 1.0],
    // Bushes
    [bush1, 110, -170, 0.42, 1.0],
    [bush3, 400, -170, 0.32, 1.0],
    [bush2, 620, -170, 0.4, 1.0],
    [bush1, 830, -170, 0.44, 1.0],
  ];

  const LANDSCAPE_CONFIGS: DecorCfg[] = [
    // Trees
    [tree1, 60, -170, 1.15, 1.0],
    [tree1, 370, -170, 1.1, 1.0],
    [tree2, 700, -170, 1.1, 1.0],
    [tree2, 1180, -170, 1.1, 1.0],
    // Lamps
    [lampTex, 150, -170, 1.1, 1.0],
    [lampTex, 460, -170, 1.1, 1.0],
    [lampTex, 780, -170, 1.1, 1.0],
    // Bushes
    [bush1, 110, -170, 0.42, 1.0],
    [bush3, 400, -170, 0.32, 1.0],
    [bush2, 620, -170, 0.4, 1.0],
    [bush1, 830, -170, 0.44, 1.0],
  ];

  // ── Spawn sprites (one per config slot, reused across orientations) ────────
  const decorations = PORTRAIT_CONFIGS.map(
    ([tex, x, groundYOffset, baseScale]) => {
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5, 1);
      sprite.x = x;
      sprite.y = GROUND_Y + groundYOffset * gameScale();
      sprite.scale.set(baseScale * gameScale());
      parent.addChild(sprite);
      return { sprite, speedMul: 1.0 };
    },
  );

  // ── Public API ────────────────────────────────────────────────────────────
  function resize() {
    const isLandscape = GAME_WIDTH > GAME_HEIGHT;
    bgLayer.width = GAME_WIDTH;
    bgLayer.height = GAME_HEIGHT;
    bgLayer.y = isLandscape ? -20 : -20; // ← landscape y  | portrait y
    bgLayer.tileScale.set(isLandscape ? 0.9 : 0.9); // ← landscape scale | portrait scale

    const configs = isLandscape ? LANDSCAPE_CONFIGS : PORTRAIT_CONFIGS;

    for (let i = 0; i < decorations.length; i++) {
      const [, , groundYOffset, baseScale, speedMul] = configs[i];
      decorations[i].speedMul = speedMul;
      decorations[i].sprite.y = GROUND_Y + groundYOffset * gameScale();
      decorations[i].sprite.scale.set(baseScale * gameScale());
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
