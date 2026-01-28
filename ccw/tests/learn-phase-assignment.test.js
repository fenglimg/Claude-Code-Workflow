import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeTopologicalLevels,
  getPhaseNameByNumber,
  assignPhases
} from '../../.claude/commands/learn/_internal/phase-assignment.js';

describe('learn phase assignment (DAG-based)', () => {
  it('computeTopologicalLevels handles a simple DAG', () => {
    const levels = computeTopologicalLevels({
      nodes: ['KP-1', 'KP-2', 'KP-3'],
      edges: [
        { from: 'KP-1', to: 'KP-2' },
        { from: 'KP-1', to: 'KP-3' }
      ]
    });

    assert.deepEqual(levels, { 'KP-1': 0, 'KP-2': 1, 'KP-3': 1 });
  });

  it('computeTopologicalLevels supports multiple roots and joins', () => {
    const levels = computeTopologicalLevels({
      nodes: ['A', 'B', 'C', 'D'],
      edges: [
        { from: 'A', to: 'C' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'D' }
      ]
    });

    assert.equal(levels.A, 0);
    assert.equal(levels.B, 0);
    assert.equal(levels.C, 1);
    assert.equal(levels.D, 2);
  });

  it('getPhaseNameByNumber uses semantic names for <= 4 phases', () => {
    assert.equal(getPhaseNameByNumber(1, 3), 'Foundation');
    assert.equal(getPhaseNameByNumber(2, 3), 'Building');
    assert.equal(getPhaseNameByNumber(3, 3), 'Mastery');

    assert.equal(getPhaseNameByNumber(1, 4), 'Foundation');
    assert.equal(getPhaseNameByNumber(2, 4), 'Building');
    assert.equal(getPhaseNameByNumber(3, 4), 'Advanced');
    assert.equal(getPhaseNameByNumber(4, 4), 'Mastery');
  });

  it('getPhaseNameByNumber uses Phase N for >= 5 phases', () => {
    assert.equal(getPhaseNameByNumber(1, 5), 'Phase 1');
    assert.equal(getPhaseNameByNumber(5, 5), 'Phase 5');
  });

  it('assignPhases assigns 1-based phases and generates metadata', () => {
    const kps = [
      { id: 'KP-1', title: 'a' },
      { id: 'KP-2', title: 'b' },
      { id: 'KP-3', title: 'c' }
    ];

    const { knowledgePoints, phases } = assignPhases(kps, {
      nodes: ['KP-1', 'KP-2', 'KP-3'],
      edges: [
        { from: 'KP-1', to: 'KP-2' },
        { from: 'KP-2', to: 'KP-3' }
      ]
    });

    const byId = Object.fromEntries(knowledgePoints.map((kp) => [kp.id, kp]));
    assert.equal(byId['KP-1'].phase, 1);
    assert.equal(byId['KP-2'].phase, 2);
    assert.equal(byId['KP-3'].phase, 3);

    assert.equal(phases.length, 3);
    assert.equal(phases[0].status, 'active');
    assert.equal(phases[1].status, 'locked');
    assert.equal(phases[2].status, 'locked');
    assert.deepEqual(phases[0].knowledge_point_ids, ['KP-1']);
    assert.deepEqual(phases[1].knowledge_point_ids, ['KP-2']);
    assert.deepEqual(phases[2].knowledge_point_ids, ['KP-3']);
  });

  it('assignPhases caps phase count at 5 for deep graphs', () => {
    const nodes = [];
    const edges = [];
    const kps = [];
    for (let i = 1; i <= 10; i += 1) {
      const id = `KP-${i}`;
      nodes.push(id);
      kps.push({ id });
      if (i > 1) edges.push({ from: `KP-${i - 1}`, to: id });
    }

    const { phases } = assignPhases(kps, { nodes, edges });
    assert.equal(phases.length, 5);
    assert.equal(phases[0].phase_number, 1);
    assert.equal(phases[4].phase_number, 5);
  });
});

