import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const distPath = path.resolve(__dirname, '../dist');
const port = process.env.PORT || 4173;

app.use(express.static(distPath, { maxAge: '1h' }));

app.use('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Thinking Room server running on http://localhost:${port}`);
});
