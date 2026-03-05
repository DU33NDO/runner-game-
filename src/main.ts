import * as PIXI from 'pixi.js';
import { ASSETS, enemyPlistRaw } from './assets';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, setGameSize } from './constants';
import { createSpritesheetFromPlist } from './spritesheet';
import { Game } from './game';

import { setMuted } from './sound';

(window as any).__muteGame = setMuted;

async function init() {
  const container = document.getElementById('game-container')!;

  const app = new PIXI.Application<HTMLCanvasElement>({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0xdde4cc,
    antialias: true,
    resolution: 1,
  });

  container.appendChild(app.view);
  app.view.style.width  = '100%';
  app.view.style.height = '100%';

  let game: Game | null = null;

  function resize() {
    const w = container.clientWidth  || GAME_WIDTH;
    const h = container.clientHeight || GAME_HEIGHT;

    // Save old ground position before update so we can shift live objects
    const prevGroundY = GROUND_Y;

    // Update the global size constants first so all components read the new values
    setGameSize(w, h);

    // Grow/shrink the WebGL surface to fill the container exactly — no bars
    app.renderer.resize(w, h);

    // Reposition all game elements to the new dimensions
    game?.resize(GROUND_Y - prevGroundY);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  window.addEventListener('resize', resize);

  // Load all static assets
  const assetList = Object.entries(ASSETS).map(([key, url]) => ({ alias: key, src: url }));
  await PIXI.Assets.load(assetList);

  const enemyBaseTex = (PIXI.Assets.get('enemyAtlas') as PIXI.Texture).baseTexture;
  const enemySheet   = await createSpritesheetFromPlist(enemyBaseTex, enemyPlistRaw, 'enemy');

  game = new Game(app, enemySheet);
  game.start();

  // Initial resize after game is ready
  resize();
}

init().catch(console.error);
