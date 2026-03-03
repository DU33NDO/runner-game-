// Design resolution (portrait mobile)
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Physics
export const GRAVITY = 0.8;
export const JUMP_FORCE = -14;
export const GROUND_Y = 580;

// Scrolling speed
export const SCROLL_SPEED = 4;

// Player animation frame indices (from atlas)
export const PLAYER_ANIMS = {
  run: [1, 2, 3, 4],
  idle: [6, 7, 8, 9],
  jump: [0, 5],
};

// Enemy animation frame indices (from atlas)
export const ENEMY_ANIMS = {
  run: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

// Spawn intervals (in frames at 60fps)
export const OBSTACLE_INTERVAL_MIN = 90;
export const OBSTACLE_INTERVAL_MAX = 180;
export const COLLECTIBLE_INTERVAL_MIN = 60;
export const COLLECTIBLE_INTERVAL_MAX = 150;
export const ENEMY_INTERVAL_MIN = 200;
export const ENEMY_INTERVAL_MAX = 400;

// Game
export const MAX_LIVES = 3;
export const FINISH_DISTANCE = 8000;
export const COLLECTIBLE_VALUE = 10;
