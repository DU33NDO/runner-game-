import * as PIXI from 'pixi.js';
import { ASSETS } from './assets';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
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

  // Responsive scaling: fit canvas to screen while maintaining aspect ratio
  function resize() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.min(screenW / GAME_WIDTH, screenH / GAME_HEIGHT);
    const canvas = app.view;
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  // Load all assets
  const assetList = Object.entries(ASSETS).map(([key, url]) => ({
    alias: key,
    src: url,
  }));
  await PIXI.Assets.load(assetList);

  // Start the game
  const game = new Game(app);
  game.start();
}

init().catch(console.error);
