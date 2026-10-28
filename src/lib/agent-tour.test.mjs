import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { createTour, tourTimeline } from './agent-tour.mjs';

describe('tourTimeline', () => {
  it('types the prompt then steps', () => {
    const { typed, steps, next } = tourTimeline('/nearhost add', 70);
    assert.deepEqual(typed[0], [600, '/']);
    assert.deepEqual(typed.at(-1), [1440, '/nearhost add']);
    assert.deepEqual(steps, [
      [1910, 1],
      [3910, 2],
      [6310, 3],
      [6810, 4],
    ]);
    assert.equal(next, 11810);
  });

  it('the slow scenes use their own speed', () => {
    const { steps, next } = tourTimeline('x'.repeat(80), 30);
    assert.equal(steps[0][0], 600 + 80 * 30 + 400);
    assert.equal(next, 600 + 80 * 30 + 10300);
  });
});

describe('createTour', () => {
  const scenes = [
    { prompt: 'ab', perChar: 70 },
    { prompt: 'c', perChar: 30 },
  ];
  let states;
  const render = (state) => states.push(state);
  const last = () => states.at(-1);

  beforeEach(() => {
    states = [];
    mock.timers.enable({ apis: ['setTimeout'] });
  });
  afterEach(() => mock.timers.reset());

  it('does nothing until start', () => {
    createTour({ scenes, render });
    assert.equal(states.length, 0);
  });

  it('play runs the scene and moves on', () => {
    createTour({ scenes, render }).start({ still: false });
    assert.deepEqual(states[0], {
      scene: 0,
      step: 0,
      typed: '',
      playing: true,
      runMs: 740 + 10300,
    });
    mock.timers.tick(600);
    assert.equal(last().typed, 'a');
    mock.timers.tick(740 + 400 - 600);
    assert.equal(last().step, 1);
    assert.equal(last().typed, '');
    mock.timers.tick(10300 - 400);
    assert.equal(last().scene, 1);
    assert.equal(last().step, 0);
    assert.equal(last().playing, true);
  });

  it('loops back to the first scene', () => {
    createTour({ scenes, render }).start({ still: false });
    mock.timers.tick(740 + 10300);
    assert.equal(last().scene, 1);
    mock.timers.tick(630 + 10300);
    assert.equal(last().scene, 0);
  });

  it('show() cancels pending timers', () => {
    const tour = createTour({ scenes, render });
    tour.start({ still: false });
    mock.timers.tick(650);
    tour.show(1);
    assert.deepEqual(last(), { scene: 1, step: 4, typed: '', playing: false, runMs: 0 });
    const count = states.length;
    mock.timers.tick(60000);
    assert.equal(states.length, count);
  });

  it('start with still shows the scene finished', () => {
    createTour({ scenes, render }).start({ still: true, from: 1 });
    assert.equal(states.length, 1);
    assert.deepEqual(last(), { scene: 1, step: 4, typed: '', playing: false, runMs: 0 });
    mock.timers.tick(60000);
    assert.equal(states.length, 1);
  });

  it('toggle pauses and resumes the current scene', () => {
    const tour = createTour({ scenes, render });
    tour.start({ still: false });
    tour.toggle();
    assert.equal(last().scene, 0);
    assert.equal(last().step, 4);
    assert.equal(last().playing, false);
    tour.toggle();
    assert.equal(last().scene, 0);
    assert.equal(last().step, 0);
    assert.equal(last().playing, true);
  });

  it('show wraps negative indices', () => {
    const tour = createTour({ scenes: [...scenes, { prompt: 'd', perChar: 30 }], render });
    tour.start({ still: true });
    tour.show(-1);
    assert.equal(last().scene, 2);
  });
});
