// Board dimensions
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 30;

// Swipe detection constants
export const SWIPE_MIN_DISTANCE = 30; // Minimum distance in pixels to qualify as a swipe
export const SWIPE_MAX_DURATION = 500; // Maximum duration in ms for a swipe

// Tetromino shapes (each shape is an array of [row, col] coordinates relative to pivot)
export const TETROMINOES = {
  I: {
    shape: [[0, 0], [0, 1], [0, 2], [0, 3]],
    color: '#00f0f0'
  },
  O: {
    shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
    color: '#f0f000'
  },
  T: {
    shape: [[0, 1], [1, 0], [1, 1], [1, 2]],
    color: '#a000f0'
  },
  S: {
    shape: [[0, 1], [0, 2], [1, 0], [1, 1]],
    color: '#00f000'
  },
  Z: {
    shape: [[0, 0], [0, 1], [1, 1], [1, 2]],
    color: '#f00000'
  },
  J: {
    shape: [[0, 0], [1, 0], [1, 1], [1, 2]],
    color: '#0000f0'
  },
  L: {
    shape: [[0, 2], [1, 0], [1, 1], [1, 2]],
    color: '#f0a000'
  }
};

export type TetrominoType = keyof typeof TETROMINOES;

export interface Piece {
  type: TetrominoType;
  x: number;
  y: number;
  shape: number[][];
}

export type Cell = string | null; // color or null for empty

export interface Board {
  grid: Cell[][];
  width: number;
  height: number;
}

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  score: number;
  isPaused: boolean;
  isGameOver: boolean;
}
