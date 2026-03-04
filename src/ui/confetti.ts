import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";

const COLORS = [0xff3333, 0x33cc33, 0x3399ff, 0xffdd00, 0xff66cc, 0x00eeff, 0xff8800];

export function showConfetti(parent: PIXI.Container) {
  // Use Sprite(Texture.WHITE)+tint instead of Graphics — all 60 pieces share
  // the same base texture so PixiJS batches them into a single draw call.
  type Piece = { s: PIXI.Sprite; vx: number; vy: number; vr: number; grav: number };
  const pieces: Piece[] = [];

  for (let i = 0; i < 60; i++) {
    const s = new PIXI.Sprite(PIXI.Texture.WHITE);
    s.tint = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.width  = 6 + Math.random() * 7;
    s.height = 10 + Math.random() * 7;
    s.anchor.set(0.5, 0.5);
    s.x = Math.random() * GAME_WIDTH;
    s.y = -20 - Math.random() * GAME_HEIGHT * 0.4;
    s.rotation = Math.random() * Math.PI * 2;
    parent.addChild(s);
    pieces.push({ s, vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 3, vr: (Math.random() - 0.5) * 0.18, grav: 0.04 + Math.random() * 0.04 });
  }

  let elapsed = 0;
  const tick = (dt: number) => {
    elapsed += dt;
    for (const p of pieces) {
      p.vy += p.grav * dt;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.s.rotation += p.vr * dt;
      if (elapsed > 150) p.s.alpha = Math.max(0, 1 - (elapsed - 150) / 90);
    }
    if (elapsed > 240) {
      PIXI.Ticker.shared.remove(tick);
      for (const p of pieces) { parent.removeChild(p.s); p.s.destroy(); }
    }
  };
  PIXI.Ticker.shared.add(tick);
}
