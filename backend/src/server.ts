import { createApp } from './app.js';

// Replaced by validated config in src/config/env.ts once Prisma is added.
const port = Number(process.env.PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
