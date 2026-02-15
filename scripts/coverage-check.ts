#!/usr/bin/env node
/**
 * CCW Knowledge Base Coverage Checker
 * 
 * Scans .claude/ directory and compares against docs/knowledge-base/
 * to ensure 100% documentation coverage.
 * 
 * Usage:
 *   npx ts-node scripts/coverage-check.ts
 *   npx ts-node scripts/coverage-check.ts --fail-on-missing
 *   npx ts-node scripts/coverage-check.ts --output json
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CoverageItem {
  id: string;
  name: string;
  sourcePath: string;
  docPath: string | null;
  documented: boolean;
}

interface CoverageCategory {
  total: number;
  documented: number;
  missing: string[];
  items: CoverageItem[];
}

interface CoverageReport {
  timestamp: string;
  version: string;
  skills: CoverageCategory;
  commands: CoverageCategory;
  agents: CoverageCategory;
  overall_coverage: number;
  pass: boolean;
}

const KNOWLEDGE_BASE_DIR = 'docs/knowledge-base';
const CLAUDE_DIR = '.claude';

async function scanSkills(): Promise<CoverageItem[]> {
  const skillDirs = await glob(`${CLAUDE_DIR}/skills/*/SKILL.md`);
  return skillDirs.map(file => {
    const match = file.match(/skills\/([^/]+)\/SKILL\.md/);
    const name = match ? match[1] : path.basename(path.dirname(file));
    const docPath = `${KNOWLEDGE_BASE_DIR}/skills/${name}.md`;
    return {
      id: `skill-${name}`,
      name,
      sourcePath: file,
      docPath: fs.existsSync(docPath) ? docPath : null,
      documented: fs.existsSync(docPath)
    };
  });
}

async function scanCommands(): Promise<CoverageItem[]> {
  const commandFiles = await glob(`${CLAUDE_DIR}/commands/**/*.md`);
  return commandFiles.map(file => {
    const relativePath = file.replace(`${CLAUDE_DIR}/commands/`, '');
    const name = relativePath.replace('.md', '').replace(/\//g, ':');
    const docPath = `${KNOWLEDGE_BASE_DIR}/commands/${relativePath}`;
    return {
      id: `cmd-${name}`,
      name,
      sourcePath: file,
      docPath: fs.existsSync(docPath) ? docPath : null,
      documented: fs.existsSync(docPath)
    };
  });
}

async function scanAgents(): Promise<CoverageItem[]> {
  const agentFiles = await glob(`${CLAUDE_DIR}/agents/*.md`);
  return agentFiles.map(file => {
    const name = path.basename(file, '.md').replace('-agent', '');
    const docPath = `${KNOWLEDGE_BASE_DIR}/agents/${name}.md`;
    return {
      id: `agent-${name}`,
      name,
      sourcePath: file,
      docPath: fs.existsSync(docPath) ? docPath : null,
      documented: fs.existsSync(docPath)
    };
  });
}

function createCategory(items: CoverageItem[]): CoverageCategory {
  const documented = items.filter(i => i.documented);
  return {
    total: items.length,
    documented: documented.length,
    missing: items.filter(i => !i.documented).map(i => i.name),
    items
  };
}

async function generateReport(): Promise<CoverageReport> {
  const [skills, commands, agents] = await Promise.all([
    scanSkills(),
    scanCommands(),
    scanAgents()
  ]);

  const skillsCategory = createCategory(skills);
  const commandsCategory = createCategory(commands);
  const agentsCategory = createCategory(agents);

  const totalItems = skillsCategory.total + commandsCategory.total + agentsCategory.total;
  const totalDocumented = skillsCategory.documented + commandsCategory.documented + agentsCategory.documented;
  const coverage = totalItems > 0 ? Math.round((totalDocumented / totalItems) * 100) : 0;

  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    skills: { ...skillsCategory, items: undefined } as CoverageCategory,
    commands: { ...commandsCategory, items: undefined } as CoverageCategory,
    agents: { ...agentsCategory, items: undefined } as CoverageCategory,
    overall_coverage: coverage,
    pass: coverage === 100
  };
}

function formatMarkdown(report: CoverageReport): string {
  const lines = [
    `# Coverage Report`,
    ``,
    `**Generated**: ${report.timestamp}`,
    `**Overall Coverage**: ${report.overall_coverage}%`,
    `**Status**: ${report.pass ? '✅ PASS' : '❌ FAIL'}`,
    ``,
    `## Summary`,
    ``,
    `| Category | Total | Documented | Missing | Coverage |`,
    `|----------|-------|------------|---------|----------|`,
    `| Skills | ${report.skills.total} | ${report.skills.documented} | ${report.skills.missing.length} | ${Math.round(report.skills.documented / Math.max(1, report.skills.total) * 100)}% |`,
    `| Commands | ${report.commands.total} | ${report.commands.documented} | ${report.commands.missing.length} | ${Math.round(report.commands.documented / Math.max(1, report.commands.total) * 100)}% |`,
    `| Agents | ${report.agents.total} | ${report.agents.documented} | ${report.agents.missing.length} | ${Math.round(report.agents.documented / Math.max(1, report.agents.total) * 100)}% |`,
    `| **Total** | ${report.skills.total + report.commands.total + report.agents.total} | ${report.skills.documented + report.commands.documented + report.agents.documented} | ${report.skills.missing.length + report.commands.missing.length + report.agents.missing.length} | **${report.overall_coverage}%** |`,
    ``
  ];

  if (report.skills.missing.length > 0) {
    lines.push(`## Missing Skills`, ``, ...report.skills.missing.map(s => `- ${s}`), ``);
  }
  if (report.commands.missing.length > 0) {
    lines.push(`## Missing Commands`, ``, ...report.commands.missing.map(c => `- ${c}`), ``);
  }
  if (report.agents.missing.length > 0) {
    lines.push(`## Missing Agents`, ``, ...report.agents.missing.map(a => `- ${a}`), ``);
  }

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const failOnMissing = args.includes('--fail-on-missing');
  const outputJson = args.includes('--output') && args[args.indexOf('--output') + 1] === 'json';

  const report = await generateReport();

  // Write JSON report
  fs.writeFileSync('scripts/coverage-report.json', JSON.stringify(report, null, 2));
  
  // Write Markdown report
  fs.writeFileSync('scripts/coverage-report.md', formatMarkdown(report));

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatMarkdown(report));
  }

  if (failOnMissing && !report.pass) {
    console.error('\n❌ Coverage check failed: Missing documentation detected');
    process.exit(1);
  }

  console.log('\n✅ Coverage report generated');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
