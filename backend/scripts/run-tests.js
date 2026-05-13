const { readdirSync, statSync } = require('fs');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');

function collectTestFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return collectTestFiles(filePath);
    }

    return filePath.endsWith('.test.js') ? [filePath] : [];
  });
}

const testsDirectory = resolve(__dirname, '..', 'tests');
const testFiles = collectTestFiles(testsDirectory);

if (testFiles.length === 0) {
  console.error(`No test files found in ${testsDirectory}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);