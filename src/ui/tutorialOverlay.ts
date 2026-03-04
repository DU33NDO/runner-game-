import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";

export function buildTutorialOverlay(parent: PIXI.Container): {
  overlay: PIXI.Container;
  ticker: (dt: number) => void;
} {
  const overlay = new PIXI.Container();

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.55);
  bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.endFill();
  overlay.addChild(bg);

  const text = new PIXI.Text("Jump to avoid\nenemies", {
    fontSize: 30,
    fontWeight: "bold",
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    align: "center",
    stroke: 0x000000,
    strokeThickness: 4,
  });
  text.anchor.set(0.5, 0.5);
  text.x = GAME_WIDTH / 2;
  text.y = GAME_HEIGHT / 2 - 40;
  overlay.addChild(text);

  const cursor = new PIXI.Sprite(PIXI.Assets.get("cursor") as PIXI.Texture);
  cursor.anchor.set(0.5, 0.5);
  cursor.x = GAME_WIDTH / 2;
  cursor.y = text.y + 90;
  cursor.scale.set(0.45);
  overlay.addChild(cursor);

  let pulseScale = 0.4;
  let pulseDir = 1;
  const ticker = (dt: number) => {
    pulseScale += 0.005 * dt * pulseDir;
    if (pulseScale >= 0.6) { pulseScale = 0.6; pulseDir = -1; }
    if (pulseScale <= 0.4) { pulseScale = 0.4; pulseDir = 1; }
    cursor.scale.set(pulseScale);
  };
  PIXI.Ticker.shared.add(ticker);

  parent.addChild(overlay);
  return { overlay, ticker };
}
