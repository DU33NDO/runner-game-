import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES } from './constants';
import type { Game } from './game';

/** Draw a 3D orange button with text */
function create3DButton(label: string, w: number, h: number): PIXI.Container {
  const btn = new PIXI.Container();

  // Bottom shadow (darker orange) — gives 3D depth
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0xb35900);
  shadow.drawRoundedRect(0, 6, w, h, 12);
  shadow.endFill();
  btn.addChild(shadow);

  // Main button face (orange)
  const face = new PIXI.Graphics();
  face.beginFill(0xff7b00);
  face.drawRoundedRect(0, 0, w, h, 12);
  face.endFill();
  btn.addChild(face);

  // Top highlight (lighter orange, half height)
  const highlight = new PIXI.Graphics();
  highlight.beginFill(0xff9f40, 0.5);
  highlight.drawRoundedRect(3, 2, w - 6, h * 0.45, 10);
  highlight.endFill();
  btn.addChild(highlight);

  // Label text
  const text = new PIXI.Text(label, {
    fontSize: Math.round(h * 0.42),
    fontWeight: 'bold',
    fill: 0xffffff,
    fontFamily: 'Arial',
    dropShadow: true,
    dropShadowColor: 0x7a3d00,
    dropShadowDistance: 1,
    dropShadowBlur: 0,
  });
  text.anchor.set(0.5, 0.5);
  text.x = w / 2;
  text.y = h / 2;
  btn.addChild(text);

  // Set pivot to center for scaling
  btn.pivot.set(w / 2, h / 2);

  btn.eventMode = 'static';
  btn.cursor = 'pointer';

  return btn;
}

export class UIManager {
  parent: PIXI.Container;
  game: Game;

  heartsContainer!: PIXI.Container;
  heartSprites: PIXI.Sprite[] = [];
  scoreContainer!: PIXI.Container;
  scoreText!: PIXI.Text;

  footerContainer!: PIXI.Container;
  downloadBtn!: PIXI.Container;
  downloadBtnBaseScale = 1;
  downloadBtnScale = 1;
  downloadBtnGrowing = true;

  introContainer!: PIXI.Container;
  failContainer!: PIXI.Container;
  endContainer!: PIXI.Container;

  constructor(parent: PIXI.Container, game: Game) {
    this.parent = parent;
    this.game = game;
    this.createHUD();
    this.createFooter();
    this.createOverlays();
  }

  private createHUD() {
    // Hearts - top left
    this.heartsContainer = new PIXI.Container();
    this.heartsContainer.x = 12;
    this.heartsContainer.y = 12;

    const heartTex = PIXI.Assets.get('heart') as PIXI.Texture;
    for (let i = 0; i < MAX_LIVES; i++) {
      const heart = new PIXI.Sprite(heartTex);
      heart.scale.set(0.08);
      heart.x = i * 38;
      this.heartSprites.push(heart);
      this.heartsContainer.addChild(heart);
    }
    this.parent.addChild(this.heartsContainer);

    // Score - top right with small PayPal header
    this.scoreContainer = new PIXI.Container();

    const headerTex = PIXI.Assets.get('paypalHeader') as PIXI.Texture;
    const headerSprite = new PIXI.Sprite(headerTex);
    headerSprite.anchor.set(1, 0);
    headerSprite.x = GAME_WIDTH - 8;
    headerSprite.y = 8;
    headerSprite.scale.set(0.15);
    this.scoreContainer.addChild(headerSprite);

    this.scoreText = new PIXI.Text('$0', {
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x003087,
      fontFamily: 'Arial',
    });
    this.scoreText.anchor.set(1, 0);
    this.scoreText.x = GAME_WIDTH - 12;
    this.scoreText.y = 8 + headerTex.height * 0.15 + 2;
    this.scoreContainer.addChild(this.scoreText);

    this.parent.addChild(this.scoreContainer);
  }

  private createFooter() {
    this.footerContainer = new PIXI.Container();

    // Footer background
    const footerTex = PIXI.Assets.get('footer') as PIXI.Texture;
    const footerSprite = new PIXI.Sprite(footerTex);
    footerSprite.width = GAME_WIDTH;
    footerSprite.height = 80;
    footerSprite.y = GAME_HEIGHT - 80;
    this.footerContainer.addChild(footerSprite);

    // 3D orange "Download" button on right side of footer
    this.downloadBtn = create3DButton('Download', 130, 44);
    this.downloadBtn.x = GAME_WIDTH - 80;
    this.downloadBtn.y = GAME_HEIGHT - 40;
    this.downloadBtn.on('pointerdown', () => console.log('Download clicked'));

    this.footerContainer.addChild(this.downloadBtn);
    this.parent.addChild(this.footerContainer);
  }

