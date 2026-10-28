// The agent gallery's self-playing tour: when each scene types and steps, and a controller
// that runs them. Pure (no DOM, timers injectable) so it can be tested without a browser.

const LEAD_MS = 600;

/**
 * @typedef {{ prompt: string, perChar: number }} Scene
 * @typedef {{ scene: number, step: 0|1|2|3|4, typed: string, playing: boolean, runMs: number }} TourState
 */

/**
 * When a scene types its prompt and moves through its steps, in ms from the scene's start.
 * @param {string} prompt
 * @param {number} perChar ms per typed character
 * @returns {{ typed: Array<[number, string]>, steps: Array<[number, 1|2|3|4]>, next: number }}
 */
export function tourTimeline(prompt, perChar) {
  // By grapheme, so an emoji, even one joined from several, types as one character.
  const chars = Array.from(
    new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(prompt),
    (s) => s.segment,
  );
  const typed = /** @type {Array<[number, string]>} */ (
    chars.map((_, k) => [LEAD_MS + k * perChar, chars.slice(0, k + 1).join('')])
  );
  const t = LEAD_MS + chars.length * perChar;
  return {
    typed,
    steps: [
      [t + 400, 1],
      [t + 2400, 2],
      [t + 4800, 3],
      [t + 5300, 4],
    ],
    next: t + 10300,
  };
}

/**
 * @param {object} options
 * @param {Scene[]} options.scenes
 * @param {(state: TourState) => void} options.render called on every change, never before start()
 * @param {(fn: () => void, ms: number) => unknown} [options.setTimer]
 * @param {(id: unknown) => void} [options.clearTimer]
 */
export function createTour({
  scenes,
  render,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(/** @type {any} */ (id)),
}) {
  if (scenes.length === 0) throw new Error('createTour needs at least one scene');
  /** @type {unknown[]} */
  let timers = [];
  let current = 0;
  let playing = false;

  const wrap = (/** @type {number} */ i) => ((i % scenes.length) + scenes.length) % scenes.length;
  const clear = () => {
    timers.forEach(clearTimer);
    timers = [];
  };
  const emit = (/** @type {0|1|2|3|4} */ step, typed = '', runMs = 0) =>
    render({ scene: current, step, typed, playing, runMs });
  const at = (/** @type {number} */ ms, /** @type {() => void} */ fn) =>
    timers.push(setTimer(fn, ms));

  /** @param {number} i */
  function play(i) {
    clear();
    current = wrap(i);
    playing = true;
    const { typed, steps, next } = tourTimeline(scenes[current].prompt, scenes[current].perChar);
    emit(0, '', next);
    for (const [ms, text] of typed) at(ms, () => emit(0, text, next));
    for (const [ms, step] of steps) at(ms, () => emit(step, '', next));
    at(next, () => play(current + 1));
  }

  /** @param {number} i */
  function show(i) {
    clear();
    current = wrap(i);
    playing = false;
    emit(4);
  }

  return {
    /** @param {{ still: boolean, from?: number }} options */
    start({ still, from = 0 }) {
      if (still) show(from);
      else play(from);
    },
    play,
    show,
    toggle() {
      if (playing) show(current);
      else play(current);
    },
    destroy: clear,
  };
}
