import type { Board, Cell, Piece, TetrominoType } from './types';
import { TETROMINOES, BOARD_HEIGHT, BOARD_WIDTH } from './types';

// Create an empty board
export function createBoard(): Board {
  const grid: Cell[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    grid.push(Array(BOARD_WIDTH).fill(null));
  }
  return { grid, width: BOARD_WIDTH, height: BOARD_HEIGHT };
}

// Get a random tetromino type
export function getRandomTetrominoType(): TetrominoType {
  const types = Object.keys(TETROMINOES) as TetrominoType[];
  return types[Math.floor(Math.random() * types.length)];
}

// Create a new piece at the top center
export function createPiece(type: TetrominoType): Piece {
  const tetromino = TETROMINOES[type];
  return {
    type,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
    y: 0,
    shape: tetromino.shape
  };
}

// Check if piece position is valid (no collision with walls, floor, or locked cells)
export function isValidPosition(board: Board, piece: Piece, offsetX = 0, offsetY = 0): boolean {
  for (const [row, col] of piece.shape) {
    const newX = piece.x + col + offsetX;
    const newY = piece.y + row + offsetY;

    // Check boundaries
    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
      return false;
    }

    // Skip collision check for cells above the board (negative y)
    if (newY < 0) {
      continue;
    }

    // Check collision with locked cells
    if (board.grid[newY][newX] !== null) {
      return false;
    }
  }
  return true;
}

// Move piece
export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, x: piece.x + dx, y: piece.y + dy };
}

// Rotate piece clockwise (90 degrees)
export function rotatePiece(piece: Piece): Piece {
  const rotatedShape = piece.shape.map(([row, col]) => [col, -row]);
  return { ...piece, shape: rotatedShape };
}

// Check if piece can rotate at current position
export function canRotate(board: Board, piece: Piece): boolean {
  const rotated = rotatePiece(piece);
  return isValidPosition(board, rotated);
}

// Lock piece into board
export function lockPiece(board: Board, piece: Piece): Board {
  const newGrid = board.grid.map(row => [...row]);
  const color = TETROMINOES[piece.type].color;

  for (const [row, col] of piece.shape) {
    const boardY = piece.y + row;
    const boardX = piece.x + col;
    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
      newGrid[boardY][boardX] = color;
    }
  }

  return { ...board, grid: newGrid };
}

// Clear completed lines and return number of lines cleared
export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newGrid = board.grid.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newGrid.length;

  // Add empty rows at the top
  while (newGrid.length < BOARD_HEIGHT) {
    newGrid.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { newBoard: { ...board, grid: newGrid }, linesCleared };
}

// Calculate score based on lines cleared (standard Tetris scoring)
export function calculateScore(linesCleared: number, level: number = 1): number {
  const baseScores = [0, 100, 300, 500, 800];
  return baseScores[linesCleared] * level;
}

// Check if game is over (new piece cannot spawn)
export function isGameOver(board: Board, nextPieceType: TetrominoType): boolean {
  const testPiece = createPiece(nextPieceType);
  return !isValidPosition(board, testPiece);
}
