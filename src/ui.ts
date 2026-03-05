import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES, STORE_URL } from "./constants";
import type { Game } from "./game";
import { create3DButton } from "./ui/button";
import { buildEndScreen, showInstallPopup } from "./ui/endScreen";
import { showConfetti as showConfettiEffect } from "./ui/confetti";
import { buildTutorialOverlay } from "./ui/tutorialOverlay";

export class UIManager {
  parent: PIXI.Container;
  game: Game;

  // HUD
  heartsContainer!: PIXI.Container;
  heartSprites: PIXI.Sprite[] = [];
  scoreContainer!: PIXI.Container;
  scoreText!: PIXI.Text;

  // Footer
  footerContainer!: PIXI.Container;
  downloadBtn!: PIXI.Container;
  downloadBtnScale = 0.8;
  downloadBtnGrowing = true;
  downloadBtnBaseScale = 1;

  // Overlays
  introContainer!: PIXI.Container;
  failContainer!: PIXI.Container;
  endContainer!: PIXI.Container;

  // Refs for resize
  private headerSprite!: PIXI.Sprite;
  private footerSprite!: PIXI.Sprite;
  private footerBg!: PIXI.Graphics;
  private footerH = 0;
  private introBg!: PIXI.Graphics;
  private failBg!: PIXI.Graphics;
  private cursorSprite!: PIXI.Sprite;
  private tapText!: PIXI.Text;
  private failSprite!: PIXI.Sprite;
  private endBgSprite!: PIXI.Sprite;
  private endColumn: PIXI.Container | null = null;
  private cursorTicker: ((dt: number) => void) | null = null;
  private tutorialOverlay: PIXI.Container | null = null;
  private tutorialCursorTicker: ((dt: number) => void) | null = null;

  // HUD metrics
  private readonly HUD_ML = 8;
  private readonly HUD_MR = 8;
  private readonly HUD_MT = 12;
  private readonly BADGE_SCALE = 0.15;
  private readonly INNER_PAD = 8;
  private headerW = 0;
  private headerH = 0;
  private heartH = 0;

