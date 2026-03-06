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
import { SWIPE_MIN_DISTANCE, SWIPE_MAX_DURATION } from './types';

const INITIAL_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;

export function TetrisGame() {
  const getInitialGameState = (): GameState => {
    const board = createBoard();
    const nextType = getRandomTetrominoType();
    const nextPiece = createPiece(nextType);
    const firstType = getRandomTetrominoType();
    const currentPiece = createPiece(firstType);
    return {
      board,
      currentPiece,
      nextPiece,
      score: 0,
      isPaused: false,
      isGameOver: false
    };
  };

  const [gameState, setGameState] = useState<GameState>(getInitialGameState);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);

  const gameLoopRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  const boardRef = useRef<SVGSVGElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Set initial time on mount
  useEffect(() => {
    lastDropTimeRef.current = performance.now();
  }, []);

  // Sync ref with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Lock current piece and spawn next
  const lockAndSpawn = useCallback(() => {
    const state = gameStateRef.current;
    const { currentPiece, nextPiece, board, score } = state;

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
  }, []);

  // Unified move performer for both keyboard and touch
  const performMove = useCallback((action: 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop') => {
    const state = gameStateRef.current;
    if (state.isGameOver || state.isPaused || !state.currentPiece) return;

    const { currentPiece, board } = state;
    let newPiece: Piece | null = null;

    switch (action) {
      case 'left':
        if (isValidPosition(board, currentPiece, -1, 0)) {
          newPiece = movePiece(currentPiece, -1, 0);
        }
        break;

      case 'right':
        if (isValidPosition(board, currentPiece, 1, 0)) {
          newPiece = movePiece(currentPiece, 1, 0);
        }
        break;

      case 'softDrop':
        if (isValidPosition(board, currentPiece, 0, 1)) {
          newPiece = movePiece(currentPiece, 0, 1);
        } else {
          lockAndSpawn();
        }
        break;

      case 'rotate':
        if (canRotate(board, currentPiece)) {
          newPiece = rotatePiece(currentPiece);
        }
        break;

      case 'hardDrop':
        {
          let dropPiece = currentPiece;
          while (isValidPosition(board, dropPiece, 0, 1)) {
            dropPiece = movePiece(dropPiece, 0, 1);
          }
          newPiece = dropPiece;
          setTimeout(() => lockAndSpawn(), 0);
        }
        break;
    }

    if (newPiece) {
      setGameState(prev => ({ ...prev, currentPiece: newPiece }));
    }
  }, [lockAndSpawn]);

  // Game loop
  useEffect(() => {
    if (!gameStateRef.current.currentPiece || gameState.isPaused || gameState.isGameOver) {
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (gameStateRef.current.isPaused || gameStateRef.current.isGameOver) {
        gameLoopRef.current = null;
        return;
      }

      const elapsed = timestamp - lastDropTimeRef.current;

      if (elapsed >= dropInterval) {
        lastDropTimeRef.current = timestamp;
        performMove('softDrop');
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [dropInterval, gameState.isPaused, gameState.isGameOver, performMove]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (state.isGameOver) return;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      if (state.isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
          performMove('left');
          break;
        case 'ArrowRight':
          performMove('right');
          break;
        case 'ArrowDown':
          performMove('softDrop');
          break;
        case 'ArrowUp':
          performMove('rotate');
          break;
        case ' ':
          e.preventDefault();
          performMove('hardDrop');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performMove]);

  // Touch controls
  useEffect(() => {
    const svg = boardRef.current;
    if (!svg) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const start = touchStartRef.current;
      if (!start) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const deltaTime = Date.now() - start.time;

      // Check if it's a valid swipe
      const distance = Math.abs(deltaX) > Math.abs(deltaY) ? Math.abs(deltaX) : Math.abs(deltaY);
      if (distance < SWIPE_MIN_DISTANCE || deltaTime > SWIPE_MAX_DURATION) {
        touchStartRef.current = null;
        return;
      }

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          performMove('right');
        } else {
          performMove('left');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          performMove('softDrop');
        } else {
          performMove('rotate');
        }
      }

      touchStartRef.current = null;
    };

    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchend', handleTouchEnd);
    };
  }, [performMove]);

  // Restart game
  const restartGame = () => {
    setGameState(getInitialGameState());
    setDropInterval(INITIAL_DROP_INTERVAL);
  };

  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return (
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
      <div>
        <h2>Tetris</h2>
        <TetrisBoard ref={boardRef} board={gameState.board} currentPiece={gameState.currentPiece} />
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
            <p><strong>Swipe ← →</strong> Move</p>
            <p><strong>Swipe ↑</strong> Rotate</p>
            <p><strong>Swipe ↓</strong> Soft Drop</p>
            <p><strong>Hard Drop</strong> Button (or Space)</p>
            <p><strong>Pause</strong> Button (or P/Esc)</p>
          </div>
        </div>

        {/* Mobile control buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => performMove('hardDrop')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              flex: 1
            }}
          >
            Hard Drop
          </button>
          <button
            onClick={togglePause}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              flex: 1
            }}
          >
            Pause
           </button>
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
