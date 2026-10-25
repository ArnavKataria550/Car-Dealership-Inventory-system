// Runs the backend and frontend test suites with coverage and writes a test
// report to docs/test-report/. Usage: npm run test:report
// The backend suite needs the local test database (see README: Getting started).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'test-report');
mkdirSync(outDir, { recursive: true });

const SUITES = [
  {
    name: 'Backend',
    workspace: 'backend',
    kind: 'API: unit + integration tests against PostgreSQL',
  },
  {
    name: 'Frontend',
    workspace: 'frontend',
    kind: 'React components and user flows (Testing Library + MSW)',
  },
];

// Vitest colours its output; strip ANSI codes and the local checkout path.
const clean = (text) =>
  stripVTControlCharacters(text)
    .replaceAll(root.replaceAll('\\', '/'), '<repo>')
    .replaceAll(root, '<repo>');

const results = SUITES.map((suite) => {
  const cwd = join(root, suite.workspace);
  // Relative to the workspace: the absolute path may contain spaces, which the shell would split.
  const jsonName = `../docs/test-report/${suite.workspace}-results.tmp.json`;
  const jsonFile = join(cwd, jsonName);
  console.log(`Running ${suite.name} tests…`);

  // A single command string: the shell is needed on Windows to resolve npx, and every
  // part is a fixed value from this script, so nothing needs escaping.
  const command = `npx vitest run --coverage --reporter=verbose --reporter=json --outputFile.json=${jsonName}`;
  const run = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  writeFileSync(join(outDir, `${suite.workspace}-tests.txt`), clean(run.stdout + run.stderr));

  const json = JSON.parse(readFileSync(jsonFile, 'utf8'));
  rmSync(jsonFile);
  const coverage = JSON.parse(
    readFileSync(join(cwd, 'coverage', 'coverage-summary.json'), 'utf8'),
  ).total;

  return { ...suite, exitCode: run.status, json, coverage };
});

const pct = (metric) => `${metric.pct.toFixed(1)}%`;
const duration = (json) => {
  const ends = json.testResults.map((file) => file.endTime);
  return `${((Math.max(...ends) - json.startTime) / 1000).toFixed(1)} s`;
};

const summaryRows = results.map(
  ({ name, json }) =>
    `| ${name} | ${json.numTotalTestSuites === 0 ? 0 : json.testResults.length} | ${json.numTotalTests} | ${json.numPassedTests} | ${json.numFailedTests} | ${duration(json)} |`,
);
const coverageRows = results.map(
  ({ name, coverage }) =>
    `| ${name} | ${pct(coverage.lines)} | ${pct(coverage.statements)} | ${pct(coverage.functions)} | ${pct(coverage.branches)} |`,
);
const totalTests = results.reduce((sum, r) => sum + r.json.numTotalTests, 0);
const totalPassed = results.reduce((sum, r) => sum + r.json.numPassedTests, 0);

const report = `# Test Report

Generated on ${new Date().toISOString().slice(0, 10)} by \`npm run test:report\`
(${totalPassed} of ${totalTests} tests passing).

## Results

| Suite | Test files | Tests | Passed | Failed | Duration |
| ----- | ---------- | ----- | ------ | ------ | -------- |
${summaryRows.join('\n')}

## Coverage

| Suite | Lines | Statements | Functions | Branches |
| ----- | ----- | ---------- | --------- | -------- |
${coverageRows.join('\n')}

The backend's CI job fails if its coverage drops below 90% lines/statements/functions
or 85% branches.

## What is tested

${results.map(({ name, kind }) => `- **${name}**: ${kind}`).join('\n')}

## Full output

Every test case, as printed by Vitest:

${results.map(({ name, workspace }) => `- [${name} test output](${workspace}-tests.txt)`).join('\n')}

To regenerate this report, start PostgreSQL with the test database configured (see the
main README) and run \`npm run test:report\` from the repository root.
`;

writeFileSync(join(outDir, 'README.md'), report);
// Format the generated Markdown so a regenerated report never fails the lint job.
spawnSync('npx prettier --write docs/test-report/README.md', { cwd: root, shell: true });
console.log(`Report written to docs/test-report/ (${totalPassed}/${totalTests} passing).`);

const failed = results.filter((r) => r.exitCode !== 0);
if (failed.length > 0) {
  console.error(`Test failures in: ${failed.map((r) => r.name).join(', ')}`);
  process.exit(1);
}
