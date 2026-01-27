import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function sizeOfRange(r) {
  return Math.max(0, Number(r?.max ?? 0) - Number(r?.min ?? 0));
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function makeQuestions(target) {
  const offsets = [-0.12, -0.04, 0.04, 0.12];
  return offsets.map((o) => ({ difficulty: clamp01(target + o) }));
}

function simulateResponses(ability, questions) {
  return questions.map((q) => ability >= q.difficulty);
}

describe('learn/adaptive-ability-assessment', () => {
  it('converges within <= 5 rounds for a simulated ability (rules-only)', async () => {
    const {
      createInitialAdaptiveState,
      calculateTargetDifficulty,
      analyzeResponses,
      applyRound
    } = await import('../dist/learn/adaptive-ability-assessment.js');

    const ability = 0.6;
    let state = createInitialAdaptiveState({ minRounds: 3, maxRounds: 5, targetConfidence: 0.85, jitter: 0 });

    while (true) {
      const target = calculateTargetDifficulty(state.range, { jitter: state.jitter });
      const questions = makeQuestions(target);
      const responses = simulateResponses(ability, questions);
      const rr = analyzeResponses(responses, questions);

      const step = applyRound({ state, targetDifficulty: target, roundResult: rr, questionCount: questions.length });
      state = step.updated_state;
      if (!step.should_continue) break;
      assert.ok(state.rounds.length <= 5);
    }

    assert.ok(state.rounds.length <= 5);
    assert.ok(sizeOfRange(state.range) <= 0.1 || state.confidence >= 0.85);
  });

  it('expands upper bound on all-correct when range is likely too easy', async () => {
    const { applyRound, createInitialAdaptiveState } = await import('../dist/learn/adaptive-ability-assessment.js');
    const state = { ...createInitialAdaptiveState({ jitter: 0 }), range: { min: 0, max: 0.4 }, expandCount: 0 };
    const rr = { correct_ratio: 1, score_mean: 1, consistency: 1 };

    const step = applyRound({ state, targetDifficulty: 0.2, roundResult: rr, questionCount: 4 });
    assert.equal(step.updated_state.hardNextRound, true);
    assert.ok(step.updated_state.expandCount >= 1);
    assert.ok(step.updated_state.range.max > 0.4);
  });

  it('expands lower bound on all-wrong when range is likely too hard', async () => {
    const { applyRound, createInitialAdaptiveState } = await import('../dist/learn/adaptive-ability-assessment.js');
    const state = { ...createInitialAdaptiveState({ jitter: 0 }), range: { min: 0.6, max: 1 }, expandCount: 0 };
    const rr = { correct_ratio: 0, score_mean: 0, consistency: 1 };

    const step = applyRound({ state, targetDifficulty: 0.8, roundResult: rr, questionCount: 4 });
    assert.equal(step.updated_state.hardNextRound, true);
    assert.ok(step.updated_state.expandCount >= 1);
    assert.ok(step.updated_state.range.min < 0.6);
  });

  it('flags inconsistency when answers violate difficulty ordering', async () => {
    const { analyzeResponses, detectMisjudgment, createInitialAdaptiveState } = await import('../dist/learn/adaptive-ability-assessment.js');
    const state = createInitialAdaptiveState({ jitter: 0 });

    const questions = [{ difficulty: 0.2 }, { difficulty: 0.4 }, { difficulty: 0.6 }, { difficulty: 0.8 }];
    // Wrong on easy, right on hard -> maximally inconsistent for monotonicity.
    const responses = [false, false, true, true];
    const rr = analyzeResponses(responses, questions);

    assert.ok(rr.consistency < 0.3);
    const mis = detectMisjudgment(rr, state);
    assert.equal(mis?.type, 'inconsistent');
  });
});

