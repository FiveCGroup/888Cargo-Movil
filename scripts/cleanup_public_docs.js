import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, '888Cris-MERN', 'client', 'public');

const targets = [
  path.join(publicDir, 'backend'),
  path.join(publicDir, 'web'),
  path.join(publicDir, 'mobile'),
  path.join(publicDir, 'tutoriales'),
  path.join(publicDir, 'instalación.html'),
  path.join(publicDir, 'index_preview.html')
];

console.log('Public dir:', publicDir);
for (const t of targets) {
  try {
    if (fs.existsSync(t)) {
      fs.rmSync(t, { recursive: true, force: true });
      console.log('Removed:', t);
    } else {
      console.log('Not found (skipped):', t);
    }
  } catch (err) {
    console.error('Error removing', t, err.message);
  }
}

console.log('Cleanup completed.');
