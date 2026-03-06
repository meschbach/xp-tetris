import { useState, useEffect, useCallback, useRef } from 'react';
import { TetrisBoard } from './TetrisBoard';
import { NextPiecePreview } from './NextPiecePreview';
import type { Piece, GameState } from './index';
import {
  createBoard,
  createPiece,
  getRandomTetrominoType,
  isValidPosition,
  movePiece,
  rotatePiece,
  canRotate,
  lockPiece,
  clearLines,
  calculateScore
} from './index';

const INITIAL_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;

export function TetrisGame() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    isPaused: false,
    isGameOver: false
  }));

  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(Date.now());

  // Initialize game
  const initGame = useCallback(() => {
    const board = createBoard();
    const nextType = getRandomTetrominoType();
    const nextPiece = createPiece(nextType);
    const firstType = getRandomTetrominoType();
    const currentPiece = createPiece(firstType);

    setGameState({
      board,
      currentPiece,
      nextPiece,
      score: 0,
      isPaused: false,
      isGameOver: false
    });
    setDropInterval(INITIAL_DROP_INTERVAL);
  }, []);

  // Lock current piece and spawn next
  const lockAndSpawn = useCallback(() => {
    const { currentPiece, nextPiece, board, score } = gameState;

    if (!currentPiece || !nextPiece) return;

    // Lock current piece
    const lockedBoard = lockPiece(board, currentPiece);

    // Clear lines
    const { newBoard, linesCleared } = clearLines(lockedBoard);

    // Calculate new score
    const newScore = score + calculateScore(linesCleared);

    // Generate new next piece
    const nextType = getRandomTetrominoType();
    const newNextPiece = createPiece(nextType);

    // Spawn piece from previous next (nextPiece is non-null here)
    const newCurrentPiece = createPiece(nextPiece.type);
    if (!isValidPosition(newBoard, newCurrentPiece)) {
      // Game over
      setGameState(prev => ({ ...prev, board: newBoard, score: newScore, isGameOver: true }));
      return;
    }

    // Adjust drop interval based on lines cleared (increase speed)
    const newInterval = Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL - (linesCleared * 50));

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPiece: newCurrentPiece,
      nextPiece: newNextPiece,
      score: newScore
    }));
    setDropInterval(newInterval);
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (!gameState.currentPiece || gameState.isPaused || gameState.isGameOver) {
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (gameState.isPaused || gameState.isGameOver) {
        gameLoopRef.current = null;
        return;
      }

      const elapsed = timestamp - lastDropTimeRef.current;

      if (elapsed >= dropInterval) {
        lastDropTimeRef.current = timestamp;

        const { currentPiece, board } = gameState;
        if (!currentPiece) return;

        // Try to move piece down
        if (isValidPosition(board, currentPiece, 0, 1)) {
          const movedPiece = movePiece(currentPiece, 0, 1);
          setGameState(prev => ({ ...prev, currentPiece: movedPiece }));
        } else {
          // Can't move down - lock the piece
          lockAndSpawn();
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [dropInterval, gameState.isPaused, gameState.isGameOver, lockAndSpawn]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isGameOver) return;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      if (gameState.isPaused) return;

      if (!gameState.currentPiece) return;

      const { currentPiece, board } = gameState;
      let newPiece: Piece | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          if (isValidPosition(board, currentPiece, -1, 0)) {
            newPiece = movePiece(currentPiece, -1, 0);
          }
          break;

        case 'ArrowRight':
          if (isValidPosition(board, currentPiece, 1, 0)) {
            newPiece = movePiece(currentPiece, 1, 0);
          }
          break;

        case 'ArrowDown':
          if (isValidPosition(board, currentPiece, 0, 1)) {
            newPiece = movePiece(currentPiece, 0, 1);
          } else {
            lockAndSpawn();
          }
          break;

        case 'ArrowUp':
          if (canRotate(board, currentPiece)) {
            newPiece = rotatePiece(currentPiece);
          }
          break;

        case ' ':
          // Hard drop
          e.preventDefault();
          let dropPiece = currentPiece;
          while (isValidPosition(board, dropPiece, 0, 1)) {
            dropPiece = movePiece(dropPiece, 0, 1);
          }
          newPiece = dropPiece;
          // Lock after hard drop
          setTimeout(() => lockAndSpawn(), 0);
          break;
      }

      if (newPiece) {
        setGameState(prev => ({ ...prev, currentPiece: newPiece }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, lockAndSpawn]);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, []);

  // Restart game
  const restartGame = () => {
    initGame();
  };

  return (
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
      <div>
        <h2>Tetris</h2>
        <TetrisBoard board={gameState.board} currentPiece={gameState.currentPiece} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Next</h3>
          <NextPiecePreview nextPiece={gameState.nextPiece} />
        </div>

        <div>
          <h3>Score</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{gameState.score}</p>
        </div>

        <div>
          <h3>Controls</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>← →</strong> Move</p>
            <p><strong>↑</strong> Rotate</p>
            <p><strong>↓</strong> Soft Drop</p>
            <p><strong>Space</strong> Hard Drop</p>
            <p><strong>P / Esc</strong> Pause</p>
          </div>
        </div>

        {(gameState.isPaused || gameState.isGameOver) && (
          <div style={{ textAlign: 'center' }}>
            {gameState.isPaused && <h3>PAUSED</h3>}
            {gameState.isGameOver && <h3>GAME OVER</h3>}
            <button
              onClick={restartGame}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {gameState.isGameOver ? 'Play Again' : 'Resume'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
