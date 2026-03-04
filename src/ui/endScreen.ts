import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { create3DButton } from "./button";

/**
 * Builds the end screen column inside `endContainer` and starts all animations.
 * Returns the column so the caller can re-center it on resize.
 */
export function buildEndScreen(
  endContainer: PIXI.Container,
  endBgSprite: PIXI.Sprite,
  score: number,
  won: boolean,
  parent: PIXI.Container,
  scale = 1,
): PIXI.Container {
  // Spin the background
  PIXI.Ticker.shared.add((dt: number) => {
    endBgSprite.rotation += 0.008 * dt;
  });

  const GAP = 20;
  let curY = 0;
  const column = new PIXI.Container();

  // ── 1. Win / lose message (two lines, different sizes) ──────────────────────
  const msgGroup = new PIXI.Container();

  const line1 = new PIXI.Text(won ? "Congratulations!" : "You didn't make it!", {
    fontSize: 26,
    fontWeight: "bold",
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    align: "center",
    stroke: 0x000000,
    strokeThickness: 3,
  });
  line1.anchor.set(0.5, 0);
  line1.x = 0;
  line1.y = 0;
  msgGroup.addChild(line1);

  const line2 = new PIXI.Text(won ? "Choose your reward" : "Try again on the app!", {
    fontSize: 16,
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    align: "center",
    stroke: 0x000000,
    strokeThickness: 2,
  });
  line2.anchor.set(0.5, 0);
  line2.x = 0;
  line2.y = line1.height + 4;
  msgGroup.addChild(line2);

  msgGroup.y = curY;
  column.addChild(msgGroup);
  curY += msgGroup.height + GAP;

  // ── 2. PayPal money image + score text overlay ───────────────────────────────
  const moneyGroup = new PIXI.Container();
  const moneyTex = PIXI.Assets.get("paypalMoney") as PIXI.Texture;
  const money = new PIXI.Sprite(moneyTex);
  money.anchor.set(0.5, 0);
  money.scale.set((GAME_WIDTH * 0.72) / moneyTex.width);
  money.x = 0;
  money.y = 0;
  moneyGroup.addChild(money);

  const moneyText = new PIXI.Text(`$${score}`, {
    fontSize: 40,
    fontWeight: "900",
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    stroke: 0x000000,
    strokeThickness: 4,
  });
  moneyText.anchor.set(0.5, 0.5);
  moneyText.x = 30; // ← adjust X within image
  moneyText.y = money.height / 1.5; // ← adjust Y within image
  moneyGroup.addChild(moneyText);

  moneyGroup.y = curY;
  column.addChild(moneyGroup);
  curY += moneyGroup.height + GAP;

  // ── 3. Countdown timer + label ───────────────────────────────────────────────
  const timerGroup = new PIXI.Container();

  const timerText = new PIXI.Text("01:00", {
    fontSize: 52,
    fontWeight: "900",
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
    stroke: 0x000000,
    strokeThickness: 4,
  });
  timerText.anchor.set(0.5, 0);
  timerText.x = 0;
  timerText.y = 0;
  timerGroup.addChild(timerText);

  const timerLabel = new PIXI.Text("Next payment in one minute", {
    fontSize: 15,
    fill: 0xffffff,
    fontFamily: "GameFont, sans-serif",
  });
  timerLabel.anchor.set(0.5, 0);
  timerLabel.x = 0;
  timerLabel.y = timerText.height + 4;
  timerGroup.addChild(timerLabel);

  timerGroup.y = curY;
  column.addChild(timerGroup);
  curY += timerGroup.height + GAP;

  // ── 4. Install button ────────────────────────────────────────────────────────
  const BTN_H = 56;
  const installBtn = create3DButton(
    "INSTALL AND EARN",
    270,
    BTN_H,
    0xdd1111,
    0x880000,
    0xff5555,
  );
  installBtn.x = 0;
  installBtn.y = curY + BTN_H / 2; // pivot is at centre → offset by half height
  column.addChild(installBtn);
  curY += BTN_H + 6; // +6 for the button shadow

  // Centre the column on screen, applying optional scale
  column.scale.set(scale);
  column.x = GAME_WIDTH / 2;
  column.y = Math.round((GAME_HEIGHT - curY * scale) / 2);
  endContainer.addChild(column);

  // ── Countdown ticker ─────────────────────────────────────────────────────────
  let timerElapsed = 0;
  const timerTick = (dt: number) => {
    timerElapsed += dt / 60;
    const remaining = Math.max(0, 60 - Math.floor(timerElapsed));
    timerText.text = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    if (timerElapsed >= 60) {
      PIXI.Ticker.shared.remove(timerTick);
      timerGroup.visible = false;
      // Slide button up to where the timer was
      const targetY = timerGroup.y + BTN_H / 2;
      const moveTick = (dt: number) => {
        installBtn.y += (targetY - installBtn.y) * 0.1 * dt;
        if (Math.abs(installBtn.y - targetY) < 0.5) {
          installBtn.y = targetY;
          PIXI.Ticker.shared.remove(moveTick);
        }
      };
      PIXI.Ticker.shared.add(moveTick);
    }
  };
  PIXI.Ticker.shared.add(timerTick);

  // ── Button pulse ─────────────────────────────────────────────────────────────
  let btnScale = 0.9;
  let btnDir = 1;
  const btnTick = (dt: number) => {
    btnScale += 0.005 * dt * btnDir;
    if (btnScale >= 1.05) { btnScale = 1.05; btnDir = -1; }
    else if (btnScale <= 0.9) { btnScale = 0.9; btnDir = 1; }
    installBtn.scale.set(btnScale);
  };
  PIXI.Ticker.shared.add(btnTick);

  installBtn.on("pointerdown", () => {
    PIXI.Ticker.shared.remove(btnTick);
    showInstallPopup(parent, won);
  });

  return column;
}

