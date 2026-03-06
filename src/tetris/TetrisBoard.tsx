import { useEffect, forwardRef } from 'react';
import * as d3 from 'd3';
import type { Board, Piece } from '../tetris';
import { CELL_SIZE, BOARD_HEIGHT, BOARD_WIDTH } from '../tetris';

interface TetrisBoardProps {
  board: Board;
  currentPiece: Piece | null;
}

export const TetrisBoard = forwardRef<SVGSVGElement, TetrisBoardProps>(({ board, currentPiece }, ref) => {
  useEffect(() => {
    if (!ref || !('current' in ref) || !ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // Draw board background grid
    const g = svg.append('g');

    // Draw locked cells
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const color = board.grid[y][x];
        if (color) {
          g.append('rect')
            .attr('x', x * CELL_SIZE)
            .attr('y', y * CELL_SIZE)
            .attr('width', CELL_SIZE)
            .attr('height', CELL_SIZE)
            .attr('fill', color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      for (const [row, col] of currentPiece.shape) {
        const x = (currentPiece.x + col) * CELL_SIZE;
        const y = (currentPiece.y + row) * CELL_SIZE;

        // Skip if above the visible board
        if (y < -CELL_SIZE) continue;

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', CELL_SIZE)
          .attr('height', CELL_SIZE)
          .attr('fill', currentPiece.type === 'I' ? '#00f0f0' :
                 currentPiece.type === 'O' ? '#f0f000' :
                 currentPiece.type === 'T' ? '#a000f0' :
                 currentPiece.type === 'S' ? '#00f000' :
                 currentPiece.type === 'Z' ? '#f00000' :
                 currentPiece.type === 'J' ? '#0000f0' : '#f0a000')
          .attr('stroke', '#222')
          .attr('stroke-width', 1);
      }
    }

    // Draw grid lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      g.append('line')
        .attr('x1', x * CELL_SIZE)
        .attr('y1', 0)
        .attr('x2', x * CELL_SIZE)
        .attr('y2', BOARD_HEIGHT * CELL_SIZE)
        .attr('stroke', '#444')
        .attr('stroke-width', 0.5);
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      g.append('line')
        .attr('x1', 0)
        .attr('y1', y * CELL_SIZE)
        .attr('x2', BOARD_WIDTH * CELL_SIZE)
        .attr('y2', y * CELL_SIZE)
        .attr('stroke', '#444')
        .attr('stroke-width', 0.5);
    }
  }, [board, currentPiece, ref]);

  return (
    <svg
      ref={ref}
      width={BOARD_WIDTH * CELL_SIZE}
      height={BOARD_HEIGHT * CELL_SIZE}
      style={{ border: '2px solid #666', borderRadius: '4px', touchAction: 'none' }}
    />
  );
});
