import sharp from 'sharp';

// Hex values mirror src/styles/tokens.css; this script runs in Node and cannot read CSS tokens.
const sans = 'system-ui, -apple-system, Helvetica, Arial, sans-serif';
const mono = 'Menlo, Consolas, monospace';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0F1210"/>
  <g transform="translate(72 64) scale(0.6875)">
    <path d="M14 56V32a18 18 0 0 1 36 0v24" fill="none" stroke="#D6F26B" stroke-width="11" stroke-linecap="round"/>
    <circle cx="32" cy="48" r="6" fill="#ECEFE8"/>
  </g>
  <text x="130" y="96" font-family="${sans}" font-size="36" font-weight="700" fill="#ECEFE8">nearhost</text>
  <text x="72" y="300" font-family="${sans}" font-size="84" font-weight="700" fill="#ECEFE8">Run it anywhere.</text>
  <text x="72" y="380" font-family="${sans}" font-size="84" font-weight="700" fill="#ECEFE8">Open it <tspan fill="#D6F26B">here</tspan>.</text>
  <text x="72" y="450" font-family="${sans}" font-size="24" fill="#C5CCC6">Remote dev servers at https://myapp.test, over the SSH you already have.</text>
  <text x="72" y="570" font-family="${mono}" font-size="17" fill="#ECEFE8">$ curl -fsSL https://nearhost.dev/install.sh | sh</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
