import { url } from '../../../lib/url';

// The agent gallery's scenes, in the order the tour plays them. Each one shows one Nearhost
// feature in a different coding agent; the agent is named only inside its scene.
export interface Scene {
  id: 'claude' | 'codex' | 'qwen';
  title: string;
  tag: string;
  caption: string;
  link: { text: string; href: string };
  prompt: string;
  perChar: number;
}

const guide = '/docs/getting-started/use-a-coding-agent/';

export const scenes: Scene[] = [
  {
    id: 'claude',
    title: 'Add this project',
    tag: '/nearhost add',
    caption:
      'Ask for /nearhost add. Nearhost opens the add form on your laptop, already filled in from the project’s .env, Compose and Vite config, and the agent gets the address once you save it.',
    link: { text: 'Use a coding agent', href: url(guide) },
    prompt: '/nearhost add',
    perChar: 70,
  },
];
