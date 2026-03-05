import * as PIXI from "pixi.js";
import {
  GROUND_Y,
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  gameScale,
} from "./constants";

const BASE_TARGET_HEIGHT = 180;

function playerFrames(nums: number[]): PIXI.Texture[] {
  return nums.map((n) => PIXI.Assets.get(`player_${n}`) as PIXI.Texture);
}

export class Player {
  container: PIXI.Container;
  sprite: PIXI.AnimatedSprite;
  private runFrames: PIXI.Texture[];
  private jumpFrames: PIXI.Texture[];
  private standFrames: PIXI.Texture[];
  private damageFrames: PIXI.Texture[];

  private velocityY = 0;
  private isGrounded = true;
  private isRunning = false;
  private isDamaged = false;

  constructor(parent: PIXI.Container) {
    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.runFrames = playerFrames([11, 14, 36, 25, 1, 26, 37, 19, 11]);
    this.jumpFrames = playerFrames([20, 13, 27, 2, 2, 2, 6, 11]);
    this.damageFrames = playerFrames([20, 0, 18, 11]);
    this.standFrames = playerFrames([28]);

    this.sprite = new PIXI.AnimatedSprite(this.standFrames);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = 0.08;
    this.sprite.play();

    this.container.addChild(this.sprite);
    this.container.x = 70;
    this.applyScale();
  }

  resize() {
    this.applyScale();
    const isLandscape = GAME_WIDTH > GAME_HEIGHT;
    const isPhone = GAME_HEIGHT < 500;
    this.container.x = !isLandscape ? 70 : isPhone ? 300 : 300;
    if (this.isGrounded) this.container.y = GROUND_Y - 20;
  }

  private applyScale() {
    const frameH = this.standFrames[0]?.height || 350;
    const targetHeight = BASE_TARGET_HEIGHT * gameScale();
    this.sprite.scale.set(targetHeight / frameH);
    this.container.y = GROUND_Y - 20;
  }

  startRunning() {
    this.isRunning = true;
    this.isDamaged = false;
    this.sprite.onComplete = undefined;
    this.sprite.textures = this.runFrames;
    this.sprite.animationSpeed = 0.18;
    this.sprite.loop = true;
    this.sprite.play();
  }

  jump() {
    if (!this.isGrounded || !this.isRunning || this.isDamaged) return;
    this.isGrounded = false;
    this.velocityY = GAME_WIDTH < GAME_HEIGHT ? JUMP_FORCE * 1.15 : JUMP_FORCE * 0.85;
    this.sprite.textures = this.jumpFrames;
    this.sprite.animationSpeed = 0.15;
    this.sprite.loop = false;
    this.sprite.play();
  }

  /** Play the damage animation once, then return to run. */
  playDamage() {
    if (this.isDamaged) return;
    this.isDamaged = true;
    this.sprite.textures = this.damageFrames;
    this.sprite.animationSpeed = 0.2;
    this.sprite.loop = false;
    this.sprite.gotoAndPlay(0);
    this.sprite.onComplete = () => {
      this.isDamaged = false;
      this.sprite.onComplete = undefined;
      if (this.isRunning) {
        this.sprite.textures = this.runFrames;
        this.sprite.animationSpeed = 0.18;
        this.sprite.loop = true;
        this.sprite.play();
      }
    };
  }

  /** Flash red briefly when hit. */
  hitFlash() {
    this.sprite.tint = 0xff4444;
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

  stopAndStand() {
    this.isRunning = false;
    this.isDamaged = false;
    this.sprite.onComplete = undefined;
    this.sprite.textures = this.standFrames;
    this.sprite.animationSpeed = 0.08;
    this.sprite.loop = true;
    this.sprite.play();
  }

  update(dt: number) {
    if (!this.isRunning) return;

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.container.y += this.velocityY * dt;

      if (this.container.y >= GROUND_Y - 20) {
        this.container.y = GROUND_Y - 20;
        this.velocityY = 0;
        this.isGrounded = true;
        if (!this.isDamaged) {
          this.sprite.textures = this.runFrames;
          this.sprite.animationSpeed = 0.18;
          this.sprite.loop = true;
          this.sprite.play();
        }
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
