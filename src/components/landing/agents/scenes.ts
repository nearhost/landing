import { url } from '../../../lib/url';

// The agent gallery's scenes, in the order the tour plays them. Each one shows one Nearhost
// feature in a different coding agent; the agent is named only inside its scene.
//
// A new scene needs three things: an entry here, a component in this folder built from Scene
// (its two columns), Terminal and NearhostWindow, and one line in `components` in Agents.astro.
// Its component marks what waits for a step with these classes, which the gallery's data-step
// (0 while typing, then 1 to 4) shows or hides:
//   .from-1 .from-2 .from-4  shown from that step on      .at-1  step 1 only
//   .at-2-3                  steps 2 and 3                 .busy  steps 1 to 3
//   .prompt   Nearhost's question: fades in at 2, dims to 0.45 at 4
//   .browser  the laptop's browser: fades in at 4
//   .key      the answer key, drawn pressed at 3
// and puts exactly one [data-typed] in its prompt line, for the typed text.
export interface Scene {
  id: 'claude' | 'codex' | 'qwen';
  title: string;
  tag: string;
  caption: string;
  link: { text: string; href: string };
  prompt: string;
  perChar: number;
}

const guide = '/docs/coding-agents/';

export const scenes: Scene[] = [
  {
    id: 'claude',
    title: 'Add this project',
    tag: '/nearhost add',
    caption:
      'Ask for /nearhost add. Nearhost opens the add form on your laptop, already filled in from the project’s .env, Compose and Vite config, and the agent gets the address once you save it.',
    link: { text: 'Add a project', href: url(guide + 'add-a-project/') },
    prompt: '/nearhost add',
    perChar: 70,
  },
  {
    id: 'codex',
    title: 'Open a browser preview',
    tag: 'New in 0.10',
    caption:
      'When an agent on a server starts a preview, such as a brainstorming page, it asks Nearhost to forward that one port. Press y and the preview opens in your laptop’s browser until the session ends.',
    link: {
      text: 'Browser previews from a server',
      href: url(guide + 'browser-previews/'),
    },
    prompt: 'Brainstorm three layouts for the pricing page and show them to me in the browser',
    perChar: 30,
  },
];