  private createOverlays() {
    // Intro overlay
    this.introContainer = new PIXI.Container();
    this.introContainer.visible = false;

    const introBg = new PIXI.Graphics();
    introBg.beginFill(0x000000, 0.3);
    introBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    introBg.endFill();
    this.introContainer.addChild(introBg);

    const cursorTex = PIXI.Assets.get('cursor') as PIXI.Texture;
    const cursorSprite = new PIXI.Sprite(cursorTex);
    cursorSprite.anchor.set(0.5, 0.5);
    cursorSprite.x = GAME_WIDTH / 2;
    cursorSprite.y = GAME_HEIGHT / 2 - 50;
    cursorSprite.scale.set(0.8);
    this.introContainer.addChild(cursorSprite);

    const tapText = new PIXI.Text('Tap to start earning!', {
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      fontFamily: 'Arial',
    });
    tapText.anchor.set(0.5, 0.5);
    tapText.x = GAME_WIDTH / 2;
    tapText.y = GAME_HEIGHT / 2 + 30;
    this.introContainer.addChild(tapText);

    this.parent.addChild(this.introContainer);

    // Fail overlay
    this.failContainer = new PIXI.Container();
    this.failContainer.visible = false;

    const failBg = new PIXI.Graphics();
    failBg.beginFill(0x000000, 0.5);
    failBg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    failBg.endFill();
    this.failContainer.addChild(failBg);

    const failTex = PIXI.Assets.get('fail') as PIXI.Texture;
    const failSprite = new PIXI.Sprite(failTex);
    failSprite.anchor.set(0.5, 0.5);
    failSprite.x = GAME_WIDTH / 2;
    failSprite.y = GAME_HEIGHT / 2 - 50;
    failSprite.scale.set(0.5);
    this.failContainer.addChild(failSprite);

    this.parent.addChild(this.failContainer);

    // End screen overlay
    this.endContainer = new PIXI.Container();
    this.endContainer.visible = false;

    const endBgTex = PIXI.Assets.get('endBackground') as PIXI.Texture;
    const endBgSprite = new PIXI.Sprite(endBgTex);
    endBgSprite.width = GAME_WIDTH;
    endBgSprite.height = GAME_HEIGHT;
    this.endContainer.addChild(endBgSprite);

    const iconTex = PIXI.Assets.get('aftergameIcon') as PIXI.Texture;
    const iconSprite = new PIXI.Sprite(iconTex);
    iconSprite.anchor.set(0.5, 0.5);
    iconSprite.x = GAME_WIDTH / 2;
    iconSprite.y = GAME_HEIGHT / 2 - 100;
    iconSprite.scale.set(0.4);
    this.endContainer.addChild(iconSprite);

    this.parent.addChild(this.endContainer);
  }

  showIntro() {
    this.introContainer.visible = true;
  }

  hideIntro() {
    this.introContainer.visible = false;
  }

  showFail() {
    this.failContainer.visible = true;
  }

  showFinish() {
    const finishTex = PIXI.Assets.get('finish') as PIXI.Texture;
    const finishSprite = new PIXI.Sprite(finishTex);
    finishSprite.anchor.set(0.5, 0.5);
    finishSprite.x = GAME_WIDTH / 2;
    finishSprite.y = GAME_HEIGHT / 2 - 50;
    finishSprite.scale.set(0.6);
    this.parent.addChild(finishSprite);
  }

  showEnd(score: number) {
    this.failContainer.visible = false;
    this.endContainer.visible = true;

    const scoreText = new PIXI.Text(`You earned: $${score}`, {
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0x003087,
      fontFamily: 'Arial',
    });
    scoreText.anchor.set(0.5, 0.5);
    scoreText.x = GAME_WIDTH / 2;
    scoreText.y = GAME_HEIGHT / 2;
    this.endContainer.addChild(scoreText);

    // Big 3D orange "Download Now!" button on end screen
    const bigBtn = create3DButton('Download Now!', 240, 56);
    bigBtn.x = GAME_WIDTH / 2;
    bigBtn.y = GAME_HEIGHT / 2 + 70;
    bigBtn.on('pointerdown', () => console.log('Download clicked'));
    this.endContainer.addChild(bigBtn);
  }

  updateLives(lives: number) {
    for (let i = 0; i < MAX_LIVES; i++) {
      this.heartSprites[i].alpha = i < lives ? 1 : 0.2;
    }
  }

  updateScore(score: number) {
    this.scoreText.text = `$${score}`;
  }

  update(dt: number) {
    // Pulsing download button: small -> big -> small
    if (this.downloadBtnGrowing) {
      this.downloadBtnScale += 0.008 * dt;
      if (this.downloadBtnScale >= 1.2) this.downloadBtnGrowing = false;
    } else {
      this.downloadBtnScale -= 0.008 * dt;
      if (this.downloadBtnScale <= 0.85) this.downloadBtnGrowing = true;
    }
    this.downloadBtn.scale.set(this.downloadBtnScale);
  }
}
