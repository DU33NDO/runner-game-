import * as PIXI from "pixi.js";
import {
  SCROLL_SPEED,
  MAX_LIVES,
  FINISH_DISTANCE,
  COLLECTIBLE_VALUE,
  OBSTACLE_INTERVAL_MIN,
  OBSTACLE_INTERVAL_MAX,
  COLLECTIBLE_INTERVAL_MIN,
  COLLECTIBLE_INTERVAL_MAX,
  ENEMY_INTERVAL_MIN,
  ENEMY_INTERVAL_MAX,
  TRIANGLE_INTERVAL_MIN,
  TRIANGLE_INTERVAL_MAX,
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
} from "./constants";
import { Player } from "./player";
import { createScrollingBackground } from "./background";
import {
  spawnCone,
  spawnEnemy,
  spawnCollectible,
  spawnJumpCoins,
  type GameObject,
} from "./objects";
import { UIManager } from "./ui";
import { startBgMusic, playJump, playCollect, playDamage, playWin, playLose } from "./sound";

export type GameState =
  | "intro"
  | "tutorial"
  | "tutorial_pause"
  | "playing"
  | "fail"
  | "finished"
  | "end";

export class Game {
  app: PIXI.Application<HTMLCanvasElement>;
  state: GameState = "intro";

  bgLayer: PIXI.Container;
  gameLayer: PIXI.Container;
  uiLayer: PIXI.Container;

  player!: Player;
  ui!: UIManager;
  bgElements!: ReturnType<typeof createScrollingBackground>;

  playerSheet: PIXI.Spritesheet;
  enemySheet: PIXI.Spritesheet;

  obstacles: GameObject[] = [];
  enemies: GameObject[] = [];
  collectibles: GameObject[] = [];

  lives = MAX_LIVES;
  score = 0;
  distance = 0;
  speed = SCROLL_SPEED;
  collectCount = 0;

  obstacleTimer = 60;
  collectibleTimer = 40;
  enemyTimer = 150;
  triangleTimer = 200;
  invincibleFrames = 0;

  // Finish line
  finishLineSpawned = false;
  finishLineContainer: PIXI.Container | null = null;

  // Tutorial state
  tutorialTimer = 0;
  tutorialCollected = 0;
  tutorialEnemySpawned = false;
  tutorialEnemy: GameObject | null = null;
  tutorialStep1 = false;
  tutorialStep2 = false;

  constructor(
    app: PIXI.Application<HTMLCanvasElement>,
    playerSheet: PIXI.Spritesheet,
    enemySheet: PIXI.Spritesheet,
  ) {
    this.app = app;
    this.playerSheet = playerSheet;
    this.enemySheet = enemySheet;

    this.bgLayer = new PIXI.Container();
    this.gameLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    app.stage.addChild(this.bgLayer);
    app.stage.addChild(this.gameLayer);
    app.stage.addChild(this.uiLayer);
  }

  resize() {
    this.bgElements?.resize();
    this.player?.resize();
    this.ui?.resize();
  }

  start() {
    this.bgElements = createScrollingBackground(
      this.bgLayer,
      this.app.renderer as PIXI.Renderer,
    );
    this.player = new Player(this.gameLayer, this.playerSheet);
    this.ui = new UIManager(this.uiLayer, this);

    this.state = "intro";
    this.ui.showIntro();
    this.setupInput();
    this.app.ticker.add(this.update, this);

    // DEV: uncomment to preview end screen immediately
    // this.ui.showEnd(120, false);
  }

