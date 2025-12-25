# Testing

This project uses [Vitest](https://vitest.dev/) for testing.

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Structure

- `tests/__mocks__/obsidian.ts` - Mock implementations of Obsidian API classes
- `tests/NoteReviewData.test.ts` - Tests for data structures and defaults
- `tests/settings.test.ts` - Tests for settings defaults and interface
- `tests/main.test.ts` - Tests for plugin core functionality

## What's Tested

### NoteReviewData (9 tests)
- Default values and structure
- Data interface validation
- Dynamic note addition

### Settings (5 tests)
- Default settings values
- API key handling
- Settings object spreading

### Main Plugin (13 tests)
- `updateReview()` - Updates review data with ease and timestamp
- `markAsReviewed()` - Updates both lastReviewed and lastSeen
- `getOldestNote()` - Finds oldest note by lastSeen timestamp
  - Handles empty note list
  - Returns correct oldest note
  - Excludes specified notes
  - Handles notes without review data
- `abortCurrentRequest()` - Aborts active AI requests

## Writing New Tests

1. Create a new test file in the `tests/` directory with `.test.ts` extension
2. Import the modules you want to test
3. Use `describe` and `it` blocks to organize tests
4. Run tests with `npm test`

Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Mocking Obsidian API

The Obsidian API is mocked in `tests/__mocks__/obsidian.ts`. If you need additional Obsidian classes or methods, add them to this file.

## Coverage

To generate test coverage report:

```bash
npm test -- --coverage
```

This will create a `coverage/` directory with an HTML report.

