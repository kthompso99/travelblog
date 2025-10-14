#!/usr/bin/env node

/**
 * Pre-deployment checklist
 * Verifies everything is ready for production deployment
 * Run with: node deploy-check.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, test, required = true) {
    const result = test();
    checks.push({ name, result, required });
    if (result.pass) {
        passed++;
        console.log(`✅ ${name}`);
    } else if (required) {
        failed++;
        console.log(`❌ ${name}`);
        if (result.message) console.log(`   ${result.message}`);
    } else {
        warnings++;
        console.log(`⚠️  ${name}`);
        if (result.message) console.log(`   ${result.message}`);
    }
}

console.log('🚀 Pre-Deployment Checklist\n');

// Check 1: config.built.json exists
check('config.built.json exists', () => {
    if (fs.existsSync('config.built.json')) {
        return { pass: true };
    }
    return { pass: false, message: 'Run "npm run build" first' };
});

// Check 2: config.built.json is recent
check('Build is up to date', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }
    
    const builtTime = fs.statSync('config.built.json').mtime;
    const configTime = fs.statSync('config.json').mtime;
    
    if (builtTime > configTime) {
        return { pass: true };
    }
    return { pass: false, message: 'config.json modified after last build. Run "npm run build"' };
});

// Check 3: index.html exists
check('index.html exists', () => {
    if (fs.existsSync('index.html')) {
        return { pass: true };
    }
    return { pass: false, message: 'index.html not found' };
});

// Check 4: All destinations have content
check('All destinations have HTML content', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }
    
    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = config.destinations.filter(d => !d.contentHtml);
    
    if (missing.length === 0) {
        return { pass: true };
    }
    return { 
        pass: false, 
        message: `${missing.length} destination(s) missing HTML: ${missing.map(d => d.name).join(', ')}` 
    };
});

// Check 5: All destinations have coordinates
check('All destinations have coordinates', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }
    
    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = config.destinations.filter(d => !d.coordinates || 
        (d.coordinates.lat === 0 && d.coordinates.lng === 0));
    
    if (missing.length === 0) {
        return { pass: true };
    }
    return { 
        pass: false, 
        message: `${missing.length} destination(s) missing coordinates: ${missing.map(d => d.name).join(', ')}` 
    };
});

// Check 6: Thumbnail images exist (warning only)
check('All thumbnail images exist', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }
    
    const config = JSON.parse(fs.readFileSync('config.built.json', 'utf8'));
    const missing = config.destinations
        .filter(d => d.thumbnail && !fs.existsSync(d.thumbnail))
        .map(d => d.name);
    
    if (missing.length === 0) {
        return { pass: true };
    }
    return { 
        pass: false, 
        message: `${missing.length} thumbnail(s) not found: ${missing.join(', ')}` 
    };
}, false);

// Check 7: File sizes are reasonable
check('config.built.json size is reasonable', () => {
    if (!fs.existsSync('config.built.json')) {
        return { pass: false };
    }
    
    const stats = fs.statSync('config.built.json');
    const sizeMB = stats.size / (1024 * 1024);
    
    if (sizeMB < 5) {
        return { pass: true };
    }
    return { 
        pass: false, 
        message: `File size is ${sizeMB.toFixed(2)}MB (should be under 5MB). Consider optimizing content.` 
    };
}, false);

// Summary
console.log('\n📊 Summary:');
console.log(`   ✅ Passed: ${passed}`);
if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
if (warnings > 0) console.log(`   ⚠️  Warnings: ${warnings}`);

if (failed > 0) {
    console.log('\n❌ Deployment blocked! Fix the errors above first.\n');
    process.exit(1);
}

if (warnings > 0) {
    console.log('\n⚠️  Deployment possible with warnings. Consider fixing them.\n');
}

if (failed === 0 && warnings === 0) {
    console.log('\n✅ All checks passed! Ready to deploy.\n');
}

// Show deployment instructions
console.log('📦 Files to deploy:');
console.log('   ✅ index.html');
console.log('   ✅ config.built.json');
if (fs.existsSync('images') && fs.readdirSync('images').length > 0) {
    console.log('   ✅ images/');
}

console.log('\n❌ Do NOT deploy:');
console.log('   ❌ config.json (source file)');
console.log('   ❌ content/ (already converted)');
console.log('   ❌ *.js (build scripts)');
console.log('   ❌ package.json, node_modules/');

console.log('\n🎯 Deployment platforms:');
console.log('   • GitHub Pages: Push to gh-pages branch');
console.log('   • Netlify: Drag & drop the files above');
console.log('   • Vercel: Deploy from git repository');
console.log('   • Any static hosting: Upload via FTP/SFTP\n');

process.exit(failed > 0 ? 1 : 0);