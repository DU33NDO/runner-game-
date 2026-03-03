// Design resolution (portrait mobile)
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Physics
export const GRAVITY = 0.8;
export const JUMP_FORCE = -14;
export const GROUND_Y = 580; // Y position of the ground line where player stands

// Scrolling speed (pixels per frame)
export const SCROLL_SPEED = 4;

// Player spritesheet: 932x1506, 7 cols x 5 rows
export const PLAYER_SHEET = {
  width: 932,
  height: 1506,
  cols: 7,
  rows: 5,
  frameWidth: Math.floor(932 / 7),   // 133
  frameHeight: Math.floor(1506 / 5),  // 301
};

// Enemy spritesheet: 1682x1771, 8 cols x 5 rows
export const ENEMY_SHEET = {
  width: 1682,
  height: 1771,
  cols: 8,
  rows: 5,
  frameWidth: Math.floor(1682 / 8),  // 210
  frameHeight: Math.floor(1771 / 5), // 354
};

// Spawn intervals (in frames)
export const OBSTACLE_INTERVAL_MIN = 90;
export const OBSTACLE_INTERVAL_MAX = 180;
export const COLLECTIBLE_INTERVAL_MIN = 60;
export const COLLECTIBLE_INTERVAL_MAX = 150;
export const ENEMY_INTERVAL_MIN = 200;
export const ENEMY_INTERVAL_MAX = 400;

// Game
export const MAX_LIVES = 3;
export const FINISH_DISTANCE = 8000; // pixels scrolled to reach finish
export const COLLECTIBLE_VALUE = 10;
