import * as PIXI from 'pixi.js';
import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y, SCROLL_SPEED,
  MAX_LIVES, FINISH_DISTANCE, COLLECTIBLE_VALUE,
  OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX,
  COLLECTIBLE_INTERVAL_MIN, COLLECTIBLE_INTERVAL_MAX,
  ENEMY_INTERVAL_MIN, ENEMY_INTERVAL_MAX,
} from './constants';
import { Player } from './player';
import { createScrollingBackground } from './background';
import { spawnCone, spawnEnemy, spawnCollectible, type GameObject } from './objects';
import { UIManager } from './ui';

export type GameState = 'intro' | 'playing' | 'fail' | 'finished' | 'end';

export class Game {
  app: PIXI.Application<HTMLCanvasElement>;
  state: GameState = 'intro';

  // Layers
  bgLayer: PIXI.Container;
  gameLayer: PIXI.Container;
  uiLayer: PIXI.Container;

  // Core objects
  player!: Player;
  ui!: UIManager;
  bgElements!: ReturnType<typeof createScrollingBackground>;

  // Game objects
  obstacles: GameObject[] = [];
  enemies: GameObject[] = [];
  collectibles: GameObject[] = [];

  // State
  lives = MAX_LIVES;
  score = 0;
  distance = 0;
  speed = SCROLL_SPEED;

  // Spawn timers
  nextObstacle = 0;
  nextCollectible = 0;
  nextEnemy = 0;
  obstacleTimer = 60;
  collectibleTimer = 40;
  enemyTimer = 150;

  // Invincibility after hit
  invincibleFrames = 0;

  constructor(app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;

    // Create layers in render order
    this.bgLayer = new PIXI.Container();
    this.gameLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    app.stage.addChild(this.bgLayer);
    app.stage.addChild(this.gameLayer);
    app.stage.addChild(this.uiLayer);
  }

  start() {
    // Set up background
    this.bgElements = createScrollingBackground(this.bgLayer);

    // Create player
    this.player = new Player(this.gameLayer);

    // Create UI
    this.ui = new UIManager(this.uiLayer, this);

    // Show intro
    this.state = 'intro';
    this.ui.showIntro();

    // Input
    this.setupInput();

    // Game loop
    this.app.ticker.add(this.update, this);
  }

  setupInput() {
    const canvas = this.app.view;

    const handleTap = () => {
      if (this.state === 'intro') {
        this.state = 'playing';
        this.ui.hideIntro();
        this.player.startRunning();
      } else if (this.state === 'playing') {
        this.player.jump();
      } else if (this.state === 'end') {
        // Download button click handled by UI
      }
    };

    canvas.addEventListener('pointerdown', handleTap);
    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleTap();
      }
    });
  }

  update = () => {
    if (this.state !== 'playing') return;

    const dt = this.app.ticker.deltaMS / 16.67; // normalize to ~60fps

    // Update distance
    this.distance += this.speed * dt;

    // Scroll background
    this.bgElements.update(this.speed * dt);

    // Update player
    this.player.update(dt);

    // Invincibility timer
    if (this.invincibleFrames > 0) {
      this.invincibleFrames -= dt;
      // Blink effect
      this.player.sprite.alpha = Math.sin(this.invincibleFrames * 0.5) > 0 ? 1 : 0.3;
      if (this.invincibleFrames <= 0) {
        this.player.sprite.alpha = 1;
      }
    }

    // Spawn obstacles
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.spawnObstacle();
      this.obstacleTimer = randRange(OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX);
    }

    // Spawn collectibles
    this.collectibleTimer -= dt;
    if (this.collectibleTimer <= 0) {
      this.spawnCollectibleItem();
      this.collectibleTimer = randRange(COLLECTIBLE_INTERVAL_MIN, COLLECTIBLE_INTERVAL_MAX);
    }

    // Spawn enemies
    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      this.spawnEnemyChar();
      this.enemyTimer = randRange(ENEMY_INTERVAL_MIN, ENEMY_INTERVAL_MAX);
    }

    // Update & check obstacles
    this.updateObjects(this.obstacles, dt, true);
    this.updateObjects(this.enemies, dt, true);
    this.updateObjects(this.collectibles, dt, false);

    // Check collision with obstacles and enemies
    if (this.invincibleFrames <= 0) {
      for (const obs of this.obstacles) {
        if (obs.active && this.checkCollision(this.player, obs)) {
          this.onHit();
          break;
        }
      }
      if (this.invincibleFrames <= 0) {
        for (const enemy of this.enemies) {
          if (enemy.active && this.checkCollision(this.player, enemy)) {
            this.onHit();
            break;
          }
        }
      }
    }

    // Check collectible pickup
    for (const col of this.collectibles) {
      if (col.active && this.checkCollision(this.player, col)) {
        col.active = false;
        col.container.visible = false;
        this.score += COLLECTIBLE_VALUE;
        this.ui.updateScore(this.score);
      }
    }

    // Clean up off-screen objects
    this.cleanupObjects(this.obstacles);
    this.cleanupObjects(this.enemies);
    this.cleanupObjects(this.collectibles);

    // Check finish
    if (this.distance >= FINISH_DISTANCE) {
      this.onFinish();
    }

    // Update UI
    this.ui.update(dt);
  };

  spawnObstacle() {
    const obj = spawnCone(this.gameLayer);
    this.obstacles.push(obj);
  }

  spawnCollectibleItem() {
    const obj = spawnCollectible(this.gameLayer);
    this.collectibles.push(obj);
  }

  spawnEnemyChar() {
    const obj = spawnEnemy(this.gameLayer);
    this.enemies.push(obj);
  }

  updateObjects(objects: GameObject[], dt: number, scrolls: boolean) {
    for (const obj of objects) {
      if (!obj.active) continue;
      if (scrolls) {
        obj.container.x -= this.speed * dt;
      } else {
        obj.container.x -= this.speed * dt;
      }
      // Enemies have their own speed toward player
      if (obj.enemySpeed) {
        obj.container.x -= obj.enemySpeed * dt;
      }
      // Animate if animated sprite
      if (obj.animatedSprite) {
        // AnimatedSprite handles its own animation
      }
    }
  }

  cleanupObjects(objects: GameObject[]) {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.container.x < -200 || !obj.active) {
        this.gameLayer.removeChild(obj.container);
        if (obj.animatedSprite) obj.animatedSprite.destroy();
        else obj.container.destroy();
        objects.splice(i, 1);
      }
    }
  }

  checkCollision(player: Player, obj: GameObject): boolean {
    const pb = player.getBounds();
    const ob = obj.getBounds();

    // Shrink hitboxes for forgiving collision
    const shrink = 15;
    return (
      pb.x + shrink < ob.x + ob.width - shrink &&
      pb.x + pb.width - shrink > ob.x + shrink &&
      pb.y + shrink < ob.y + ob.height - shrink &&
      pb.y + pb.height - shrink > ob.y + shrink
    );
  }

  onHit() {
    this.lives--;
    this.ui.updateLives(this.lives);
    this.invincibleFrames = 90; // ~1.5 seconds

    if (this.lives <= 0) {
      this.state = 'fail';
      this.ui.showFail();
      // After a delay, go to end screen
      setTimeout(() => {
        this.state = 'end';
        this.ui.showEnd(this.score);
      }, 1500);
    }
  }

  onFinish() {
    this.state = 'finished';
    this.ui.showFinish();
    // After a delay, show end screen
    setTimeout(() => {
      this.state = 'end';
      this.ui.showEnd(this.score);
    }, 2000);
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