// ── Install popup ─────────────────────────────────────────────────────────────

export function showInstallPopup(parent: PIXI.Container, won = true): void {
  const isLandscape = GAME_WIDTH > GAME_HEIGHT;
  const popup = new PIXI.Container();

  // Dark overlay — full screen, never scaled
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0x000000, 0.75);
  overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  overlay.endFill();
  overlay.eventMode = "static";
  popup.addChild(overlay);

  // Card container — scaled down in landscape
  const cardContainer = new PIXI.Container();
  const cardScale = isLandscape ? 0.6 : 1;
  cardContainer.scale.set(cardScale);
  cardContainer.x = (GAME_WIDTH  - GAME_WIDTH  * cardScale) / 2;
  cardContainer.y = (GAME_HEIGHT - GAME_HEIGHT * cardScale) / 2;
  popup.addChild(cardContainer);

  // White card
  const cardW = GAME_WIDTH * 0.82;
  const cardH = GAME_HEIGHT * 0.52;
  const cardX = (GAME_WIDTH - cardW) / 2;
  const cardY = (GAME_HEIGHT - cardH) / 2;
  const card = new PIXI.Graphics();
  card.beginFill(0xffffff);
  card.drawRoundedRect(cardX, cardY, cardW, cardH, 20);
  card.endFill();
  cardContainer.addChild(card);

  // Win / lose message at top of card
  const message = won
    ? "Congratulations!\nChoose your reward"
    : "You didn't make it!\nTry again on the app!";
  const msgText = new PIXI.Text(message, {
    fontSize: 19,
    fontWeight: "bold",
    fill: won ? 0x1a7f1a : 0xcc2222,
    fontFamily: "GameFont, sans-serif",
    align: "center",
    wordWrap: true,
    wordWrapWidth: cardW - 40,
  });
  msgText.anchor.set(0.5, 0);
  msgText.x = GAME_WIDTH / 2;
  msgText.y = cardY + 18;
  cardContainer.addChild(msgText);

  // App icon
  const iconTex = PIXI.Assets.get("aftergameIcon") as PIXI.Texture;
  const icon = new PIXI.Sprite(iconTex);
  icon.anchor.set(0.5, 0);
  icon.scale.set((cardW * 0.28) / iconTex.width);
  icon.x = GAME_WIDTH / 2;
  icon.y = msgText.y + msgText.height + 14;
  cardContainer.addChild(icon);

  // App title
  const appTitle = new PIXI.Text("Playoff: Play & Earn Rewards", {
    fontSize: 17,
    fontWeight: "bold",
    fill: 0x222222,
    fontFamily: "GameFont, sans-serif",
    align: "center",
    wordWrap: true,
    wordWrapWidth: cardW - 40,
  });
  appTitle.anchor.set(0.5, 0);
  appTitle.x = GAME_WIDTH / 2;
  appTitle.y = icon.y + icon.height + 12;
  cardContainer.addChild(appTitle);

  // Close ✕ button
  const closeBtn = new PIXI.Text("✕", {
    fontSize: 26,
    fill: 0x888888,
    fontFamily: "GameFont, sans-serif",
  });
  closeBtn.anchor.set(0.5, 0.5);
  closeBtn.x = cardX + cardW - 22;
  closeBtn.y = cardY + 22;
  closeBtn.eventMode = "static";
  closeBtn.cursor = "pointer";
  closeBtn.on("pointerdown", () => {
    parent.removeChild(popup);
    popup.destroy({ children: true });
  });
  cardContainer.addChild(closeBtn);

  parent.addChild(popup);
}
