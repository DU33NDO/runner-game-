import * as PIXI from "pixi.js";
import {
  GROUND_Y,
  GRAVITY,
  JUMP_FORCE,
  PLAYER_ANIMS,
  gameScale,
} from "./constants";
import { getAnimFrames } from "./spritesheet";

const BASE_TARGET_HEIGHT = 250; // player height at base 800px design height

export class Player {
  container: PIXI.Container;
  sprite: PIXI.AnimatedSprite;
  private runFrames: PIXI.Texture[];
  private jumpFrames: PIXI.Texture[];
  private idleFrames: PIXI.Texture[];

  private velocityY = 0;
  private isGrounded = true;
  private isRunning = false;

  constructor(parent: PIXI.Container, sheet: PIXI.Spritesheet) {
    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.runFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.run);
    this.idleFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.idle);
    this.jumpFrames = getAnimFrames(sheet, "player", PLAYER_ANIMS.jump);

    this.sprite = new PIXI.AnimatedSprite(this.idleFrames);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = 0.15;
    this.sprite.play();

    this.container.addChild(this.sprite);
    this.container.x = 100;

    this.applyScale();
  }

  /** Reposition and rescale to the current GROUND_Y / gameScale. */
  resize() {
    this.applyScale();
    // Snap to ground if currently grounded (don't interrupt a jump mid-air)
    if (this.isGrounded) this.container.y = GROUND_Y;
  }

  private applyScale() {
    const targetHeight = BASE_TARGET_HEIGHT * gameScale();
    const frameH = this.idleFrames[0]?.height || 350;
    this.sprite.scale.set(targetHeight / frameH);
    this.container.y = GROUND_Y;
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

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.container.y += this.velocityY * dt;

      if (this.container.y >= GROUND_Y) {
        this.container.y = GROUND_Y;
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
