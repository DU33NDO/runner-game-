import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GROUND_Y, ENEMY_SHEET } from './constants';

export interface GameObject {
  container: PIXI.Container;
  active: boolean;
  type: 'cone' | 'enemy' | 'dollar' | 'paypalMoney';
  enemySpeed?: number;
  animatedSprite?: PIXI.AnimatedSprite;
  getBounds(): { x: number; y: number; width: number; height: number };
}

export function spawnCone(parent: PIXI.Container): GameObject {
  const tex = PIXI.Assets.get('cone') as PIXI.Texture;
  const sprite = new PIXI.Sprite(tex);
  sprite.anchor.set(0.5, 1);
  sprite.scale.set(0.5);

  const container = new PIXI.Container();
  container.addChild(sprite);
  container.x = GAME_WIDTH + 50;
  container.y = GROUND_Y;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: 'cone',
    getBounds() {
      const w = tex.width * 0.5;
      const h = tex.height * 0.5;
      return {
        x: container.x - w / 2,
        y: container.y - h,
        width: w,
        height: h,
      };
    },
  };
}

export function spawnEnemy(parent: PIXI.Container): GameObject {
  const baseTex = PIXI.Assets.get('enemyActions');
  const base = baseTex.baseTexture || baseTex;
  const { cols, frameWidth, frameHeight } = ENEMY_SHEET;

  // Use first row as run cycle
  const frames: PIXI.Texture[] = [];
  for (let col = 0; col < cols; col++) {
    const rect = new PIXI.Rectangle(col * frameWidth, 0, frameWidth, frameHeight);
    frames.push(new PIXI.Texture(base instanceof PIXI.BaseTexture ? base : base.baseTexture, rect));
  }

  const animSprite = new PIXI.AnimatedSprite(frames);
  animSprite.anchor.set(0.5, 1);
  animSprite.animationSpeed = 0.2;
  animSprite.play();

  // Scale to reasonable size
  const targetHeight = 110;
  const scale = targetHeight / frameHeight;
  animSprite.scale.set(scale);

  const container = new PIXI.Container();
  container.addChild(animSprite);
  container.x = GAME_WIDTH + 100;
  container.y = GROUND_Y;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: 'enemy',
    enemySpeed: 2 + Math.random() * 2, // extra speed toward player
    animatedSprite: animSprite,
    getBounds() {
      const w = frameWidth * scale * 0.7;
      const h = frameHeight * scale * 0.8;
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
  // Randomly pick dollar or paypalMoney
  const isDollar = Math.random() > 0.3;
  const texKey = isDollar ? 'dollar' : 'paypalMoney';
  const tex = PIXI.Assets.get(texKey) as PIXI.Texture;
  const sprite = new PIXI.Sprite(tex);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(isDollar ? 0.06 : 0.12);

  const container = new PIXI.Container();
  container.addChild(sprite);
  container.x = GAME_WIDTH + 50;
  // Random height - some on ground, some in air (jumpable)
  const airborne = Math.random() > 0.5;
  container.y = airborne ? GROUND_Y - 100 - Math.random() * 60 : GROUND_Y - 30;
  parent.addChild(container);

  // Floating animation
  const baseY = container.y;
  let floatTime = Math.random() * Math.PI * 2;

  const origGetBounds = () => {
    const s = isDollar ? 0.06 : 0.12;
    const w = tex.width * s;
    const h = tex.height * s;
    return {
      x: container.x - w / 2,
      y: container.y - h / 2,
      width: w,
      height: h,
    };
  };

  // Add float animation via ticker
  const ticker = PIXI.Ticker.shared;
  const floatFn = () => {
    floatTime += 0.05;
    container.y = baseY + Math.sin(floatTime) * 8;
  };
  ticker.add(floatFn);

  return {
    container,
    active: true,
    type: isDollar ? 'dollar' : 'paypalMoney',
    getBounds: origGetBounds,
  };
}
