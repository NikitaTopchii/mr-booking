import {
  findGridTarget,
  type GridCellCoordinate,
} from './schedule-grid-navigation';

const cells: readonly GridCellCoordinate[] = [
  { column: 0, row: 0, disabled: false },
  { column: 0, row: 1, disabled: true },
  { column: 0, row: 2, disabled: false },
  { column: 1, row: 0, disabled: false },
  { column: 1, row: 1, disabled: false },
  { column: 1, row: 2, disabled: false },
  { column: 2, row: 0, disabled: true },
  { column: 2, row: 1, disabled: false },
  { column: 2, row: 2, disabled: false },
];

describe('findGridTarget', () => {
  it('moves vertically within the current day and skips disabled slots', () => {
    const current = cells[0];
    if (!current) throw new Error('Expected a grid cell');

    expect(findGridTarget(cells, current, 'down')).toEqual({
      column: 0,
      row: 2,
      disabled: false,
    });
    expect(
      findGridTarget(cells, { column: 0, row: 2, disabled: false }, 'up'),
    ).toEqual(current);
  });

  it('moves horizontally by column while preserving the row when possible', () => {
    expect(
      findGridTarget(cells, { column: 0, row: 2, disabled: false }, 'right'),
    ).toEqual({ column: 1, row: 2, disabled: false });
    expect(
      findGridTarget(cells, { column: 1, row: 1, disabled: false }, 'right'),
    ).toEqual({ column: 2, row: 1, disabled: false });
  });

  it('keeps focus inside the visible grid at boundaries', () => {
    expect(
      findGridTarget(cells, { column: 0, row: 0, disabled: false }, 'left'),
    ).toBeUndefined();
    expect(
      findGridTarget(cells, { column: 2, row: 2, disabled: false }, 'right'),
    ).toBeUndefined();
    expect(
      findGridTarget(cells, { column: 1, row: 1, disabled: false }, 'home'),
    ).toEqual({ column: 1, row: 0, disabled: false });
    expect(
      findGridTarget(cells, { column: 1, row: 1, disabled: false }, 'end'),
    ).toEqual({ column: 1, row: 2, disabled: false });
  });
});
