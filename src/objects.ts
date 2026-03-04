import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GROUND_Y, ENEMY_ANIMS, gameScale } from './constants';
import { getAnimFrames } from './spritesheet';

export interface GameObject {
  container: PIXI.Container;
  active: boolean;
  type: 'cone' | 'enemy' | 'dollar' | 'paypalMoney';
  enemySpeed?: number;
  animatedSprite?: PIXI.AnimatedSprite;
  floatTicker?: () => void;
  getBounds(): { x: number; y: number; width: number; height: number };
}

export function spawnCone(parent: PIXI.Container): GameObject {
  const container = new PIXI.Container();

  // Background cone (outline) behind the actual cone
  const bgConeTex = PIXI.Assets.get('backgroundCone') as PIXI.Texture;
  const bgCone = new PIXI.Sprite(bgConeTex);
  bgCone.anchor.set(0.5, 1);
  bgCone.scale.set(0.6);
  bgCone.alpha = 0.5;
  container.addChild(bgCone);

  // Actual cone on top
  const coneTex = PIXI.Assets.get('cone') as PIXI.Texture;
  const cone = new PIXI.Sprite(coneTex);
  cone.anchor.set(0.5, 1);
  cone.scale.set(0.5);
  container.addChild(cone);

  container.x = GAME_WIDTH + 50;
  container.y = GROUND_Y;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: 'cone',
    getBounds() {
      const w = coneTex.width * 0.5;
      const h = coneTex.height * 0.5;
      return {
        x: container.x - w / 2,
        y: container.y - h,
        width: w,
        height: h,
      };
    },
  };
}

export function spawnEnemy(
  parent: PIXI.Container,
  enemySheet: PIXI.Spritesheet
): GameObject {
  const frames = getAnimFrames(enemySheet, 'enemy', ENEMY_ANIMS.run);
  const animSprite = new PIXI.AnimatedSprite(frames);
  animSprite.anchor.set(0.5, 1);
  animSprite.animationSpeed = 0.2;
  animSprite.play();

  const targetHeight = 110 * gameScale();
  const frameH = frames[0]?.height || 350;
  const scale = targetHeight / frameH;
  animSprite.scale.set(scale);
  animSprite.scale.x = -scale; // face left — toward the player

  const container = new PIXI.Container();
  container.addChild(animSprite);
  container.x = GAME_WIDTH + 100;
  container.y = GROUND_Y;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: 'enemy',
    enemySpeed: 2 + Math.random() * 2,
    animatedSprite: animSprite,
    getBounds() {
      const w = (frames[0]?.width || 180) * scale * 0.7;
      const h = frameH * scale * 0.8;
      return {
        x: container.x - w / 2,
        y: container.y - h,
        width: w,
        height: h,
      };
    },
  };
}

export function spawnCollectible(parent: PIXI.Container): GameObject {
  const isDollar = Math.random() > 0.3;
  const texKey = isDollar ? 'dollar' : 'paypalMoney';
  const tex = PIXI.Assets.get(texKey) as PIXI.Texture;
  const sprite = new PIXI.Sprite(tex);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(isDollar ? 0.06 : 0.12);

  const container = new PIXI.Container();
  container.addChild(sprite);
  container.x = GAME_WIDTH + 50;

  const airborne = Math.random() > 0.5;
  container.y = airborne ? GROUND_Y - 100 - Math.random() * 60 : GROUND_Y - 30;
  parent.addChild(container);

  const baseY = container.y;
  let floatTime = Math.random() * Math.PI * 2;

  const floatFn = () => {
    floatTime += 0.05;
    container.y = baseY + Math.sin(floatTime) * 8;
  };
  PIXI.Ticker.shared.add(floatFn);

  return {
    container,
    active: true,
    type: isDollar ? 'dollar' : 'paypalMoney',
    floatTicker: floatFn,
    getBounds() {
      const s = isDollar ? 0.06 : 0.12;
      const w = tex.width * s;
      const h = tex.height * s;
      return {
        x: container.x - w / 2,
        y: container.y - h / 2,
        width: w,
        height: h,
      };
    },
  };
}
