# Contributing to Two Travel Nuts

## 🚨 CRITICAL: Read This First!

Before making any code changes, especially to build scripts:

### **Required Reading**
1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Configuration management (MUST READ!)
2. **[README.md](README.md)** - Project overview
3. **[lib/config-paths.js](lib/config-paths.js)** - Single source of truth for paths

---

## 📁 Configuration Management Rules

### ✅ The Golden Rule: Single Source of Truth

**ALL file paths and directory structures are defined in ONE place:**

```
lib/config-paths.js
```

### ❌ Never Do This:

```javascript
// ❌ WRONG - Hardcoded path
const tripConfig = 'content/trips/greece/trip.json';
const mainMd = 'content/trips/greece/main.md';
```

### ✅ Always Do This:

```javascript
// ✅ CORRECT - Import from config-paths.js
const CONFIG = require('../lib/config-paths');
const tripConfig = CONFIG.getTripConfigPath('greece');
const mainMd = CONFIG.getTripMainPath('greece');
```

---

## 🔧 Making Structure Changes

### Step-by-Step Process

When you want to change directory structure or file names:

1. **Edit `lib/config-paths.js`** (and ONLY this file)
   ```javascript
   // Example: Renaming trip.json to metadata.json
   TRIP_CONFIG_FILE: 'metadata.json',
   ```

2. **Test everything:**
   ```bash
   npm run validate
   npm run build
   npm run build:smart
   ```

3. **If tests pass:** All scripts are automatically in sync! ✅

4. **Update README.md** if the change is user-facing

5. **Commit with descriptive message**

### Complete Checklist

- [ ] Read `docs/ARCHITECTURE.md` if this is your first time
- [ ] Edit ONLY `lib/config-paths.js` for path changes
- [ ] Run `npm run validate`
- [ ] Run `npm run build`
- [ ] Run `npm run build:smart`
- [ ] Update `README.md` if needed
- [ ] Commit changes

---

## 🆕 Adding New Scripts

When creating a new build/utility script:

```javascript
#!/usr/bin/env node

const fs = require('fs');
// ✅ ALWAYS import from config-paths.js
const CONFIG = require('../lib/config-paths');

// Use CONFIG constants
const { SITE_CONFIG, INDEX_CONFIG, TRIPS_DIR } = CONFIG;

// Use helper functions
const tripPath = CONFIG.getTripConfigPath('mytrip');

// ❌ NEVER hardcode paths
// const tripPath = 'content/trips/mytrip/trip.json'; // WRONG!
```

---

## 📝 Scripts That Use config-paths.js

All of these import from `lib/config-paths.js`:

- `scripts/build.js` - Main build
- `scripts/build-smart.js` - Incremental build
- `scripts/validate.js` - Configuration validation
- `scripts/add-trip.js` - Add new trip CLI

**If you modify any of these, ensure they still use CONFIG imports!**

---

## 🧪 Testing

### Before Committing

Run the full test suite:

```bash
# Validate configuration
npm run validate

# Full build
npm run build

# Smart build
npm run build:smart

# Serve locally and check
npm run serve
```

---

## 🐛 Common Mistakes

### 1. Hardcoding Paths
```javascript
// ❌ WRONG
const trips = 'content/trips';
const tripConfig = `${trips}/${id}/trip.json`;
```

```javascript
// ✅ CORRECT
const CONFIG = require('../lib/config-paths');
const tripConfig = CONFIG.getTripConfigPath(id);
```

### 2. Not Testing After Changes
Always run `npm run validate && npm run build` after path changes!

### 3. Updating Paths in Multiple Places
Only edit `lib/config-paths.js`. Never update paths in individual scripts.

---

## 📚 Architecture

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for:
- Why we use centralized config
- How the system works
- Examples of safe refactoring
- Detailed explanation of helpers

---

## 💡 Why This Matters

**The Problem We Solved:**

Before centralization, when we moved from `config/trips/` to `content/trips/`:
- ❌ `build.js` had hardcoded paths
- ❌ `validate.js` had different paths
- ❌ Scripts fell out of sync
- ❌ Build broke

**The Solution:**

- ✅ Single source of truth: `lib/config-paths.js`
- ✅ All scripts import from one place
- ✅ Change paths in ONE file, all scripts adapt
- ✅ Never falls out of sync

---

## 🤝 Questions?

- Check `docs/ARCHITECTURE.md` first
- Check `lib/config-paths.js` for current path definitions
- Open an issue on GitHub

---

**Thank you for contributing and following these guidelines!** 🎉
