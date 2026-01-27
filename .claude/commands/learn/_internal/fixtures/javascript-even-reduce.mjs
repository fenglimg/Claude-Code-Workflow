import assert from 'node:assert/strict';

export const meta = {
  id: 'javascript-even-reduce',
  title: 'JavaScript: evenNumbers(arr) filters evens using reduce',
  tests_total: 3
};

export const tests = [
  {
    name: 'exports evenNumbers()',
    run: async (solution) => {
      assert.equal(typeof solution.evenNumbers, 'function');
    }
  },
  {
    name: 'filters evens (basic)',
    run: async (solution) => {
      assert.deepEqual(solution.evenNumbers([1, 2, 3, 4, 5, 6]), [2, 4, 6]);
    }
  },
  {
    name: 'handles empty array',
    run: async (solution) => {
      assert.deepEqual(solution.evenNumbers([]), []);
    }
  }
];

