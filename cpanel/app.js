// cPanel "Setup Node.js App" entry point (Phusion Passenger).
// Startup file in cPanel: app.js
// This file is CommonJS on purpose: Passenger loads it with require().

try {
  require('node:sqlite');
} catch (e) {
  console.error(
    `Asset Manager needs Node.js 22.13 or newer (this server has ${process.versions.node}).\n` +
      'Fix: cPanel > Setup Node.js App > choose the newest Node.js 22.x, or add the environment variable\n' +
      '     NODE_OPTIONS = --experimental-sqlite   then click Restart.',
  );
  process.exit(1);
}

import('./server/index.mjs').catch((err) => {
  console.error('Asset Manager failed to start:', err);
  process.exit(1);
});
