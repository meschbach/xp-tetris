import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Piece } from '../tetris';
import { TETROMINOES, CELL_SIZE } from '../tetris';

interface NextPiecePreviewProps {
  nextPiece: Piece | null;
}

export function NextPiecePreview({ nextPiece }: NextPiecePreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = CELL_SIZE * 4; // 4x4 preview area

  useEffect(() => {
    if (!svgRef.current || !nextPiece) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    const color = TETROMINOES[nextPiece.type].color;

    // Find bounds of the piece to center it
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const [row, col] of nextPiece.shape) {
      minX = Math.min(minX, col);
      maxX = Math.max(maxX, col);
      minY = Math.min(minY, row);
      maxY = Math.max(maxY, row);
    }

    const offsetX = (4 - (maxX - minX + 1)) / 2;
    const offsetY = (4 - (maxY - minY + 1)) / 2;

    for (const [row, col] of nextPiece.shape) {
      const x = (col - minX + offsetX) * CELL_SIZE;
      const y = (row - minY + offsetY) * CELL_SIZE;

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', CELL_SIZE - 1)
        .attr('height', CELL_SIZE - 1)
        .attr('fill', color)
        .attr('stroke', '#333')
        .attr('stroke-width', 1);
    }

  }, [nextPiece]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      style={{ border: '1px solid #666', borderRadius: '4px' }}
    />
  );
}
