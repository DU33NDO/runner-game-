import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";

const COLORS = [0xff3333, 0x33cc33, 0x3399ff, 0xffdd00, 0xff66cc, 0x00eeff, 0xff8800];

export function showConfetti(parent: PIXI.Container) {
  type Piece = { g: PIXI.Graphics; vx: number; vy: number; vr: number; grav: number };
  const pieces: Piece[] = [];

  for (let i = 0; i < 70; i++) {
    const g = new PIXI.Graphics();
    const w = 6 + Math.random() * 7;
    const h = 10 + Math.random() * 7;
    g.beginFill(COLORS[Math.floor(Math.random() * COLORS.length)]);
    g.drawRect(-w / 2, -h / 2, w, h);
    g.endFill();
    g.x = Math.random() * GAME_WIDTH;
    g.y = -20 - Math.random() * GAME_HEIGHT * 0.4;
    g.rotation = Math.random() * Math.PI * 2;
    parent.addChild(g);
    pieces.push({ g, vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 3, vr: (Math.random() - 0.5) * 0.18, grav: 0.04 + Math.random() * 0.04 });
  }

  let elapsed = 0;
  const tick = (dt: number) => {
    elapsed += dt;
    for (const p of pieces) {
      p.vy += p.grav * dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.rotation += p.vr * dt;
      if (elapsed > 150) p.g.alpha = Math.max(0, 1 - (elapsed - 150) / 90);
    }
    if (elapsed > 240) {
      PIXI.Ticker.shared.remove(tick);
      for (const p of pieces) { parent.removeChild(p.g); p.g.destroy(); }
    }
  };
  PIXI.Ticker.shared.add(tick);
}
