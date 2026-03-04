import * as PIXI from 'pixi.js';
import { ASSETS, playerPlistRaw, enemyPlistRaw } from './assets';
import { GAME_WIDTH, GAME_HEIGHT, setGameSize } from './constants';
import { createSpritesheetFromPlist } from './spritesheet';
import { Game } from './game';

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

    // Update the global size constants first so all components read the new values
    setGameSize(w, h);

    // Grow/shrink the WebGL surface to fill the container exactly — no bars
    app.renderer.resize(w, h);

    // Reposition all game elements to the new dimensions
    game?.resize();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  window.addEventListener('resize', resize);

  // Load all static assets
  const assetList = Object.entries(ASSETS).map(([key, url]) => ({ alias: key, src: url }));
  await PIXI.Assets.load(assetList);

  const playerBaseTex = (PIXI.Assets.get('playerAtlas') as PIXI.Texture).baseTexture;
  const enemyBaseTex  = (PIXI.Assets.get('enemyAtlas')  as PIXI.Texture).baseTexture;

  const playerSheet = await createSpritesheetFromPlist(playerBaseTex, playerPlistRaw, 'player');
  const enemySheet  = await createSpritesheetFromPlist(enemyBaseTex,  enemyPlistRaw,  'enemy');

  game = new Game(app, playerSheet, enemySheet);
  game.start();

  // Initial resize after game is ready
  resize();
}

init().catch(console.error);
