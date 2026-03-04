// Base design resolution (portrait phone)
export const BASE_HEIGHT = 800;
export const BASE_WIDTH = 450;

// Live values — updated by setGameSize() on every device/orientation change
export let GAME_WIDTH = BASE_WIDTH;
export let GAME_HEIGHT = BASE_HEIGHT;
export let GROUND_Y = 580; // recalculated as proportion of GAME_HEIGHT

// Physics
export const GRAVITY = 0.8;
export const JUMP_FORCE = -18;

// Scrolling speed
export const SCROLL_SPEED = 5;

// Enemy animation frame indices (from atlas)
export const ENEMY_ANIMS = {
  run: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

// Spawn intervals (in frames at 60fps)
export const OBSTACLE_INTERVAL_MIN = 120;
export const OBSTACLE_INTERVAL_MAX = 230;
export const COLLECTIBLE_INTERVAL_MIN = 130;
export const COLLECTIBLE_INTERVAL_MAX = 280;
export const ENEMY_INTERVAL_MIN = 200;
export const ENEMY_INTERVAL_MAX = 400;
export const TRIANGLE_INTERVAL_MIN = 180;
export const TRIANGLE_INTERVAL_MAX = 350;

// Game
export const MAX_LIVES = 3;
export const FINISH_DISTANCE = 4000;
export const COLLECTIBLE_VALUE = 10;

/** Call whenever the canvas dimensions change. */
export function setGameSize(w: number, h: number) {
  GAME_WIDTH = w;
  GAME_HEIGHT = h;
  GROUND_Y = Math.round(h * (580 / BASE_HEIGHT)); // keep 72.5% proportion
}

/** Uniform scale factor relative to the base design height. */
export function gameScale(): number {
  return GAME_HEIGHT / BASE_HEIGHT;
}
