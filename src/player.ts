import * as PIXI from 'pixi.js';
import {
  GAME_WIDTH, GROUND_Y, GRAVITY, JUMP_FORCE,
  PLAYER_SHEET,
} from './constants';

export class Player {
  container: PIXI.Container;
  sprite: PIXI.AnimatedSprite;
  private runFrames: PIXI.Texture[] = [];
  private jumpFrames: PIXI.Texture[] = [];
  private idleFrames: PIXI.Texture[] = [];

  private velocityY = 0;
  private isGrounded = true;
  private isRunning = false;

  constructor(parent: PIXI.Container) {
    this.container = new PIXI.Container();
    parent.addChild(this.container);

    // Parse spritesheet into frames
    const baseTexture = PIXI.Assets.get('spriteActions').baseTexture || PIXI.Assets.get('spriteActions');
    this.parseFrames(baseTexture);

    // Create animated sprite starting with idle
    this.sprite = new PIXI.AnimatedSprite(this.idleFrames);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = 0.15;
    this.sprite.play();

    // Scale player to reasonable game size
    const targetHeight = 120;
    const scale = targetHeight / PLAYER_SHEET.frameHeight;
    this.sprite.scale.set(scale);

    this.container.addChild(this.sprite);

    // Position: left side of screen, on ground
    this.container.x = 100;
    this.container.y = GROUND_Y;
  }

  private parseFrames(baseTexOrSprite: PIXI.BaseTexture | PIXI.Texture) {
    const base = baseTexOrSprite instanceof PIXI.BaseTexture
      ? baseTexOrSprite
      : baseTexOrSprite.baseTexture;

    const { cols, rows, frameWidth, frameHeight } = PLAYER_SHEET;
    const allFrames: PIXI.Texture[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowFrames: PIXI.Texture[] = [];
      for (let col = 0; col < cols; col++) {
        const rect = new PIXI.Rectangle(
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight
        );
        rowFrames.push(new PIXI.Texture(base, rect));
      }
      allFrames.push(rowFrames);
    }

    // Row 0: Run cycle (first 5 frames are distinct running poses)
    this.runFrames = allFrames[0].slice(0, 5);
    // Row 1: Idle
    this.idleFrames = allFrames[1].slice(0, 4);
    // Row 2: Jump / additional run (use as jump frames)
    this.jumpFrames = allFrames[2].slice(0, 3);
  }

  startRunning() {
    this.isRunning = true;
    this.sprite.textures = this.runFrames;
    this.sprite.animationSpeed = 0.2;
    this.sprite.play();
  }

  jump() {
    if (!this.isGrounded || !this.isRunning) return;
    this.isGrounded = false;
    this.velocityY = JUMP_FORCE;
    this.sprite.textures = this.jumpFrames;
    this.sprite.animationSpeed = 0.1;
    this.sprite.play();
  }

  update(dt: number) {
    if (!this.isRunning) return;

    // Apply gravity
    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.container.y += this.velocityY * dt;

      // Land on ground
      if (this.container.y >= GROUND_Y) {
        this.container.y = GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
        // Return to run animation
        this.sprite.textures = this.runFrames;
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
      }
    }
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    const scale = this.sprite.scale.x;
    const w = PLAYER_SHEET.frameWidth * scale;
    const h = PLAYER_SHEET.frameHeight * scale;
    return {
      x: this.container.x - w / 2,
      y: this.container.y - h,
      width: w,
      height: h,
    };
  }
}
