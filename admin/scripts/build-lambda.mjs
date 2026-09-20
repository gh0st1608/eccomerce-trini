import { execFileSync, execSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const distDirectory = join(projectRoot, 'dist');
const stagingDirectory = mkdtempSync(join(tmpdir(), 'admin-lambda-'));

mkdirSync(distDirectory, { recursive: true });

try {
  cpSync(join(projectRoot, 'src'), join(stagingDirectory, 'src'), {
    recursive: true,
  });
  cpSync(
    join(projectRoot, 'package.json'),
    join(stagingDirectory, 'package.json')
  );
  cpSync(
    join(projectRoot, 'package-lock.json'),
    join(stagingDirectory, 'package-lock.json')
  );

  execSync('npm ci', {
    cwd: stagingDirectory,
    env: { ...process.env, HUSKY: '0' },
    stdio: 'inherit',
  });
  execSync('npm prune --omit=dev --ignore-scripts', {
    cwd: stagingDirectory,
    stdio: 'inherit',
  });
  execFileSync(
    'tar',
    [
      '-a',
      '-c',
      '-f',
      join(distDirectory, 'lambda.zip'),
      'src',
      'node_modules',
      'package.json',
      'package-lock.json',
    ],
    { cwd: stagingDirectory, stdio: 'inherit' }
  );
} finally {
  rmSync(stagingDirectory, { recursive: true, force: true });
}