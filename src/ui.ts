import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES } from "./constants";
import type { Game } from "./game";
import { create3DButton } from "./ui/button";
import { buildEndScreen } from "./ui/endScreen";

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
    this.createOverlays();
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

    this.footerSprite = new PIXI.Sprite(footerTex);
    this.footerSprite.anchor.set(0.5, 1);
    this.footerSprite.width = GAME_WIDTH;
    this.footerSprite.height = GAME_WIDTH / footerAspect;
    this.footerH = this.footerSprite.height;
    this.footerSprite.x = GAME_WIDTH / 2;
    this.footerSprite.y = GAME_HEIGHT;
    this.footerContainer.addChild(this.footerSprite);

    this.downloadBtn = create3DButton("Download", 110, 36);
    this.downloadBtn.x = GAME_WIDTH - 70;
    this.downloadBtn.y = GAME_HEIGHT - this.footerH / 2;
    this.downloadBtn.on("pointerdown", () => console.log("Download clicked"));
    this.footerContainer.addChild(this.downloadBtn);

    // Pulse from the very start (independent of game state)
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
  private createOverlays() {
    // ── Intro ──
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
      if (cursorPulseScale >= 0.7) { cursorPulseScale = 0.7; cursorDir = -1; }
      if (cursorPulseScale <= 0.5) { cursorPulseScale = 0.5; cursorDir = 1; }
      this.cursorSprite.scale.set(cursorPulseScale);
    };
    PIXI.Ticker.shared.add(this.cursorTicker);

    this.parent.addChild(this.introContainer);

    // ── Fail ──
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
    this.failSprite.scale.set(0); // starts at 0, animated in showFail()
    this.failContainer.addChild(this.failSprite);

    this.parent.addChild(this.failContainer);

    // ── End screen (contents built dynamically in showEnd) ──
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
    const { HUD_ML, HUD_MR, HUD_MT, INNER_PAD, headerW, headerH, heartH } = this;
    const centerY = HUD_MT + Math.max(heartH, headerH) / 2;

    this.heartsContainer.x = HUD_ML;
    this.heartsContainer.y = centerY - heartH / 2;
    this.headerSprite.x = GAME_WIDTH - HUD_MR - headerW;
    this.headerSprite.y = centerY - headerH / 2;
    this.scoreText.x = GAME_WIDTH - HUD_MR - INNER_PAD;
    this.scoreText.y = centerY;

    const aspect = this.footerSprite.texture.width / this.footerSprite.texture.height;
    this.footerSprite.width = GAME_WIDTH;
    this.footerSprite.height = GAME_WIDTH / aspect;
    this.footerH = this.footerSprite.height;
    this.footerSprite.x = GAME_WIDTH / 2;
    this.footerSprite.y = GAME_HEIGHT;
    this.downloadBtn.x = GAME_WIDTH - 70;
    this.downloadBtn.y = GAME_HEIGHT - this.footerH / 2;
    this.downloadBtnBaseScale = Math.min(0.75, Math.max(0.45, (GAME_HEIGHT / 800) * 0.75));

    this.introBg.clear();
    this.introBg.beginFill(0x000000, 0.3);
    this.introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.introBg.endFill();

    this.failBg.clear();
    this.failBg.beginFill(0x000000, 0.5);
    this.failBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.failBg.endFill();

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

    if (this.endColumn) this.endColumn.x = GAME_WIDTH / 2;
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

  /** fail.png animates from scale 0 → target (pop-in effect) */
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

  showFinish() {
    const s = new PIXI.Sprite(PIXI.Assets.get("finish") as PIXI.Texture);
    s.anchor.set(0.5, 0.5);
    s.x = GAME_WIDTH / 2;
    s.y = GAME_HEIGHT / 2 - 50;
    s.scale.set(0.6);
    this.parent.addChild(s);
  }

  showEnd(score: number, won: boolean) {
    this.failContainer.visible = false;
    this.endContainer.visible = true;
    this.endColumn = buildEndScreen(
      this.endContainer,
      this.endBgSprite,
      score,
      won,
      this.parent,
    );
  }

  showTutorialOverlay() {
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
    this.tutorialCursorTicker = (dt: number) => {
      pulseScale += 0.005 * dt * pulseDir;
      if (pulseScale >= 0.6) { pulseScale = 0.6; pulseDir = -1; }
      if (pulseScale <= 0.4) { pulseScale = 0.4; pulseDir = 1; }
      cursor.scale.set(pulseScale);
    };
    PIXI.Ticker.shared.add(this.tutorialCursorTicker);

    this.parent.addChild(overlay);
    this.tutorialOverlay = overlay;
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

  update(_dt: number) {
    // intentionally empty — download pulse runs in Ticker from createFooter()
  }
}
