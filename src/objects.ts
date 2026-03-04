import * as PIXI from "pixi.js";
import { GAME_WIDTH, GROUND_Y, ENEMY_ANIMS, gameScale } from "./constants";
import { getAnimFrames } from "./spritesheet";

export interface GameObject {
  container: PIXI.Container;
  active: boolean;
  type: "cone" | "enemy" | "dollar" | "paypalMoney";
  enemySpeed?: number;
  animatedSprite?: PIXI.AnimatedSprite;
  floatTicker?: () => void;
  getBounds(): { x: number; y: number; width: number; height: number };
}

export function spawnCone(parent: PIXI.Container): GameObject {
  const container = new PIXI.Container();

  // Background cone (outline) behind the actual cone
  const bgConeTex = PIXI.Assets.get("backgroundCone") as PIXI.Texture;
  const bgCone = new PIXI.Sprite(bgConeTex);
  bgCone.anchor.set(0.5, 1);
  bgCone.scale.set(0.65 * gameScale());
  bgCone.alpha = 0.5;
  container.addChild(bgCone);

  // Actual cone on top
  const coneTex = PIXI.Assets.get("cone") as PIXI.Texture;
  const coneScale = 0.55 * gameScale();
  const cone = new PIXI.Sprite(coneTex);
  cone.anchor.set(0.5, 1);
  cone.scale.set(coneScale);
  container.addChild(cone);

  // EVADE label above the cone
  const EVADE_W = 88;
  const EVADE_H = 26;
  const coneVisualH = coneTex.height * coneScale;

  const evadeBtn = new PIXI.Container();
  const evadeBg = new PIXI.Graphics();
  evadeBg.lineStyle(2, 0x000000, 1);
  evadeBg.beginFill(0xffdd00);
  evadeBg.drawRoundedRect(-EVADE_W / 2, -EVADE_H / 2, EVADE_W, EVADE_H, 6);
  evadeBg.endFill();
  evadeBtn.addChild(evadeBg);

  const evadeText = new PIXI.Text("EVADE", {
    fontSize: 14,
    fontWeight: "bold",
    fill: 0xdd0000,
    fontFamily: "GameFont, sans-serif",
    stroke: 0x000000,
    strokeThickness: 2,
  });
  evadeText.anchor.set(0.5, 0.5);
  evadeBtn.addChild(evadeText);

  const evadeBaseY = -(coneVisualH + EVADE_H / 2 + 22);
  evadeBtn.y = evadeBaseY;
  container.addChild(evadeBtn);

  let evadeFloat = 0;
  const evadeFloatFn = () => {
    evadeFloat += 0.05;
    evadeBtn.y = evadeBaseY + Math.sin(evadeFloat) * 4;
  };
  PIXI.Ticker.shared.add(evadeFloatFn);

  container.x = GAME_WIDTH + 50;
  container.y = GROUND_Y - 20;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: "cone",
    floatTicker: evadeFloatFn,
    getBounds() {
      const w = coneTex.width * coneScale;
      const h = coneTex.height * coneScale;
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
  enemySheet: PIXI.Spritesheet,
): GameObject {
  const frames = getAnimFrames(enemySheet, "enemy", ENEMY_ANIMS.run);
  const animSprite = new PIXI.AnimatedSprite(frames);
  animSprite.anchor.set(0.5, 1);
  animSprite.animationSpeed = 0.2;
  animSprite.play();

  const targetHeight = 180 * gameScale();
  const frameH = frames[0]?.height || 350;
  const scale = targetHeight / frameH;
  animSprite.scale.set(scale);
  animSprite.scale.x = -scale; // face left — toward the player

  const container = new PIXI.Container();
  container.addChild(animSprite);
  container.x = GAME_WIDTH + 100;
  container.y = GROUND_Y - 20;
  parent.addChild(container);

  return {
    container,
    active: true,
    type: "enemy",
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

export function spawnCollectible(
  parent: PIXI.Container,
  forceGround = false,
): GameObject {
  const isDollar = Math.random() > 0.3;
  const texKey = isDollar ? "dollar" : "paypalMoney";
  const tex = PIXI.Assets.get(texKey) as PIXI.Texture;
  const sprite = new PIXI.Sprite(tex);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(isDollar ? 0.09 : 0.095);

  const container = new PIXI.Container();
  container.addChild(sprite);
  container.x = GAME_WIDTH + 50;

  const airborne = !forceGround && Math.random() > 0.5;
  container.y = airborne ? GROUND_Y - 140 - Math.random() * 80 : GROUND_Y - 50;
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
    type: isDollar ? "dollar" : "paypalMoney",
    floatTicker: floatFn,
    getBounds() {
      const s = isDollar ? 0.09 : 0.095;
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

/**
 * Spawns 5 dollar / paypalMoney collectibles in an arc formation.
 * The arc matches a natural jump trajectory — player must jump to collect them.
 *
 *         $         ← peak (~160px above ground)
 *      $     $      ← mid  (~130px)
 *   $           $   ← low  (~100px)
 */
export function spawnJumpCoins(parent: PIXI.Container): GameObject[] {
  const sc = gameScale();

  // [x-offset from base, y height above GROUND_Y]
  const arc: [number, number][] = [
    [0, 210 * sc],
    [90 * sc, 260 * sc],
    [180 * sc, 300 * sc], // peak
    [270 * sc, 260 * sc],
    [360 * sc, 220 * sc],
  ];

  const baseX = GAME_WIDTH + 30;
  const coins: GameObject[] = [];

  for (const [dx, heightAboveGround] of arc) {
    const isDollar = Math.random() > 0.4;
    const texKey = isDollar ? "dollar" : "paypalMoney";
    const tex = PIXI.Assets.get(texKey) as PIXI.Texture;
    const s = isDollar ? 0.10 : 0.10;

    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(s);

    const container = new PIXI.Container();
    container.addChild(sprite);
    container.x = baseX + dx;
    container.y = GROUND_Y - heightAboveGround;
    parent.addChild(container);

    const baseY = container.y;
    let floatTime = Math.random() * Math.PI * 2;
    const floatFn = () => {
      floatTime += 0.05;
      container.y = baseY + Math.sin(floatTime) * 7;
    };
    PIXI.Ticker.shared.add(floatFn);

    const w = tex.width * s;
    const h = tex.height * s;

    coins.push({
      container,
      active: true,
      type: isDollar ? "dollar" : "paypalMoney",
      floatTicker: floatFn,
      getBounds() {
        return {
          x: container.x - w / 2,
          y: container.y - h / 2,
          width: w,
          height: h,
        };
      },
    });
  }

  return coins;
}