  constructor(parent: PIXI.Container, game: Game) {
    this.parent = parent;
    this.game = game;
    this.createHUD();
    this.createFooter();
    this.createIntro();
    this.createFail();
    this.createEnd();
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────

  private createHUD() {
    const { HUD_ML, HUD_MR, HUD_MT, BADGE_SCALE, INNER_PAD } = this;
    const HEART_SCALE = 0.1;

    const heartTex = PIXI.Assets.get("heart") as PIXI.Texture;
    const headerTex = PIXI.Assets.get("paypalHeader") as PIXI.Texture;

    const heartH = heartTex.height * HEART_SCALE;
    const headerW = headerTex.width * BADGE_SCALE;
    const headerH = headerTex.height * BADGE_SCALE;
    this.heartH = heartH;
    this.headerW = headerW;
    this.headerH = headerH;

    const centerY = HUD_MT + Math.max(heartH, headerH) / 2;

    this.heartsContainer = new PIXI.Container();
    this.heartsContainer.x = HUD_ML;
    this.heartsContainer.y = centerY - heartH / 2;
    for (let i = 0; i < MAX_LIVES; i++) {
      const heart = new PIXI.Sprite(heartTex);
      heart.scale.set(HEART_SCALE);
      heart.x = i * 38;
      this.heartSprites.push(heart);
      this.heartsContainer.addChild(heart);
    }
    this.parent.addChild(this.heartsContainer);

    this.scoreContainer = new PIXI.Container();

    this.headerSprite = new PIXI.Sprite(headerTex);
    this.headerSprite.scale.set(BADGE_SCALE);
    this.headerSprite.x = GAME_WIDTH - HUD_MR - headerW;
    this.headerSprite.y = centerY - headerH / 2;
    this.scoreContainer.addChild(this.headerSprite);

    this.scoreText = new PIXI.Text("$0", {
      fontSize: 26,
      fontWeight: "900",
      fill: 0x003087,
      fontFamily: "GameFont, sans-serif",
      dropShadow: true,
      dropShadowDistance: 1,
      dropShadowBlur: 0,
    });
    this.scoreText.anchor.set(1, 0.5);
    this.scoreText.x = GAME_WIDTH - HUD_MR - INNER_PAD;
    this.scoreText.y = centerY;
    this.scoreContainer.addChild(this.scoreText);

    this.parent.addChild(this.scoreContainer);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────

  private createFooter() {
    this.footerContainer = new PIXI.Container();

    const footerTex = PIXI.Assets.get("footer") as PIXI.Texture;
    const footerAspect = footerTex.width / footerTex.height;

    this.footerBg = new PIXI.Graphics();
    this.footerContainer.addChild(this.footerBg);

    this.footerSprite = new PIXI.Sprite(footerTex);
    this.footerSprite.anchor.set(0.5, 1);
    this.footerSprite.width = GAME_WIDTH;
    this.footerSprite.height = GAME_WIDTH / footerAspect;
    this.footerH = this.footerSprite.height;
    this.footerSprite.x = GAME_WIDTH / 2;
    this.footerSprite.y = GAME_HEIGHT;
    this.footerContainer.addChild(this.footerSprite);

    this.downloadBtn = create3DButton("Download", 140, 46);
    this.downloadBtn.x = GAME_WIDTH - 55;
    this.downloadBtn.y = GAME_HEIGHT - this.footerH / 2 + 5;
    this.downloadBtn.on("pointerdown", () =>
      window.open(STORE_URL, "_blank"),
    );
    this.footerContainer.addChild(this.downloadBtn);
    this.downloadBtnBaseScale = 0.82;

    PIXI.Ticker.shared.add((dt: number) => {
      if (this.downloadBtnGrowing) {
        this.downloadBtnScale += 0.005 * dt;
        if (this.downloadBtnScale >= 1.0) {
          this.downloadBtnScale = 1.0;
          this.downloadBtnGrowing = false;
        }
      } else {
        this.downloadBtnScale -= 0.005 * dt;
        if (this.downloadBtnScale <= 0.8) {
          this.downloadBtnScale = 0.8;
          this.downloadBtnGrowing = true;
        }
      }
      this.downloadBtn.scale.set(
        this.downloadBtnScale * this.downloadBtnBaseScale,
      );
    });

    this.parent.addChild(this.footerContainer);
  }

  // ── Overlays ────────────────────────────────────────────────────────────────

  private createIntro() {
    this.introContainer = new PIXI.Container();
    this.introContainer.visible = false;

    this.introBg = new PIXI.Graphics();
    this.introBg.beginFill(0x000000, 0.3);
    this.introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.introBg.endFill();
    this.introContainer.addChild(this.introBg);

    this.tapText = new PIXI.Text("Tap to start\nearning!", {
      fontSize: 20,
      fontWeight: "bold",
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
      fontFamily: "GameFont, sans-serif",
      align: "center",
    });
    this.tapText.anchor.set(0.5, 0.5);
    this.tapText.x = GAME_WIDTH / 2;
    this.tapText.y = GAME_HEIGHT / 2 - 10;
    this.introContainer.addChild(this.tapText);

    this.cursorSprite = new PIXI.Sprite(
      PIXI.Assets.get("cursor") as PIXI.Texture,
    );
    this.cursorSprite.anchor.set(0.5, 0.5);
    this.cursorSprite.x = GAME_WIDTH / 2;
    this.cursorSprite.y = this.tapText.y + 60;
    this.cursorSprite.scale.set(0.3);
    this.introContainer.addChild(this.cursorSprite);

    let cursorPulseScale = 0.5;
    let cursorDir = 1;
    this.cursorTicker = (dt: number) => {
      cursorPulseScale += 0.005 * dt * cursorDir;
      if (cursorPulseScale >= 0.7) {
        cursorPulseScale = 0.7;
        cursorDir = -1;
      }
      if (cursorPulseScale <= 0.5) {
        cursorPulseScale = 0.5;
        cursorDir = 1;
      }
      this.cursorSprite.scale.set(cursorPulseScale);
    };
    PIXI.Ticker.shared.add(this.cursorTicker);

    this.parent.addChild(this.introContainer);
  }

  private createFail() {
    this.failContainer = new PIXI.Container();
    this.failContainer.visible = false;

    this.failBg = new PIXI.Graphics();
    this.failBg.beginFill(0x000000, 0.5);
    this.failBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.failBg.endFill();
    this.failContainer.addChild(this.failBg);

    this.failSprite = new PIXI.Sprite(PIXI.Assets.get("fail") as PIXI.Texture);
    this.failSprite.anchor.set(0.5, 0.5);
    this.failSprite.x = GAME_WIDTH / 2;
    this.failSprite.y = GAME_HEIGHT / 2 - 50;
    this.failSprite.scale.set(0);
    this.failContainer.addChild(this.failSprite);

    this.parent.addChild(this.failContainer);
  }

  private createEnd() {
    this.endContainer = new PIXI.Container();
    this.endContainer.visible = false;

    this.endBgSprite = new PIXI.Sprite(
      PIXI.Assets.get("endBackground") as PIXI.Texture,
    );
    this.endBgSprite.anchor.set(0.5, 0.5);
    this.endBgSprite.x = GAME_WIDTH / 2;
    this.endBgSprite.y = GAME_HEIGHT / 2;
    this.endBgSprite.width = GAME_WIDTH * 1.5;
    this.endBgSprite.height = GAME_HEIGHT * 1.5;
    this.endContainer.addChild(this.endBgSprite);

    this.parent.addChild(this.endContainer);
  }

  // ── Resize ──────────────────────────────────────────────────────────────────

  resize() {
    const isLandscape = GAME_WIDTH > GAME_HEIGHT;
    this.resizeHUD();
    this.resizeFooter(isLandscape);
    this.resizeOverlays(isLandscape);
  }

  private resizeHUD() {
    const { HUD_ML, HUD_MR, HUD_MT, INNER_PAD, headerW, headerH, heartH } =
      this;
    const centerY = HUD_MT + Math.max(heartH, headerH) / 2;

    this.heartsContainer.x = HUD_ML;
    this.heartsContainer.y = centerY - heartH / 2;
    this.headerSprite.x = GAME_WIDTH - HUD_MR - headerW;
    this.headerSprite.y = centerY - headerH / 2;
    this.scoreText.x = GAME_WIDTH - HUD_MR - INNER_PAD;
    this.scoreText.y = centerY;
  }

  private resizeFooter(isLandscape: boolean) {
    const aspect =
      this.footerSprite.texture.width / this.footerSprite.texture.height;
    const footerH = isLandscape ? GAME_HEIGHT * 0.18 : GAME_WIDTH / aspect;
    const footerW = isLandscape ? footerH * aspect : GAME_WIDTH;

    this.footerSprite.width = footerW;
    this.footerSprite.height = footerH;
    this.footerH = footerH;
    this.footerSprite.y = GAME_HEIGHT;

    this.footerBg.clear();
    if (isLandscape) {
      this.footerSprite.anchor.set(0, 1);
      this.footerSprite.x = 0;
      const bgH = footerH * 0.75;
      this.footerBg.beginFill(0x975cfd);
      this.footerBg.drawRect(0, GAME_HEIGHT - bgH, GAME_WIDTH, bgH);
      this.footerBg.endFill();
    } else {
      this.footerSprite.anchor.set(0.5, 1);
      this.footerSprite.x = GAME_WIDTH / 2;
    }

    this.downloadBtn.x = GAME_WIDTH - 55;
    this.downloadBtn.y = GAME_HEIGHT - this.footerH / 2 + 5;

    const isTablet = GAME_WIDTH > 560;
    this.downloadBtnBaseScale = isTablet
      ? Math.min(1.3, Math.max(1.0, (GAME_HEIGHT / 800) * 1.2))
      : Math.min(0.9, Math.max(0.6, (GAME_HEIGHT / 800) * 0.85));
  }

  private resizeOverlays(isLandscape: boolean) {
    this.introBg.clear();
    this.introBg.beginFill(0x000000, 0.3);
    this.introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.introBg.endFill();

    this.failBg.clear();
    this.failBg.beginFill(0x000000, 0.5);
    this.failBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.failBg.endFill();

    this.tapText.text = isLandscape
      ? "Tap to start earning!"
      : "Tap to start\nearning!";
    this.tapText.style.fontSize = isLandscape ? 50 : 20;
    this.tapText.x = GAME_WIDTH / 2;
    this.tapText.y = GAME_HEIGHT / 2 - 10;
    this.cursorSprite.x = GAME_WIDTH / 2;
    this.cursorSprite.y = this.tapText.y + 60;

    this.failSprite.x = GAME_WIDTH / 2;
    this.failSprite.y = GAME_HEIGHT / 2 - 50;

    this.endBgSprite.x = GAME_WIDTH / 2;
    this.endBgSprite.y = GAME_HEIGHT / 2;
    this.endBgSprite.width = GAME_WIDTH * 1.5;
    this.endBgSprite.height = GAME_HEIGHT * 1.5;

    if (this.endColumn) {
      const unscaledW = this.endColumn.width  / this.endColumn.scale.x;
      const unscaledH = this.endColumn.height / this.endColumn.scale.x;
      const sc = Math.min(1.0,
        (GAME_WIDTH  * 0.90) / unscaledW,
        (GAME_HEIGHT * 0.88) / unscaledH,
      );
      this.endColumn.scale.set(sc);
      this.endColumn.x = GAME_WIDTH / 2;
      this.endColumn.y = Math.round((GAME_HEIGHT - this.endColumn.height) / 2);
    }
  }

  // ── Badge center (for fly animation target) ──────────────────────────────────

  getBadgeCenter(): { x: number; y: number } {
    const { HUD_MT, HUD_MR, headerW, headerH, heartH } = this;
    return {
      x: GAME_WIDTH - HUD_MR - headerW / 2,
      y: HUD_MT + Math.max(heartH, headerH) / 2,
    };
  }

  // ── Fly-to-score animation ───────────────────────────────────────────────────

  flyToScore(startX: number, startY: number, texKey: string) {
    const tex = PIXI.Assets.get(texKey) as PIXI.Texture;
    if (!tex) return;

    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(0.07);
    sprite.x = startX;
    sprite.y = startY;
    this.parent.addChild(sprite);

    const target = this.getBadgeCenter();
    const dx = target.x - startX;
    const dy = target.y - startY;
    const duration = 0.55;
    let elapsed = 0;

    const tick = (dt: number) => {
      elapsed += dt / 60;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);

      sprite.x = startX + dx * ease;
      sprite.y = startY + dy * ease;
      sprite.rotation += 0.2 * dt;

      if (t > 0.75) {
        const fade = 1 - (t - 0.75) / 0.25;
        sprite.alpha = fade;
        sprite.scale.set(0.07 * fade);
      }

      if (t >= 1) {
        PIXI.Ticker.shared.remove(tick);
        this.parent.removeChild(sprite);
        sprite.destroy();
      }
    };
    PIXI.Ticker.shared.add(tick);
  }

  // ── Public methods ────────────────────────────────────────────────────────────

  showIntro() {
    this.introContainer.visible = true;
  }

  hideIntro() {
    this.introContainer.visible = false;
    if (this.cursorTicker) {
      PIXI.Ticker.shared.remove(this.cursorTicker);
      this.cursorTicker = null;
    }
  }

  showFail() {
    this.failContainer.visible = true;
    this.failSprite.scale.set(0);
    const targetScale = 0.5;
    const tick = (dt: number) => {
      const s = this.failSprite.scale.x + 0.05 * dt;
      if (s >= targetScale) {
        this.failSprite.scale.set(targetScale);
        PIXI.Ticker.shared.remove(tick);
      } else {
        this.failSprite.scale.set(s);
      }
    };
    PIXI.Ticker.shared.add(tick);
  }

  showComboText() {
    const WORDS = ["Great!", "Awesome!", "Fantastic!"];
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];

    const text = new PIXI.Text(word, {
      fontSize: 30,
      fontWeight: "bold",
      fontFamily: "GameFont, sans-serif",
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 6,
    });
    text.anchor.set(0.5, 0.5);
    text.x = GAME_WIDTH / 2;
    text.y = GAME_HEIGHT / 2 - 60;
    this.parent.addChild(text);

    let elapsed = 0;
    const tick = () => {
      elapsed++;
      text.y -= 0.5;
      if (elapsed > 40) text.alpha = 1 - (elapsed - 40) / 30;
      if (elapsed >= 70) {
        PIXI.Ticker.shared.remove(tick);
        this.parent.removeChild(text);
        text.destroy();
      }
    };
    PIXI.Ticker.shared.add(tick);
  }

