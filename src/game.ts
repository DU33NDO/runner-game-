import * as PIXI from 'pixi.js';
import {
  SCROLL_SPEED, MAX_LIVES, FINISH_DISTANCE, COLLECTIBLE_VALUE,
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

  obstacleTimer = 60;
  collectibleTimer = 40;
  enemyTimer = 150;
  invincibleFrames = 0;

  constructor(
    app: PIXI.Application<HTMLCanvasElement>,
    playerSheet: PIXI.Spritesheet,
    enemySheet: PIXI.Spritesheet
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
    this.bgElements = createScrollingBackground(this.bgLayer, this.app.renderer as PIXI.Renderer);
    this.player = new Player(this.gameLayer, this.playerSheet);
    this.ui = new UIManager(this.uiLayer, this);

    this.state = 'intro';
    this.ui.showIntro();
    this.setupInput();
    this.app.ticker.add(this.update, this);
  }

  setupInput() {
    const handleTap = () => {
      if (this.state === 'intro') {
        this.state = 'playing';
        this.ui.hideIntro();
        this.player.startRunning();
      } else if (this.state === 'playing') {
        this.player.jump();
      }
    };

    this.app.view.addEventListener('pointerdown', handleTap);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleTap();
      }
    });
  }

  update = () => {
    if (this.state !== 'playing') return;

    const dt = this.app.ticker.deltaMS / 16.67;

    this.distance += this.speed * dt;
    this.bgElements.update(this.speed * dt);
    this.player.update(dt);

    // Invincibility blink
    if (this.invincibleFrames > 0) {
      this.invincibleFrames -= dt;
      this.player.sprite.alpha = Math.sin(this.invincibleFrames * 0.5) > 0 ? 1 : 0.3;
      if (this.invincibleFrames <= 0) this.player.sprite.alpha = 1;
    }

    // Spawn timers
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.obstacles.push(spawnCone(this.gameLayer));
      this.obstacleTimer = randRange(OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX);
    }

    this.collectibleTimer -= dt;
    if (this.collectibleTimer <= 0) {
      this.collectibles.push(spawnCollectible(this.gameLayer));
      this.collectibleTimer = randRange(COLLECTIBLE_INTERVAL_MIN, COLLECTIBLE_INTERVAL_MAX);
    }

    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      this.enemies.push(spawnEnemy(this.gameLayer, this.enemySheet));
      this.enemyTimer = randRange(ENEMY_INTERVAL_MIN, ENEMY_INTERVAL_MAX);
    }

    // Move objects
    for (const obj of [...this.obstacles, ...this.enemies, ...this.collectibles]) {
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

    // Collision: collectibles
    for (const col of this.collectibles) {
      if (col.active && this.checkCollision(this.player, col)) {
        col.active = false;
        col.container.visible = false;
        this.score += COLLECTIBLE_VALUE;
        this.ui.updateScore(this.score);
        // Fly the collected item to the PayPal badge
        const texKey = col.type === 'dollar' ? 'dollar' : 'paypalScore';
        this.ui.flyToScore(col.container.x, col.container.y, texKey);
      }
    }

    // Cleanup off-screen
    this.cleanupObjects(this.obstacles);
    this.cleanupObjects(this.enemies);
    this.cleanupObjects(this.collectibles);

    // Check finish
    if (this.distance >= FINISH_DISTANCE) this.onFinish();

    this.ui.update(dt);
  };

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

  checkCollision(player: Player, obj: GameObject): boolean {
    const pb = player.getBounds();
    const ob = obj.getBounds();
    const s = 15;
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

    if (this.lives <= 0) {
      this.state = 'fail';
      this.ui.showFail();
      setTimeout(() => {
        this.state = 'end';
        this.ui.showEnd(this.score);
      }, 1500);
    }
  }

  onFinish() {
    this.state = 'finished';
    this.ui.showFinish();
    setTimeout(() => {
      this.state = 'end';
      this.ui.showEnd(this.score);
    }, 2000);
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
