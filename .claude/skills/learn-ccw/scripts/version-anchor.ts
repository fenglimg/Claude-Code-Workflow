#!/usr/bin/env node
// version-anchor.ts
// Per-node git commit tracking + stale detection on /learn-ccw start.
// Run: npx tsx .claude/skills/learn-ccw/scripts/version-anchor.ts <command> [args...]

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import type { VersionInfo, Node, KnowledgeGraph } from "../specs/knowledge-graph-types";

// ── Helpers ──

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

function findGraphPath(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, ".claude", "skills", "learn-ccw", "specs", "knowledge-graph.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function loadGraph(graphPath: string): KnowledgeGraph {
  const raw = readFileSafe(graphPath);
  if (!raw) throw new Error(`Cannot read graph at ${graphPath}`);
  return JSON.parse(raw) as KnowledgeGraph;
}

function saveGraph(graphPath: string, graph: KnowledgeGraph): void {
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), "utf-8");
}

function getCurrentCommit(projectRoot: string): string {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: projectRoot,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Check if a tracked file has changed between two commits.
 * Returns list of files that differ, or empty array if no change.
 */
function getChangedFiles(
  projectRoot: string,
  fromCommit: string,
  files: string[]
): string[] {
  if (!fromCommit || files.length === 0) return [];

  const changed: string[] = [];

  for (const filePath of files) {
    // Resolve relative paths against project root
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(projectRoot, filePath);

    // Make path relative to project root for git diff
    const relativePath = path.relative(projectRoot, resolved).replace(/\\/g, "/");

    try {
      // Use git diff --quiet to check if file changed (exit code 0 = no change, 1 = changed).
      // Compare the commit with working tree (no ..HEAD) to detect uncommitted changes too.
      execSync(
        `git diff --quiet "${fromCommit}" -- "${relativePath}"`,
        { cwd: projectRoot, encoding: "utf-8", stdio: "pipe" }
      );
      // Exit code 0: no changes
    } catch (e: unknown) {
      // Exit code 1: file changed
      const err = e as { status?: number; stderr?: string };
      if (err.status === 1) {
        changed.push(relativePath);
      }
      // Other errors (file not tracked, etc.) - skip silently
    }
  }

  return changed;
}

// ── Commands ──

/**
 * Check all nodes for staleness. Updates `_version.stale` and `_version.stale_files`.
 * Returns list of stale nodes.
 */
export function checkStaleness(
  graphPath: string,
  projectRoot: string
): { staleNodes: Node[]; currentCommit: string; graph: KnowledgeGraph } {
  const graph = loadGraph(graphPath);
  const currentCommit = getCurrentCommit(projectRoot);
  const staleNodes: Node[] = [];

  for (const node of graph.nodes) {
    if (!node._version) {
      // Uncovered node (no version info), skip but initialize
      node._version = {
        last_read_commit: currentCommit || "",
        stale: false,
      };
      continue;
    }

    const lastCommit = node._version.last_read_commit;
    if (!lastCommit) {
      // No previous commit recorded, initialize
      node._version.last_read_commit = currentCommit || "";
      node._version.stale = false;
      node._version.stale_files = [];
      continue;
    }

    // Check for changes
    const changedFiles = getChangedFiles(projectRoot, lastCommit, node.files || []);

    if (changedFiles.length > 0) {
      node._version.stale = true;
      node._version.stale_files = [...(node._version.stale_files || []), ...changedFiles];
      // Deduplicate
      node._version.stale_files = [...new Set(node._version.stale_files)];
      staleNodes.push(node);
    } else {
      node._version.stale = false;
      node._version.stale_files = [];
    }
  }

  saveGraph(graphPath, graph);
  return { staleNodes, currentCommit, graph };
}

/**
 * Anchor a specific node: update its last_read_commit to HEAD.
 */
export function anchorNode(
  graphPath: string,
  projectRoot: string,
  nodeId: string
): Node | null {
  const graph = loadGraph(graphPath);
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const currentCommit = getCurrentCommit(projectRoot);
  if (!currentCommit) return null;

  if (!node._version) {
    node._version = { last_read_commit: currentCommit, stale: false };
  } else {
    node._version.last_read_commit = currentCommit;
    node._version.stale = false;
    node._version.stale_files = [];
  }
  node._version.last_verified_at = nowISO();

  saveGraph(graphPath, graph);
  return node;
}

/**
 * Anchor all nodes: update last_read_commit for every node.
 */
export function anchorAll(
  graphPath: string,
  projectRoot: string
): { anchored: number; graph: KnowledgeGraph } {
  const graph = loadGraph(graphPath);
  const currentCommit = getCurrentCommit(projectRoot);
  let anchored = 0;

  for (const node of graph.nodes) {
    if (!node._version) {
      node._version = { last_read_commit: currentCommit, stale: false };
    } else {
      node._version.last_read_commit = currentCommit;
      node._version.stale = false;
      node._version.stale_files = [];
    }
    node._version.last_verified_at = nowISO();
    anchored++;
  }

  saveGraph(graphPath, graph);
  return { anchored, graph };
}

/**
 * Get a human-readable summary of stale nodes.
 */
export function staleSummary(
  graphPath: string,
  projectRoot: string
): { staleCount: number; totalNodes: number; staleNodes: Array<{ id: string; label: string; files: string[] }> } {
  const { staleNodes, graph } = checkStaleness(graphPath, projectRoot);

  return {
    staleCount: staleNodes.length,
    totalNodes: graph.nodes.length,
    staleNodes: staleNodes.map((n) => ({
      id: n.id,
      label: n.label,
      files: n._version?.stale_files || [],
    })),
  };
}

// ── CLI Entrypoint ──

function printHelp(): void {
  console.error(`
Usage:
  version-anchor.ts check          -- Check all nodes for staleness
  version-anchor.ts anchor <node-id> -- Anchor a specific node to HEAD
  version-anchor.ts anchor-all       -- Anchor all nodes to HEAD
  version-anchor.ts status           -- Show stale nodes summary
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];
  const projectRoot = process.cwd();

  const graphPath = findGraphPath(projectRoot);
  if (!graphPath) {
    console.error("[version-anchor] knowledge-graph.json not found. Run generate-knowledge-graph.ts first.");
    process.exit(1);
  }

  switch (command) {
    case "check": {
      const result = checkStaleness(graphPath, projectRoot);
      console.log(
        JSON.stringify(
          {
            currentCommit: result.currentCommit,
            staleCount: result.staleNodes.length,
            totalNodes: result.graph.nodes.length,
            staleNodes: result.staleNodes.map((n) => ({
              id: n.id,
              label: n.label,
              staleFiles: n._version?.stale_files || [],
            })),
          },
          null,
          2
        )
      );
      break;
    }

    case "anchor": {
      const nodeId = args[1];
      if (!nodeId) {
        printHelp();
        process.exit(1);
      }
      const node = anchorNode(graphPath, projectRoot, nodeId);
      if (!node) {
        console.error(`Node not found: ${nodeId}`);
        process.exit(1);
      }
      console.log(JSON.stringify({ anchored: nodeId, commit: node._version?.last_read_commit }, null, 2));
      break;
    }

    case "anchor-all": {
      const result = anchorAll(graphPath, projectRoot);
      console.log(JSON.stringify({ anchored: result.anchored, commit: getCurrentCommit(projectRoot) }, null, 2));
      break;
    }

    case "status": {
      const summary = staleSummary(graphPath, projectRoot);
      if (summary.staleCount > 0) {
        console.log(`Stale: ${summary.staleCount}/${summary.totalNodes} nodes`);
        for (const node of summary.staleNodes) {
          console.log(`  - ${node.label} (${node.id}): ${node.files.join(", ")}`);
        }
      } else {
        console.log(`All ${summary.totalNodes} nodes are up to date.`);
      }
      break;
    }

    default:
      printHelp();
      process.exit(1);
  }
}

if (process.argv[1]?.endsWith("version-anchor.ts")) {
  main();
}
