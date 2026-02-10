const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// UPDATE THIS to point to your actual Takeout zip file
const ZIP_FILE_PATH = './content/trips/spain-2025/takeout.zip'; 
const OUTPUT_DIR = './content/trips/spain-2025/takeout/test-output';

async function processTakeoutZip() {
    if (!fs.existsSync(ZIP_FILE_PATH)) {
        console.error(`❌ Error: Could not find ${ZIP_FILE_PATH}`);
        return;
    }

    console.log('📦 Opening Takeout ZIP... (this may take a minute)');
    const zip = new AdmZip(ZIP_FILE_PATH);
    const zipEntries = zip.getEntries();
    
    const photos = {};
    const metadata = {};

    // 1. Catalog everything in the ZIP
    zipEntries.forEach(entry => {
        if (entry.isDirectory) return;

        const ext = path.extname(entry.entryName).toLowerCase();
        if (ext === '.json') {
            metadata[entry.entryName] = entry;
        } else if (['.jpg', '.jpeg', '.png', '.heic'].includes(ext)) {
            photos[entry.entryName] = entry;
        }
    });

    console.log(`🔍 Found ${Object.keys(photos).length} photos and ${Object.keys(metadata).length} JSON files.`);

    // 2. Match and Extract
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    Object.keys(photos).forEach((photoPath, index) => {
        const photoEntry = photos[photoPath];
        const filename = path.basename(photoPath);

        // Google Takeout uses multiple naming patterns:
        // 1. photo.jpg.supplemental-metada.json (note typo "metada")
        // 2. photo.jpg.supplemental-meta.json (truncated)
        // 3. photo.jpg.json (rare)
        const possibleJsonPaths = [
            `${photoPath}.supplemental-metada.json`,
            `${photoPath}.supplemental-meta.json`,
            `${photoPath}.json`
        ];

        let caption = "No caption found";

        for (const jsonPath of possibleJsonPaths) {
            if (metadata[jsonPath]) {
                try {
                    const jsonContent = JSON.parse(zip.readAsText(metadata[jsonPath]));
                    caption = jsonContent.description || jsonContent.title || "No caption found";
                } catch (e) {
                    caption = "Error reading JSON";
                }
                break;
            }
        }

        console.log(`\n[${index + 1}] ${filename}`);
        console.log(`    Caption: "${caption}"`);

        /* this shows the proper API call to download/extract content:
           Instead of downloading from a URL, we extract the local byte buffer
           and write it to your travelblog folder.
        */
        // const buffer = zip.readFile(photoEntry);
        // fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
    });

    console.log(`\n✅ Done! Processed ${Object.keys(photos).length} items.`);
}

processTakeoutZip();