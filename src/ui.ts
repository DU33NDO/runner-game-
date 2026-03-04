import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES } from "./constants";
import type { Game } from "./game";

function create3DButton(label: string, w: number, h: number): PIXI.Container {
  const btn = new PIXI.Container();

  const shadow = new PIXI.Graphics();
  shadow.beginFill(0xb35900);
  shadow.drawRoundedRect(0, 6, w, h, 12);
  shadow.endFill();
  btn.addChild(shadow);

  const face = new PIXI.Graphics();
  face.beginFill(0xff7b00);
  face.drawRoundedRect(0, 0, w, h, 12);
  face.endFill();
  btn.addChild(face);

  const highlight = new PIXI.Graphics();
  highlight.beginFill(0xff9f40, 0.5);
  highlight.drawRoundedRect(3, 2, w - 6, h * 0.45, 10);
  highlight.endFill();
  btn.addChild(highlight);

  const text = new PIXI.Text(label, {
    fontSize: Math.round(h * 0.42),
    fontWeight: "bold",
    fill: 0xffffff,
    fontFamily: "Arial",
    dropShadow: true,
    dropShadowColor: 0x7a3d00,
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
  downloadBtnScale = 0.8; // start small
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
  private iconSprite!: PIXI.Sprite;
  private cursorTicker: ((dt: number) => void) | null = null;

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
      fontFamily: "Arial",
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
    // Store the natural aspect ratio so height scales with width
    const footerAspect = footerTex.width / footerTex.height;

    this.footerSprite = new PIXI.Sprite(footerTex);
    this.footerSprite.anchor.set(0.5, 1); // anchored bottom-center
    this.footerSprite.width  = GAME_WIDTH;
    this.footerSprite.height = GAME_WIDTH / footerAspect; // proportional height
    this.footerH = this.footerSprite.height;
    this.footerSprite.x = GAME_WIDTH / 2;
    this.footerSprite.y = GAME_HEIGHT;
    this.footerContainer.addChild(this.footerSprite);

    // Download button — moderately sized, scales down for landscape
    this.downloadBtn = create3DButton("Download", 110, 36);
    this.downloadBtn.x = GAME_WIDTH - 70;
    this.downloadBtn.y = GAME_HEIGHT - this.footerH / 2;
    this.downloadBtn.on("pointerdown", () => console.log("Download clicked"));
    this.footerContainer.addChild(this.downloadBtn);

    this.parent.addChild(this.footerContainer);
  }

  // ── Overlays ────────────────────────────────────────────────────────────────
  private createOverlays() {
    // Intro
    this.introContainer = new PIXI.Container();
    this.introContainer.visible = false;

    this.introBg = new PIXI.Graphics();
    this.introBg.beginFill(0x000000, 0.3);
    this.introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.introBg.endFill();
    this.introContainer.addChild(this.introBg);

    this.cursorSprite = new PIXI.Sprite(
      PIXI.Assets.get("cursor") as PIXI.Texture,
    );
    this.cursorSprite.anchor.set(0.5, 0.5);
    this.cursorSprite.x = GAME_WIDTH / 2;
    this.cursorSprite.y = GAME_HEIGHT / 2 - 50;
    this.cursorSprite.scale.set(0.3); // start small — pulse will grow it
    this.introContainer.addChild(this.cursorSprite);

    this.tapText = new PIXI.Text("Tap to start earning!", {
      fontSize: 28,
      fontWeight: "bold",
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      fontFamily: "Arial",
    });
    this.tapText.anchor.set(0.5, 0.5);
    this.tapText.x = GAME_WIDTH / 2;
    this.tapText.y = GAME_HEIGHT / 2 + 30;
    this.introContainer.addChild(this.tapText);

    // Cursor pulse animation (small → big → small)
    let cursorPulseScale = 0.5;
    let cursorDir = 1;
    this.cursorTicker = (dt: number) => {
      cursorPulseScale += 0.015 * dt * cursorDir;
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

    // Fail
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
    this.failSprite.scale.set(0.5);
    this.failContainer.addChild(this.failSprite);

    this.parent.addChild(this.failContainer);

    // End screen
    this.endContainer = new PIXI.Container();
    this.endContainer.visible = false;

    this.endBgSprite = new PIXI.Sprite(
      PIXI.Assets.get("endBackground") as PIXI.Texture,
    );
    this.endBgSprite.width = GAME_WIDTH;
    this.endBgSprite.height = GAME_HEIGHT;
    this.endContainer.addChild(this.endBgSprite);

    this.iconSprite = new PIXI.Sprite(
      PIXI.Assets.get("aftergameIcon") as PIXI.Texture,
    );
    this.iconSprite.anchor.set(0.5, 0.5);
    this.iconSprite.x = GAME_WIDTH / 2;
    this.iconSprite.y = GAME_HEIGHT / 2 - 100;
    this.iconSprite.scale.set(0.4);
    this.endContainer.addChild(this.iconSprite);

    this.parent.addChild(this.endContainer);
  }

  // ── Resize ──────────────────────────────────────────────────────────────────
  resize() {
    const { HUD_ML, HUD_MR, HUD_MT, INNER_PAD, headerW, headerH, heartH } =
      this;
    const centerY = HUD_MT + Math.max(heartH, headerH) / 2;

    this.heartsContainer.x = HUD_ML;
    this.heartsContainer.y = centerY - heartH / 2;
    this.headerSprite.x = GAME_WIDTH - HUD_MR - headerW;
    this.headerSprite.y = centerY - headerH / 2;
    this.scoreText.x = GAME_WIDTH - HUD_MR - INNER_PAD;
    this.scoreText.y = centerY;

    // Footer: scale width to GAME_WIDTH, height proportional (keeps aspect ratio)
    const aspect = this.footerSprite.texture.width / this.footerSprite.texture.height;
    this.footerSprite.width  = GAME_WIDTH;
    this.footerSprite.height = GAME_WIDTH / aspect;
    this.footerH             = this.footerSprite.height;
    this.footerSprite.x      = GAME_WIDTH / 2;
    this.footerSprite.y      = GAME_HEIGHT;
    this.downloadBtn.x       = GAME_WIDTH - 70;
    this.downloadBtn.y       = GAME_HEIGHT - this.footerH / 2;

    // Scale download button: smaller in landscape / small screens
    this.downloadBtnBaseScale = Math.min(
      0.75,
      Math.max(0.45, (GAME_HEIGHT / 800) * 0.75),
    );

    // Overlay backgrounds
    this.introBg.clear();
    this.introBg.beginFill(0x000000, 0.3);
    this.introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.introBg.endFill();

    this.failBg.clear();
    this.failBg.beginFill(0x000000, 0.5);
    this.failBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.failBg.endFill();

    this.cursorSprite.x = GAME_WIDTH / 2;
    this.cursorSprite.y = GAME_HEIGHT / 2 - 50;
    this.tapText.x = GAME_WIDTH / 2;
    this.tapText.y = GAME_HEIGHT / 2 + 30;
    this.failSprite.x = GAME_WIDTH / 2;
    this.failSprite.y = GAME_HEIGHT / 2 - 50;

    this.endBgSprite.width = GAME_WIDTH;
    this.endBgSprite.height = GAME_HEIGHT;
    this.iconSprite.x = GAME_WIDTH / 2;
    this.iconSprite.y = GAME_HEIGHT / 2 - 100;
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
      const ease = 1 - Math.pow(1 - t, 2); // ease-out

      sprite.x = startX + dx * ease;
      sprite.y = startY + dy * ease;
      sprite.rotation += 0.2 * dt; // spin

      // Fade + shrink in the last 25%
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
    // Stop cursor pulse when game starts
    if (this.cursorTicker) {
      PIXI.Ticker.shared.remove(this.cursorTicker);
      this.cursorTicker = null;
    }
  }
  showFail() {
    this.failContainer.visible = true;
  }

  showFinish() {
    const s = new PIXI.Sprite(PIXI.Assets.get("finish") as PIXI.Texture);
    s.anchor.set(0.5, 0.5);
    s.x = GAME_WIDTH / 2;
    s.y = GAME_HEIGHT / 2 - 50;
    s.scale.set(0.6);
    this.parent.addChild(s);
  }

  showEnd(score: number) {
    this.failContainer.visible = false;
    this.endContainer.visible = true;

    const scoreText = new PIXI.Text(`You earned: $${score}`, {
      fontSize: 28,
      fontWeight: "bold",
      fill: 0x003087,
      fontFamily: "Arial",
    });
    scoreText.anchor.set(0.5, 0.5);
    scoreText.x = GAME_WIDTH / 2;
    scoreText.y = GAME_HEIGHT / 2;
    this.endContainer.addChild(scoreText);

    const bigBtn = create3DButton("Download Now!", 240, 56);
    bigBtn.x = GAME_WIDTH / 2;
    bigBtn.y = GAME_HEIGHT / 2 + 70;
    bigBtn.on("pointerdown", () => console.log("Download clicked"));
    this.endContainer.addChild(bigBtn);
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

  update(dt: number) {
    // Download button: pulse small → big → small
    if (this.downloadBtnGrowing) {
      this.downloadBtnScale += 0.012 * dt;
      if (this.downloadBtnScale >= 1.0) {
        this.downloadBtnScale = 1.0;
        this.downloadBtnGrowing = false;
      }
    } else {
      this.downloadBtnScale -= 0.012 * dt;
      if (this.downloadBtnScale <= 0.8) {
        this.downloadBtnScale = 0.8;
        this.downloadBtnGrowing = true;
      }
    }
    this.downloadBtn.scale.set(
      this.downloadBtnScale * this.downloadBtnBaseScale,
    );
  }
}
