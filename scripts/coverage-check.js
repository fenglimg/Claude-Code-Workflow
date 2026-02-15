#!/usr/bin/env node

/**
 * CCW Knowledge Base Coverage Checker
 * 
 * Validates knowledge base documentation coverage against source code modules.
 * 
 * Usage:
 *   node coverage-check.js [--json] [--verbose]
 * 
 * Options:
 *   --json     Output results as JSON
 *   --verbose  Show detailed coverage information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  knowledgeBasePath: 'docs/knowledge-base',
  sourcePaths: {
    core: 'ccw/src/core',
    commands: 'ccw/src/commands',
    tools: 'ccw/src/tools',
    skills: '.claude/skills',
    slashCommands: '.claude/commands'
  },
  minCoverage: 80,
  categories: ['architecture', 'commands', 'skills', 'mcp', 'servers']
};

// Coverage tracking
let coverage = {
  total: 0,
  covered: 0,
  missing: [],
  details: {}
};

/**
 * Get all TypeScript/JavaScript files in a directory
 */
function getSourceFiles(dirPath, extensions = ['.ts', '.js', '.md']) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      files.push(...getSourceFiles(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Get all knowledge base documents
 */
function getKnowledgeBaseDocs() {
  const kbPath = path.join(CONFIG.projectRoot, CONFIG.knowledgeBasePath);
  const docs = {};
  
  for (const category of CONFIG.categories) {
    const categoryPath = path.join(kbPath, category);
    if (fs.existsSync(categoryPath)) {
      docs[category] = getSourceFiles(categoryPath, ['.md']);
    } else {
      docs[category] = [];
    }
  }
  
  return docs;
}

/**
 * Extract module names from source files
 */
function extractModuleNames(files) {
  const modules = new Set();
  
  for (const file of files) {
    const basename = path.basename(file, path.extname(file));
    // Skip test files and index files
    if (!basename.includes('.test') && !basename.includes('.spec') && basename !== 'index') {
      modules.add(basename);
    }
  }
  
  return Array.from(modules);
}

/**
 * Check if a module is documented
 */
function isModuleDocumented(moduleName, docs) {
  const moduleNameLower = moduleName.toLowerCase();
  
  for (const categoryDocs of Object.values(docs)) {
    for (const doc of categoryDocs) {
      const content = fs.readFileSync(doc, 'utf-8').toLowerCase();
      if (content.includes(moduleNameLower)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate coverage for a source path
 */
function calculatePathCoverage(sourcePath, docs, label) {
  const fullPath = path.join(CONFIG.projectRoot, sourcePath);
  const files = getSourceFiles(fullPath);
  const modules = extractModuleNames(files);
  
  const result = {
    label,
    total: modules.length,
    covered: 0,
    missing: []
  };
  
  for (const module of modules) {
    if (isModuleDocumented(module, docs)) {
      result.covered++;
    } else {
      result.missing.push(module);
    }
  }
  
  return result;
}

/**
 * Run coverage check
 */
function runCoverageCheck() {
  const docs = getKnowledgeBaseDocs();
  const results = {};
  
  console.log('\n🔍 CCW Knowledge Base Coverage Report\n');
  console.log('='.repeat(60));
  
  for (const [label, sourcePath] of Object.entries(CONFIG.sourcePaths)) {
    const result = calculatePathCoverage(sourcePath, docs, label);
    results[label] = result;
    
    const percentage = result.total > 0 
      ? Math.round((result.covered / result.total) * 100) 
      : 100;
    
    coverage.total += result.total;
    coverage.covered += result.covered;
    coverage.missing.push(...result.missing.map(m => `${label}/${m}`));
    
    console.log(`\n📂 ${label.toUpperCase()}`);
    console.log(`   Coverage: ${percentage}% (${result.covered}/${result.total})`);
    
    if (result.missing.length > 0 && process.argv.includes('--verbose')) {
      console.log(`   Missing: ${result.missing.join(', ')}`);
    }
    
    coverage.details[label] = {
      percentage,
      covered: result.covered,
      total: result.total,
      missing: result.missing
    };
  }
  
  const overallPercentage = coverage.total > 0
    ? Math.round((coverage.covered / coverage.total) * 100)
    : 100;
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 OVERALL COVERAGE: ${overallPercentage}% (${coverage.covered}/${coverage.total})`);
  
  if (overallPercentage >= CONFIG.minCoverage) {
    console.log(`✅ PASS: Coverage meets minimum requirement (${CONFIG.minCoverage}%)\n`);
  } else {
    console.log(`❌ FAIL: Coverage below minimum requirement (${CONFIG.minCoverage}%)\n`);
  }
  
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      overall: overallPercentage,
      covered: coverage.covered,
      total: coverage.total,
      minCoverage: CONFIG.minCoverage,
      passed: overallPercentage >= CONFIG.minCoverage,
      details: coverage.details
    }, null, 2));
  }
  
  return overallPercentage >= CONFIG.minCoverage ? 0 : 1;
}

// Run
process.exit(runCoverageCheck());
