import { config } from './src/config.js';
import { createApp } from './src/app.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Server running on ${config.port}`);
});
