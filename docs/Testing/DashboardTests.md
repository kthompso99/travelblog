# Audit Dashboard Testing

## What These Tests Catch

The `test-audit-dashboard.js` test suite validates the frontend JavaScript in the audit-runner dashboard. These tests would have caught the recent bugs:

### Bug 1: Infinite Recursion in `getProviderLabel()`
**Symptom:** "Maximum call stack size exceeded" error, provider boxes disappear

**Root cause:**
```javascript
function getProviderLabel(provider) {
  return getProviderLabel(provider);  // ❌ Calls itself infinitely
}
```

**Test that catches this:**
```javascript
// Test 1: Function completes without errors
const result = getProviderLabel("opus");
assert(result === "Opus", "getProviderLabel('opus') returns 'Opus'");

// Test 2: Function completes quickly (not stuck in infinite loop)
const start = Date.now();
getProviderLabel("opus");
const duration = Date.now() - start;
assert(duration < 100, "Function completes in <100ms");
```

### Bug 2: Incorrect Method Call
**Symptom:** TypeError when trying to call non-existent method on message object

**Root cause:**
```javascript
// ❌ Wrong: message doesn't have a getProviderLabel method
if (titleText.includes(message.getProviderLabel(provider))) {

// ✅ Correct: getProviderLabel is a standalone function
if (titleText.includes(getProviderLabel(message.provider))) {
```

**Test that catches this:**
- Page load test captures console errors
- Any TypeError would be caught and reported

### Bug 3: Provider Cards Not Rendering
**Symptom:** Empty dashboard, no provider selection boxes

**Root cause:** JavaScript errors prevent UI initialization

**Test that catches this:**
```javascript
const providerCards = await page.$$(".provider-card");
assert(providerCards.length > 0, "Provider cards rendered");

const displayedLabels = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll(".provider-card"));
  return cards.map(card => card.textContent);
});
const hasOpusLabel = displayedLabels.some(text => text.includes("Opus"));
assert(hasOpusLabel, "Opus label displays correctly");
```

## Running the Tests

### Option 1: Manual Test (Server Already Running)
```bash
# Terminal 1: Start audit server
npm run audit-dash

# Terminal 2: Run tests
node scripts/test/test-audit-dashboard.js
```

### Option 2: As Part of Full Test Suite
```bash
# Start audit server first
npm run audit-dash

# In another terminal, run all tests
npm test
```

**Note:** If the audit server isn't running, the dashboard tests will skip gracefully with a message.

## Test Coverage

The dashboard tests validate:

1. **Page Loads Without Errors**
   - No JavaScript exceptions
   - No infinite recursion
   - No "Maximum call stack size exceeded" errors

2. **Helper Functions Work Correctly**
   - `getProviderLabel('opus')` returns `'Opus'`
   - `getProviderLabel('gpt')` returns `'GPT'`
   - Function completes in < 100ms (detects infinite loops)

3. **UI Renders Correctly**
   - Provider cards appear in the DOM
   - Labels display correctly
   - No visual regressions

4. **WebSocket Initializes**
   - Connection establishes without errors
   - No console warnings about failed connections

## Future Enhancements

Additional tests that could be added:

1. **Button Click Tests**
   - Test "Run Audit" button spawns correct API call
   - Test "Stop Audit" button kills process
   - Test modal dialogs open/close correctly

2. **State Management Tests**
   - Test that running audits update UI correctly
   - Test that WebSocket messages update state
   - Test that multiple providers can run simultaneously

3. **Integration Tests**
   - Test full audit workflow: click button → see progress → see results
   - Test commit workflow: click commit → see success message
   - Test rankings modal: click rank → see scores displayed

4. **Accessibility Tests**
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test ARIA labels

5. **Performance Tests**
   - Test dashboard loads in < 2 seconds
   - Test that long-running audits don't block UI
   - Test memory usage during extended sessions

## Best Practices

When modifying `audit-runner.html`:

1. **Run tests before committing:** Always run `npm test` after changes
2. **Test with server running:** Start `npm run audit-dash` during development
3. **Check browser console:** Look for any JavaScript errors during manual testing
4. **Test in multiple browsers:** Chrome, Firefox, Safari all behave slightly differently
5. **Use helper functions:** Centralize repeated logic (like `getProviderLabel()`) to avoid duplication

## CI Integration

To run dashboard tests in CI:

```yaml
# .github/workflows/test.yml
- name: Start audit server
  run: npm run audit-dash &

- name: Wait for server
  run: sleep 5

- name: Run all tests
  run: npm test

- name: Stop audit server
  run: pkill -f audit-server
```

Currently skipped in CI because the audit server requires content files. Future work: add minimal test fixtures.
