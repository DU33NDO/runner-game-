import * as PIXI from 'pixi.js';
import { ASSETS, playerPlistRaw, enemyPlistRaw } from './assets';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { createSpritesheetFromPlist } from './spritesheet';
import { Game } from './game';

async function init() {
  const app = new PIXI.Application<HTMLCanvasElement>({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0xdde4cc,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.view);

  // Responsive scaling
  function resize() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.min(screenW / GAME_WIDTH, screenH / GAME_HEIGHT);
    app.view.style.width = `${GAME_WIDTH * scale}px`;
    app.view.style.height = `${GAME_HEIGHT * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  // Load all static assets
  const assetList = Object.entries(ASSETS).map(([key, url]) => ({
    alias: key,
    src: url,
  }));
  await PIXI.Assets.load(assetList);

  // Parse atlas spritesheets from plist data
  const playerBaseTex = (PIXI.Assets.get('playerAtlas') as PIXI.Texture).baseTexture;
  const enemyBaseTex = (PIXI.Assets.get('enemyAtlas') as PIXI.Texture).baseTexture;

  const playerSheet = await createSpritesheetFromPlist(playerBaseTex, playerPlistRaw, 'player');
  const enemySheet = await createSpritesheetFromPlist(enemyBaseTex, enemyPlistRaw, 'enemy');

  const game = new Game(app, playerSheet, enemySheet);
  game.start();
}

init().catch(console.error);
