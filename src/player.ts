import * as PIXI from "pixi.js";
import {
  GROUND_Y,
  GRAVITY,
  JUMP_FORCE,
  PLAYER_ANIMS,
  gameScale,
} from "./constants";
import { getAnimFrames } from "./spritesheet";

const BASE_TARGET_HEIGHT = 250;

export class Player {
  container: PIXI.Container;
  sprite: PIXI.AnimatedSprite;
  private runFrames: PIXI.Texture[];
  private jumpFrames: PIXI.Texture[];
  private idleFrames: PIXI.Texture[];
  private standFrames: PIXI.Texture[];
  private blinkFrames: PIXI.Texture[];

  private velocityY = 0;
  private isGrounded = true;
  private isRunning = false;
  private isBlinking = true;
  private blinkTimer = 180; // frames until first blink

  constructor(parent: PIXI.Container, sheet: PIXI.Spritesheet) {
    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.runFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.run);
    this.idleFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.idle);
    this.jumpFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.jump);
    this.standFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.stand);
    this.blinkFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.blink);

    // Use stand frames for the pre-run idle; fall back to idleFrames if missing
    const initial =
      this.standFrames.length > 0 ? this.standFrames : this.idleFrames;
    this.sprite = new PIXI.AnimatedSprite(initial);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = 0.08; // slow stand cycle
    this.sprite.play();

    this.container.addChild(this.sprite);
    this.container.x = 70;

    this.applyScale();
  }

  resize() {
    this.applyScale();
    if (this.isGrounded) this.container.y = GROUND_Y + 40;
  }

  private applyScale() {
    const frames =
      this.standFrames.length > 0 ? this.standFrames : this.idleFrames;
    const targetHeight = BASE_TARGET_HEIGHT * gameScale();
    const frameH = frames[0]?.height || 350;
    this.sprite.scale.set(targetHeight / frameH);
    this.container.y = GROUND_Y + 40;
  }

  startRunning() {
    this.isRunning = true;
    this.isBlinking = false;
    this.sprite.onComplete = undefined; // cancel any pending blink callback
    this.sprite.textures = this.runFrames;
    this.sprite.animationSpeed = 0.2;
    this.sprite.loop = true;
    this.sprite.play();
  }

  /** Flash red briefly when hit. */
  hitFlash() {
    this.sprite.tint = 0xff2222;
    let elapsed = 0;
    const tick = (dt: number) => {
      elapsed += dt;
      if (elapsed > 15) {
        this.sprite.tint = 0xffffff;
        PIXI.Ticker.shared.remove(tick);
      }
    };
    PIXI.Ticker.shared.add(tick);
  }

  /** Switch to stand animation — called when the game ends (win or lose). */
  stopAndStand() {
    this.isRunning = false;
    this.isBlinking = false;
    this.sprite.onComplete = undefined;
    const frames = this.standFrames.length > 0 ? this.standFrames : this.idleFrames;
    this.sprite.textures = frames;
    this.sprite.animationSpeed = 0.08;
    this.sprite.loop = true;
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
    if (!this.isRunning) {
      // Periodic blink while standing
      if (!this.isBlinking && this.blinkFrames.length > 0) {
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
          this.isBlinking = true;
          this.sprite.textures = this.blinkFrames;
          this.sprite.animationSpeed = 0.25;
          this.sprite.loop = false;
          this.sprite.play();
          this.sprite.onComplete = () => {
            this.isBlinking = false;
            const frames =
              this.standFrames.length > 0 ? this.standFrames : this.idleFrames;
            this.sprite.textures = frames;
            this.sprite.animationSpeed = 0.08;
            this.sprite.loop = true;
            this.sprite.play();
            this.blinkTimer = 150 + Math.random() * 120; // 2.5–4.5 s
            this.sprite.onComplete = undefined;
          };
        }
      }
      return;
    }

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.container.y += this.velocityY * dt;

      if (this.container.y >= GROUND_Y + 40) {
        this.container.y = GROUND_Y + 40;
        this.velocityY = 0;
        this.isGrounded = true;
        this.sprite.textures = this.runFrames;
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
      }
    }
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    const scale = this.sprite.scale.x;
    const tex = this.sprite.texture;
    return {
      x: this.container.x - (tex.width * scale) / 2,
      y: this.container.y - tex.height * scale,
      width: tex.width * scale,
      height: tex.height * scale,
    };
  }
}
