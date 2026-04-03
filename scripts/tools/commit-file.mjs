// ==============================
// Commit File with Validation
// ==============================
//
// Atomic commit operation with pre-commit checks
// Usage: npm run commit -- greece/milos --message "Content(milos): 8.75=>8.80" [--push] [--dry-run]
//

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// ==============================
// Commit File
// ==============================

async function commitFile(trip, file, message, options = {}) {
  const { push = false, dryRun = false } = options;

  // Build file path
  const filePath = path.join("content/trips", trip, `${file}.md`);

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  console.log(`[COMMIT] Starting commit for ${trip}/${file}...`);

  if (dryRun) {
    console.log(`[COMMIT] DRY RUN MODE - No changes will be made`);
  }

  // Step 1: Run typography normalization
  console.log(`[COMMIT] Normalizing typography...`);
  const normalizeCmd = `npm run normalize -- "${filePath}"`;
  if (dryRun) {
    console.log(`[COMMIT] Would run: ${normalizeCmd}`);
  } else {
    execSync(normalizeCmd, {
      encoding: "utf-8",
      stdio: "pipe"
    });
  }

  // Step 2: Stage the markdown file
  console.log(`[COMMIT] Staging ${filePath}...`);
  if (!dryRun) {
    execSync(`git add "${filePath}"`, { encoding: "utf-8" });
  }

  // Step 3: Parse markdown for image references and stage uncommitted images
  console.log(`[COMMIT] Checking for uncommitted images...`);
  const content = fs.readFileSync(filePath, "utf-8");
  const imageRegex = /!\[.*?\]\((images\/[^)]+)\)/g;
  const images = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  let imageCount = 0;
  for (const imagePath of images) {
    const fullImagePath = path.join("content/trips", trip, imagePath);

    if (!fs.existsSync(fullImagePath)) {
      console.log(`[COMMIT] Warning: Referenced image not found: ${imagePath}`);
      continue;
    }

    try {
      // Check git status: modified files (M) and untracked files (??)
      const statusOutput = execSync(
        `git status --porcelain "${fullImagePath}"`,
        { encoding: "utf-8" }
      ).trim();

      if (statusOutput) {
        // File is either modified or untracked - stage it
        const statusCode = statusOutput.substring(0, 2);
        const fileType = statusCode.includes('?') ? 'new' : 'modified';
        console.log(`[COMMIT] Staging ${fileType} image: ${imagePath}`);

        if (!dryRun) {
          execSync(`git add "${fullImagePath}"`, { encoding: "utf-8" });
        }
        imageCount++;
      }
    } catch (err) {
      console.log(`[COMMIT] Error checking image status: ${imagePath}`, err.message);
    }
  }

  if (imageCount > 0) {
    console.log(`[COMMIT] Staged ${imageCount} image(s)`);
  }

  // Step 4: Validate image references
  console.log(`[COMMIT] Validating image references...`);
  try {
    execSync(`node scripts/validate-images.js "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe"
    });
  } catch (err) {
    throw new Error(`Image validation failed: ${err.message}`);
  }

  // Step 5: Commit staged files (pre-commit hook runs automatically)
  if (dryRun) {
    console.log(`[COMMIT] Would commit with message: "${message}"`);
    console.log(`[COMMIT] DRY RUN - No commit made`);
    return { commitHash: null, pushedRemote: false, dryRun: true };
  }

  console.log(`[COMMIT] Committing with message: "${message}"`);
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    encoding: "utf-8",
    stdio: "pipe"
  });

  // Step 6: Get commit hash
  const commitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf-8"
  }).trim();

  console.log(`[COMMIT] Success! Commit hash: ${commitHash}`);

  // Step 7: Optional push
  let pushedRemote = false;
  if (push) {
    console.log(`[PUSH] Pushing to remote...`);
    try {
      execSync("git push", {
        encoding: "utf-8",
        stdio: "pipe"
      });
      console.log(`[PUSH] Pushed to origin/main`);
      pushedRemote = true;
    } catch (err) {
      console.error(`[PUSH] Failed: ${err.message}`);
      console.error(`[PUSH] Commit succeeded locally (${commitHash}), but push failed`);
      throw new Error(`Push failed: ${err.message}`);
    }
  }

  return { commitHash, pushedRemote, dryRun: false };
}

// ==============================
// CLI
// ==============================

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Usage: npm run commit -- <trip>/<file> --message "..." [--push] [--dry-run]');
  console.error('');
  console.error('Examples:');
  console.error('  npm run commit -- greece/milos --message "Content(milos): 8.75=>8.80"');
  console.error('  npm run commit -- greece/milos --message "Content(milos): 8.75=>8.80" --push');
  console.error('  npm run commit -- greece/milos --message "test commit" --dry-run');
  process.exit(1);
}

// Parse trip/file
const tripFile = args[0];
const parts = tripFile.split('/');
if (parts.length !== 2) {
  console.error('Error: First argument must be in format <trip>/<file>');
  console.error('Example: greece/milos');
  process.exit(1);
}

const trip = parts[0];
const file = parts[1];

// Parse flags
const messageIdx = args.indexOf("--message");
if (messageIdx === -1) {
  console.error('Error: --message flag is required');
  process.exit(1);
}
const message = args[messageIdx + 1];
if (!message) {
  console.error('Error: --message value is required');
  process.exit(1);
}

const push = args.includes("--push");
const dryRun = args.includes("--dry-run");

try {
  const result = await commitFile(trip, file, message, { push, dryRun });

  if (result.dryRun) {
    console.log('\n✓ Dry run completed - no changes made');
  } else if (result.pushedRemote) {
    console.log(`\n✓ Committed and pushed successfully (${result.commitHash})`);
  } else {
    console.log(`\n✓ Committed successfully (${result.commitHash})`);
  }
} catch (err) {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
}

// Export for use by API server
export { commitFile };
