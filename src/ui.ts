import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants';
import type { Game } from './game';

export class UIManager {
  parent: PIXI.Container;
  game: Game;

  // HUD elements
  heartsText!: PIXI.Text;
  scoreContainer!: PIXI.Container;
  scoreText!: PIXI.Text;

  // Footer
  footerContainer!: PIXI.Container;
  downloadBtn!: PIXI.Container;
  downloadBtnScale = 1;
  downloadBtnGrowing = true;

  // Overlays
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
    this.heartsText = new PIXI.Text('❤️ ❤️ ❤️', {
      fontSize: 28,
      fill: 0xff0000,
    });
    this.heartsText.x = 15;
    this.heartsText.y = 15;
    this.parent.addChild(this.heartsText);

    // Score - top right with PayPal header background
    this.scoreContainer = new PIXI.Container();
    const headerTex = PIXI.Assets.get('paypalHeader') as PIXI.Texture;
    const headerSprite = new PIXI.Sprite(headerTex);
    headerSprite.anchor.set(1, 0);
    headerSprite.x = GAME_WIDTH - 10;
    headerSprite.y = 5;
    headerSprite.scale.set(0.35);
    this.scoreContainer.addChild(headerSprite);

    this.scoreText = new PIXI.Text('$0', {
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0x003087,
      fontFamily: 'Arial',
    });
    this.scoreText.anchor.set(1, 0);
    this.scoreText.x = GAME_WIDTH - 20;
    this.scoreText.y = 55;
    this.scoreContainer.addChild(this.scoreText);
    this.parent.addChild(this.scoreContainer);
  }

  private createFooter() {
    this.footerContainer = new PIXI.Container();

    const footerTex = PIXI.Assets.get('footer') as PIXI.Texture;
    const footerSprite = new PIXI.Sprite(footerTex);
    footerSprite.width = GAME_WIDTH;
    footerSprite.height = 90;
    footerSprite.y = GAME_HEIGHT - 90;
    this.footerContainer.addChild(footerSprite);

    // Download button on right side of footer
    this.downloadBtn = new PIXI.Container();

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x00b300);
    btnBg.drawRoundedRect(0, 0, 130, 45, 12);
    btnBg.endFill();
    this.downloadBtn.addChild(btnBg);

    const btnText = new PIXI.Text('Download', {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff,
      fontFamily: 'Arial',
    });
    btnText.anchor.set(0.5, 0.5);
    btnText.x = 65;
    btnText.y = 22;
    this.downloadBtn.addChild(btnText);

    this.downloadBtn.x = GAME_WIDTH - 150;
    this.downloadBtn.y = GAME_HEIGHT - 68;
    this.downloadBtn.pivot.set(65, 22);
    this.downloadBtn.x = GAME_WIDTH - 85;
    this.downloadBtn.y = GAME_HEIGHT - 45;

    this.downloadBtn.eventMode = 'static';
    this.downloadBtn.cursor = 'pointer';
    this.downloadBtn.on('pointerdown', () => {
      // Placeholder download action
      console.log('Download clicked');
    });

    this.footerContainer.addChild(this.downloadBtn);
    this.parent.addChild(this.footerContainer);
  }

  private createOverlays() {
    // Intro overlay
    this.introContainer = new PIXI.Container();
    this.introContainer.visible = false;

    const cursorTex = PIXI.Assets.get('cursor') as PIXI.Texture;
    const cursorSprite = new PIXI.Sprite(cursorTex);
    cursorSprite.anchor.set(0.5, 0.5);
    cursorSprite.x = GAME_WIDTH / 2;
    cursorSprite.y = GAME_HEIGHT / 2 - 50;
    cursorSprite.scale.set(0.15);
    this.introContainer.addChild(cursorSprite);

    const tapText = new PIXI.Text('Tap to Start!', {
      fontSize: 32,
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
    failSprite.scale.set(0.6);
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
    iconSprite.scale.set(0.5);
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
    // Could show finish line animation
    const finishTex = PIXI.Assets.get('finishLine') as PIXI.Texture;
    const finishSprite = new PIXI.Sprite(finishTex);
    finishSprite.anchor.set(0.5, 0.5);
    finishSprite.x = GAME_WIDTH / 2;
    finishSprite.y = GAME_HEIGHT / 2;
    finishSprite.scale.set(0.8);
    this.parent.addChild(finishSprite);
  }

  showEnd(score: number) {
    this.failContainer.visible = false;
    this.endContainer.visible = true;

    const endScoreText = new PIXI.Text(`You earned: $${score}`, {
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0x003087,
      fontFamily: 'Arial',
    });
    endScoreText.anchor.set(0.5, 0.5);
    endScoreText.x = GAME_WIDTH / 2;
    endScoreText.y = GAME_HEIGHT / 2;
    this.endContainer.addChild(endScoreText);

    // Big download button
    const bigBtn = new PIXI.Container();
    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x00b300);
    btnBg.drawRoundedRect(0, 0, 220, 60, 16);
    btnBg.endFill();
    bigBtn.addChild(btnBg);

    const btnText = new PIXI.Text('Download Now!', {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff,
      fontFamily: 'Arial',
    });
    btnText.anchor.set(0.5, 0.5);
    btnText.x = 110;
    btnText.y = 30;
    bigBtn.addChild(btnText);

    bigBtn.x = GAME_WIDTH / 2 - 110;
    bigBtn.y = GAME_HEIGHT / 2 + 60;
    bigBtn.eventMode = 'static';
    bigBtn.cursor = 'pointer';
    bigBtn.on('pointerdown', () => {
      console.log('Download clicked');
    });
    this.endContainer.addChild(bigBtn);
  }

  updateLives(lives: number) {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(i < lives ? '❤️' : '🖤');
    }
    this.heartsText.text = hearts.join(' ');
  }

  updateScore(score: number) {
    this.scoreText.text = `$${score}`;
  }

  update(dt: number) {
    // Pulsing download button
    if (this.downloadBtnGrowing) {
      this.downloadBtnScale += 0.005 * dt;
      if (this.downloadBtnScale >= 1.15) this.downloadBtnGrowing = false;
    } else {
      this.downloadBtnScale -= 0.005 * dt;
      if (this.downloadBtnScale <= 0.9) this.downloadBtnGrowing = true;
    }
    this.downloadBtn.scale.set(this.downloadBtnScale);
  }
}
