# Test Report

Generated on 2026-10-25 by `npm run test:report`
(383 of 383 tests passing).

## Results

| Suite    | Test files | Tests | Passed | Failed | Duration |
| -------- | ---------- | ----- | ------ | ------ | -------- |
| Backend  | 24         | 202   | 202    | 0      | 19.7 s   |
| Frontend | 23         | 181   | 181    | 0      | 22.7 s   |

## Coverage

| Suite    | Lines | Statements | Functions | Branches |
| -------- | ----- | ---------- | --------- | -------- |
| Backend  | 99.6% | 99.0%      | 100.0%    | 96.7%    |
| Frontend | 96.8% | 96.4%      | 95.4%     | 93.2%    |

The backend's CI job fails if its coverage drops below 90% lines/statements/functions
or 85% branches.

## What is tested

- **Backend**: API: unit + integration tests against PostgreSQL
- **Frontend**: React components and user flows (Testing Library + MSW)

## Full output

Every test case, as printed by Vitest:

- [Backend test output](backend-tests.txt)
- [Frontend test output](frontend-tests.txt)

To regenerate this report, start PostgreSQL with the test database configured (see the
main README) and run `npm run test:report` from the repository root.