  setupInput() {
    const handleTap = () => {
      if (this.state === "intro") {
        this.state = "tutorial";
        this.ui.hideIntro();
        this.player.startRunning();
        startBgMusic();
      } else if (this.state === "tutorial_pause") {
        this.startGameAfterTutorial();
      } else if (this.state === "playing") {
        this.player.jump();
        playJump();
      }
    };

    this.app.view.addEventListener("pointerdown", handleTap);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleTap();
      }
    });
  }

  update = () => {
    if (this.state === "tutorial") {
      this.updateTutorial();
      return;
    }
    if (this.state !== "playing") return;

    const dt = this.app.ticker.deltaMS / 16.67;

    this.distance += this.speed * dt;
    this.bgElements.update(this.speed * dt);
    this.player.update(dt);

    // Invincibility blink
    if (this.invincibleFrames > 0) {
      this.invincibleFrames -= dt;
      this.player.sprite.alpha =
        Math.sin(this.invincibleFrames * 0.5) > 0 ? 1 : 0.3;
      if (this.invincibleFrames <= 0) this.player.sprite.alpha = 1;
    }

    // Spawn timers
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.obstacles.push(spawnCone(this.gameLayer));
      this.obstacleTimer = randRange(
        OBSTACLE_INTERVAL_MIN,
        OBSTACLE_INTERVAL_MAX,
      );
    }

    this.collectibleTimer -= dt;
    if (this.collectibleTimer <= 0) {
      this.collectibles.push(spawnCollectible(this.gameLayer));
      this.collectibleTimer = randRange(
        COLLECTIBLE_INTERVAL_MIN,
        COLLECTIBLE_INTERVAL_MAX,
      );
    }

    this.triangleTimer -= dt;
    if (this.triangleTimer <= 0) {
      this.collectibles.push(...spawnJumpCoins(this.gameLayer));
      this.triangleTimer = randRange(
        TRIANGLE_INTERVAL_MIN,
        TRIANGLE_INTERVAL_MAX,
      );
    }

    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      this.enemies.push(spawnEnemy(this.gameLayer, this.enemySheet));
      this.enemyTimer = randRange(ENEMY_INTERVAL_MIN, ENEMY_INTERVAL_MAX);
    }

    // Move objects
    for (const obj of [
      ...this.obstacles,
      ...this.enemies,
      ...this.collectibles,
    ]) {
      if (!obj.active) continue;
      obj.container.x -= this.speed * dt;
      if (obj.enemySpeed) obj.container.x -= obj.enemySpeed * dt;
    }

    // Collision: obstacles & enemies
    if (this.invincibleFrames <= 0) {
      for (const obj of [...this.obstacles, ...this.enemies]) {
        if (obj.active && this.checkCollision(this.player, obj)) {
          this.onHit();
          break;
        }
      }
    }

    // Collision: collectibles (shrink=0 — generous hitbox for small items)
    for (const col of this.collectibles) {
      if (col.active && this.checkCollision(this.player, col, 0)) {
        col.active = false;
        col.container.visible = false;
        this.score += COLLECTIBLE_VALUE;
        this.collectCount++;
        this.ui.updateScore(this.score);
        playCollect();
        const texKey = col.type === "dollar" ? "dollar" : "paypalScore";
        this.ui.flyToScore(col.container.x, col.container.y, texKey);
        if (this.collectCount % 5 === 0) this.ui.showComboText();
      }
    }

    // Cleanup off-screen
    this.cleanupObjects(this.obstacles);
    this.cleanupObjects(this.enemies);
    this.cleanupObjects(this.collectibles);

    // Spawn finish-line world props early enough to be visible (~3s approach)
    if (!this.finishLineSpawned && this.distance >= FINISH_DISTANCE - 800) {
      this.finishLineSpawned = true;
      this.finishLineContainer = this.createFinishLineWorld();
    }
    if (this.finishLineContainer) {
      this.finishLineContainer.x -= this.speed * dt;
    }

    // Check finish — trigger when the finish line scrolls past the player
    if (this.finishLineContainer && this.finishLineContainer.x < this.player.container.x) {
      this.onFinish();
    }

    this.ui.update(dt);
  };

  // ── Tutorial ────────────────────────────────────────────────────────────────

  updateTutorial() {
    const dt = this.app.ticker.deltaMS / 16.67;
    this.tutorialTimer += dt;

    this.bgElements.update(this.speed * dt);
    this.player.update(dt);

    // Scripted ground-level collectibles (no jump needed)
    if (!this.tutorialStep1 && this.tutorialTimer > 30) {
      this.tutorialStep1 = true;
      this.collectibles.push(spawnCollectible(this.gameLayer, true));
    }
    if (!this.tutorialStep2 && this.tutorialTimer > 100) {
      this.tutorialStep2 = true;
      this.collectibles.push(spawnCollectible(this.gameLayer, true));
    }

    // Move collectibles
    for (const col of this.collectibles) {
      if (col.active) col.container.x -= this.speed * dt;
    }

    // Collect (shrink=0 for generous hitbox)
    for (const col of this.collectibles) {
      if (col.active && this.checkCollision(this.player, col, 0)) {
        col.active = false;
        col.container.visible = false;
        this.score += COLLECTIBLE_VALUE;
        this.ui.updateScore(this.score);
        this.tutorialCollected++;
        const texKey = col.type === "dollar" ? "dollar" : "paypalScore";
        this.ui.flyToScore(col.container.x, col.container.y, texKey);
      }
    }

    // Spawn enemy once both collectibles collected
    if (this.tutorialCollected >= 2 && !this.tutorialEnemySpawned) {
      this.tutorialEnemySpawned = true;
      this.tutorialEnemy = spawnEnemy(this.gameLayer, this.enemySheet);
      this.enemies.push(this.tutorialEnemy);
    }

    // Move tutorial enemy and check proximity
    if (this.tutorialEnemy && this.tutorialEnemy.active) {
      this.tutorialEnemy.container.x -=
        (this.speed + (this.tutorialEnemy.enemySpeed || 0)) * dt;

      // Pause when enemy is about 200px from player
      if (this.tutorialEnemy.container.x < this.player.container.x + 130) {
        this.state = "tutorial_pause";
        this.ui.showTutorialOverlay();
      }
    }

    this.cleanupObjects(this.collectibles);
  }

  startGameAfterTutorial() {
    // Enemy stays — player must jump over it immediately
    this.ui.hideTutorialOverlay();
    this.distance = 0; // tutorial time doesn't count toward the finish
    this.state = "playing";
    this.player.jump(); playJump(); // auto-jump so the player clears the frozen enemy
  }

  // ── Shared helpers ──────────────────────────────────────────────────────────

  cleanupObjects(objects: GameObject[]) {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.container.x < -200 || !obj.active) {
        if (obj.floatTicker) PIXI.Ticker.shared.remove(obj.floatTicker);
        this.gameLayer.removeChild(obj.container);
        obj.container.destroy({ children: true });
        objects.splice(i, 1);
      }
    }
  }

  checkCollision(player: Player, obj: GameObject, shrink = 30): boolean {
    const pb = player.getBounds();
    const ob = obj.getBounds();
    const s = shrink;
    return (
      pb.x + s < ob.x + ob.width - s &&
      pb.x + pb.width - s > ob.x + s &&
      pb.y + s < ob.y + ob.height - s &&
      pb.y + pb.height - s > ob.y + s
    );
  }

  onHit() {
    this.lives--;
    this.ui.updateLives(this.lives);
    this.invincibleFrames = 90;
    this.player.hitFlash();
    playDamage();

    if (this.lives <= 0) {
      this.state = "fail";
      this.player.stopAndStand();
      this.ui.showFail();
      playLose();
      setTimeout(() => {
        this.state = "end";
        this.ui.showEnd(this.score, false);
      }, 1500);
    }
  }

  createFinishLineWorld(): PIXI.Container {
    const c = new PIXI.Container();

    // Vertical checkered stripe
    const lineTex = PIXI.Assets.get("finishLine") as PIXI.Texture;
    const line = new PIXI.Sprite(lineTex);
    line.anchor.set(0.5, 1);
    line.height = 100;
    line.width = 60;
    line.y = GROUND_Y + 40;
    c.addChild(line);


    c.x = GAME_WIDTH + 60;
    this.gameLayer.addChild(c);
    return c;
  }

  clearAllObjects(objects: GameObject[]) {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.floatTicker) PIXI.Ticker.shared.remove(obj.floatTicker);
      this.gameLayer.removeChild(obj.container);
      obj.container.destroy({ children: true });
    }
    objects.length = 0;
  }

  onFinish() {
    this.state = "finished";
    this.player.stopAndStand();
    this.clearAllObjects(this.obstacles);
    this.clearAllObjects(this.enemies);
    this.clearAllObjects(this.collectibles);
    this.ui.showFinish();
    this.ui.showConfetti();
    playWin();
    setTimeout(() => {
      this.state = "end";
      this.ui.showEnd(this.score, true);
    }, 2000);
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
