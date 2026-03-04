import * as PIXI from "pixi.js";

export function create3DButton(
  label: string,
  w: number,
  h: number,
  faceColor = 0xff7b00,
  shadowColor = 0xb35900,
  highlightColor = 0xff9f40,
): PIXI.Container {
  const btn = new PIXI.Container();

  const shadow = new PIXI.Graphics();
  shadow.beginFill(shadowColor);
  shadow.drawRoundedRect(0, 6, w, h, 12);
  shadow.endFill();
  btn.addChild(shadow);

  const face = new PIXI.Graphics();
  face.beginFill(faceColor);
  face.drawRoundedRect(0, 0, w, h, 12);
  face.endFill();
  btn.addChild(face);

  const highlight = new PIXI.Graphics();
  highlight.beginFill(highlightColor, 0.5);
  highlight.drawRoundedRect(3, 2, w - 6, h * 0.45, 10);
  highlight.endFill();
  btn.addChild(highlight);

  const text = new PIXI.Text(label, {
    fontSize: Math.round(h * 0.42),
    fontWeight: "bold",
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    stroke: 0x000000,
    strokeThickness: 3,
    dropShadow: true,
    dropShadowColor: shadowColor,
    dropShadowDistance: 1,
    dropShadowBlur: 0,
  });
  text.anchor.set(0.5, 0.5);
  text.x = w / 2;
  text.y = h / 2;
  btn.addChild(text);

  btn.pivot.set(w / 2, h / 2);
  btn.eventMode = "static";
  btn.cursor = "pointer";
  return btn;
}
