import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

execSync('npm prune --omit=dev', { stdio: 'inherit' });

execSync(
  'tar -a -c -f dist/lambda.zip src node_modules package.json package-lock.json',
  { stdio: 'inherit' }
);