import assert from 'node:assert/strict';

export const meta = {
  id: 'typescript-first-element',
  title: 'TypeScript: first<T>(arr) returns first element',
  tests_total: 3
};

export const tests = [
  {
    name: 'exports first()',
    run: async (solution) => {
      assert.equal(typeof solution.first, 'function');
    }
  },
  {
    name: 'returns the first element',
    run: async (solution) => {
      assert.equal(solution.first([1, 2, 3]), 1);
      assert.equal(solution.first(['a', 'b']), 'a');
    }
  },
  {
    name: 'returns undefined for empty array',
    run: async (solution) => {
      assert.equal(solution.first([]), undefined);
    }
  }
];

