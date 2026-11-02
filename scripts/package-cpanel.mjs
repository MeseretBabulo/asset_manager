// Builds release/asset_manager-cpanel.zip — upload & extract it in cPanel.
// Usage: npm run package:cpanel
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL = path.join(ROOT, 'release');
const OUT = path.join(REL, 'asset_manager');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) throw new Error('Run "vite build" first (npm run package:cpanel does it).');

fs.rmSync(REL, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'server'), { recursive: true });

// Server as .mjs so it is ESM regardless of package.json "type"
fs.copyFileSync(path.join(ROOT, 'server', 'index.js'), path.join(OUT, 'server', 'index.mjs'));
fs.copyFileSync(path.join(ROOT, 'cpanel', 'app.js'), path.join(OUT, 'app.js'));
fs.copyFileSync(path.join(ROOT, 'cpanel', 'backup.mjs'), path.join(OUT, 'backup.mjs'));
fs.copyFileSync(path.join(ROOT, 'deploy', 'CPANEL.md'), path.join(OUT, 'CPANEL.md'));
fs.cpSync(path.join(ROOT, 'dist'), path.join(OUT, 'dist'), { recursive: true });

// Production-only package.json (no build tools needed on the server)
fs.writeFileSync(
  path.join(OUT, 'package.json'),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      main: 'app.js',
      scripts: { start: 'node app.js', backup: 'node backup.mjs' },
      engines: pkg.engines,
      dependencies: pkg.dependencies,
    },
    null,
    2,
  ) + '\n',
);

execFileSync('zip', ['-qr', 'asset_manager-cpanel.zip', 'asset_manager'], { cwd: REL, stdio: 'inherit' });
console.log('Created', path.join(REL, 'asset_manager-cpanel.zip'));
