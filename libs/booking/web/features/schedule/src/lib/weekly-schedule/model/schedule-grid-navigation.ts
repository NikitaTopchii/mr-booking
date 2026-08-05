export interface GridCellCoordinate {
  readonly column: number;
  readonly row: number;
  readonly disabled: boolean;
}

export type GridDirection = 'up' | 'down' | 'left' | 'right' | 'home' | 'end';

export function findGridTarget(
  cells: readonly GridCellCoordinate[],
  current: GridCellCoordinate,
  direction: GridDirection,
): GridCellCoordinate | undefined {
  const eligible = cells.filter((cell) => !cell.disabled);
  if (direction === 'up' || direction === 'down') {
    const step = direction === 'up' ? -1 : 1;
    return eligible
      .filter((cell) => cell.column === current.column)
      .sort((left, right) => left.row - right.row)
      .find((cell) =>
        step < 0 ? cell.row < current.row : cell.row > current.row,
      );
  }
  if (direction === 'left' || direction === 'right') {
    const step = direction === 'left' ? -1 : 1;
    const targetColumn = current.column + step;
    const sameRow = eligible.find(
      (cell) => cell.column === targetColumn && cell.row === current.row,
    );
    if (sameRow) return sameRow;
    return eligible
      .filter((cell) => cell.column === targetColumn)
      .sort(
        (left, right) =>
          Math.abs(left.row - current.row) - Math.abs(right.row - current.row),
      )[0];
  }
  const columnCells = eligible
    .filter((cell) => cell.column === current.column)
    .sort((left, right) => left.row - right.row);
  return direction === 'home' ? columnCells[0] : columnCells.at(-1);
}
