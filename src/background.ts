import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants';

interface ScrollingLayer {
  sprites: PIXI.Sprite[];
  speed: number; // parallax multiplier
}

export function createScrollingBackground(parent: PIXI.Container) {
  // Main background - sky and ground (tiles horizontally)
  const bgTexture = PIXI.Assets.get('background') as PIXI.Texture;
  const bgLayer = createTilingLayer(parent, bgTexture, GAME_HEIGHT * 0.6, 0.3, 0);

  // Ground line
  const groundLine = new PIXI.Graphics();
  groundLine.beginFill(0x8ba86e);
  groundLine.drawRect(0, GROUND_Y, GAME_WIDTH, 4);
  groundLine.endFill();
  // Ground fill below
  groundLine.beginFill(0x7a9960);
  groundLine.drawRect(0, GROUND_Y + 4, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
  groundLine.endFill();
  parent.addChild(groundLine);

  // Decorative layers - bushes and trees at varying parallax
  const bush1 = PIXI.Assets.get('bush1') as PIXI.Texture;
  const bush2 = PIXI.Assets.get('bush2') as PIXI.Texture;
  const bush3 = PIXI.Assets.get('bush3') as PIXI.Texture;
  const tree1 = PIXI.Assets.get('tree1') as PIXI.Texture;
  const tree2 = PIXI.Assets.get('tree2') as PIXI.Texture;
  const lampTex = PIXI.Assets.get('lamp') as PIXI.Texture;

  // Place decorations
  const decorations: { sprite: PIXI.Sprite; speedMul: number; baseX: number }[] = [];

  function addDecor(tex: PIXI.Texture, x: number, y: number, scale: number, speedMul: number) {
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 1);
    s.x = x;
    s.y = y;
    s.scale.set(scale);
    parent.addChild(s);
    decorations.push({ sprite: s, speedMul, baseX: x });
    return s;
  }

  // Background bushes (slow parallax)
  addDecor(bush1, 100, GROUND_Y + 5, 0.4, 0.5);
  addDecor(bush2, 300, GROUND_Y + 5, 0.35, 0.5);
  addDecor(bush3, 500, GROUND_Y + 5, 0.3, 0.5);

  // Trees (medium parallax)
  addDecor(tree1, 200, GROUND_Y - 10, 0.5, 0.6);
  addDecor(tree2, 450, GROUND_Y - 10, 0.45, 0.6);

  // Lamps (same speed as game)
  addDecor(lampTex, 350, GROUND_Y - 5, 0.3, 1.0);

  // Track scroll position
  let scrollOffset = 0;

  function update(scrollDelta: number) {
    scrollOffset += scrollDelta;

    // Scroll tiling background
    bgLayer.tilePosition.x -= scrollDelta * 0.3;

    // Move decorations and loop them
    for (const dec of decorations) {
      dec.sprite.x -= scrollDelta * dec.speedMul;
      // Wrap around when off-screen left
      if (dec.sprite.x < -100) {
        dec.sprite.x += GAME_WIDTH + 200;
      }
    }
  }

  return { update };
}

function createTilingLayer(
  parent: PIXI.Container,
  texture: PIXI.Texture,
  height: number,
  _speedMul: number,
  yPos: number
): PIXI.TilingSprite {
  const tiling = new PIXI.TilingSprite(texture, GAME_WIDTH, height);
  tiling.y = yPos;
  parent.addChild(tiling);
  return tiling;
}