  showConfetti() {
    showConfettiEffect(this.parent);
  }

  showEnd(score: number, won: boolean) {
    this.failContainer.visible = false;
    this.endContainer.visible = true;
    const isLandscape = GAME_WIDTH > GAME_HEIGHT;
    this.endColumn = buildEndScreen(
      this.endContainer,
      this.endBgSprite,
      score,
      won,
      this.parent,
      isLandscape ? 0.45 : 1,
    );
  }

  showTutorialOverlay() {
    const { overlay, ticker } = buildTutorialOverlay(this.parent);
    this.tutorialOverlay = overlay;
    this.tutorialCursorTicker = ticker;
  }

  hideTutorialOverlay() {
    if (this.tutorialCursorTicker) {
      PIXI.Ticker.shared.remove(this.tutorialCursorTicker);
      this.tutorialCursorTicker = null;
    }
    if (this.tutorialOverlay) {
      this.parent.removeChild(this.tutorialOverlay);
      this.tutorialOverlay.destroy({ children: true });
      this.tutorialOverlay = null;
    }
  }

  updateLives(lives: number) {
    for (let i = 0; i < MAX_LIVES; i++) {
      this.heartSprites[i].alpha = i < lives ? 1 : 0.2;
    }
  }

  updateScore(score: number) {
    this.scoreText.text = `$${score}`;
    const digits = score.toString().length;
    this.scoreText.style.fontSize = digits <= 2 ? 28 : digits <= 4 ? 20 : 14;
  }
}
