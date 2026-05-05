#!/usr/bin/env node
// mastery-evaluator.ts
// Evaluates and tracks user mastery through conversation context.
// Updates knowledge-graph.json mastery levels and evidence.
// Run: npx tsx .claude/skills/learn-ccw/scripts/mastery-evaluator.ts <action> [args...]

import * as fs from "node:fs";
import * as path from "node:path";
import type {
  MasteryLevel, EvidenceEntry, Mastery, VersionInfo,
  Node, KnowledgeGraph
} from "../specs/knowledge-graph-types";

// ── Level Definitions ──

const LEVEL_THRESHOLDS: Record<MasteryLevel, string> = {
  L1: "User repeats concept name + one-sentence description",
  L2: "User provides file:line reference",
  L3: "User traces end-to-end call flow",
  L4: "User completed code changes + tests pass",
  L5: "User proposes alternatives with tradeoffs",
};

const LEVEL_ORDER: MasteryLevel[] = ["L0", "L1", "L2", "L3", "L4", "L5"];

function levelToIndex(level: MasteryLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

function indexToLevel(idx: number): MasteryLevel {
  if (idx < 0) return "L0";
  if (idx >= LEVEL_ORDER.length) return "L5";
  return LEVEL_ORDER[idx];
}

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
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

// ── Mastery Update ──

/**
 * Update mastery for a specific node in the graph.
 */
export function updateMastery(
  graph: KnowledgeGraph,
  nodeId: string,
  sessionId: string,
  level: MasteryLevel,
  detail: string
): { node: Node; leveledUp: boolean } {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!node.mastery) {
    node.mastery = { level: "L0", evidence: [] };
  }

  const currentIdx = levelToIndex(node.mastery.level);
  const newIdx = levelToIndex(level);
  const leveledUp = newIdx > currentIdx;

  // Update level if higher
  if (leveledUp) {
    node.mastery.level = level;
  }

  // Add evidence
  const evidence: EvidenceEntry = {
    level,
    action: detail,
    session_id: sessionId,
    timestamp: nowISO(),
  };

  if (!node.mastery.evidence) {
    node.mastery.evidence = [];
  }
  node.mastery.evidence.push(evidence);

  // Keep last 50 evidence entries (sliding window)
  if (node.mastery.evidence.length > 50) {
    node.mastery.evidence = node.mastery.evidence.slice(-50);
  }

  // Generate next suggestion
  node.mastery.next = suggestNextStep(node.mastery.level);

  return { node, leveledUp };
}

/**
 * Suggest what to do next to level up.
 */
export function suggestNextStep(currentLevel: MasteryLevel): string {
  const idx = levelToIndex(currentLevel);
  if (idx >= 5) return "Mastery complete. Consider teaching others.";
  const nextLevel = indexToLevel(idx + 1) as MasteryLevel;
  return `Level up to ${nextLevel}: ${LEVEL_THRESHOLDS[nextLevel]}`;
}

// ── Evidence Append API ──

/**
 * Append evidence for a specific node in the knowledge graph.
 * AI calls this to record mastery evidence entries without regex auto-assessment.
 * Loads the graph, records evidence via updateMastery, saves, and returns result.
 */
export function appendEvidence(
  graphPath: string,
  nodeId: string,
  level: MasteryLevel,
  action: string,
  sessionId: string
): { nodeId: string; level: MasteryLevel; leveledUp: boolean } {
  const graph = loadGraph(graphPath);
  const result = updateMastery(graph, nodeId, sessionId, level, action);
  saveGraph(graphPath, graph);
  return {
    nodeId: result.node.id,
    level: result.node.mastery?.level || level,
    leveledUp: result.leveledUp,
  };
}

// ── Session End Handler ──

/**
 * On session end, consolidate evidence entries in the graph.
 * Does not auto-assess; only performs cleanup and validation.
 */
export function finalizeSession(
  graphPath: string,
  sessionId: string
): KnowledgeGraph {
  const graph = loadGraph(graphPath);
  // Consolidate: clean up empty evidence arrays
  for (const node of graph.nodes) {
    if (node.mastery?.evidence && node.mastery.evidence.length === 0) {
      delete node.mastery.evidence;
    }
  }
  saveGraph(graphPath, graph);
  return graph;
}

// ── CLI Entrypoint ──

function printHelp(): void {
  console.error(`
Usage:
  mastery-evaluator.ts update <node-id> <level> [detail] [session-id]
                                             -- Update mastery for a node
  mastery-evaluator.ts append-evidence <node-id> <level> <action> [session-id]
                                             -- Append evidence entry for a node
  mastery-evaluator.ts finalize <session-id>
                                             -- Finalize session (consolidate evidence)
  mastery-evaluator.ts next <level>          -- Show suggested next step for a level
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  // Resolve project root and graph path
  const projectRoot = process.cwd();
  const graphPath = findGraphPath(projectRoot);
  if (!graphPath) {
    console.error("[mastery-evaluator] knowledge-graph.json not found. Run generate-knowledge-graph.ts first.");
    process.exit(1);
  }

  switch (command) {
    case "update": {
      const [, nodeId, levelArg, detail, sessionId] = args;
      if (!nodeId || !levelArg) {
        printHelp();
        process.exit(1);
      }
      const level = levelArg.toUpperCase() as MasteryLevel;
      if (!LEVEL_ORDER.includes(level)) {
        console.error(`Invalid level: ${levelArg}. Must be L1-L5.`);
        process.exit(1);
      }
      const graph = loadGraph(graphPath);
      const result = updateMastery(
        graph,
        nodeId,
        sessionId || "cli",
        level,
        detail || "Manual update"
      );
      saveGraph(graphPath, graph);
      console.log(
        JSON.stringify(
          {
            nodeId: result.node.id,
            level: result.node.mastery?.level,
            leveledUp: result.leveledUp,
            next: result.node.mastery?.next,
          },
          null,
          2
        )
      );
      break;
    }

    case "append-evidence": {
      const nodeId = args[1];
      const levelArg = args[2];
      const action = args[3] || "Manual evidence entry";
      const sessionId = args[4] || "cli";
      if (!nodeId || !levelArg) {
        printHelp();
        process.exit(1);
      }
      const level = levelArg.toUpperCase() as MasteryLevel;
      if (!LEVEL_ORDER.includes(level)) {
        console.error(`Invalid level: ${levelArg}. Must be L1-L5.`);
        process.exit(1);
      }
      const result = appendEvidence(graphPath, nodeId, level, action, sessionId);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "finalize": {
      const sessionId = args[1];
      if (!sessionId) {
        printHelp();
        process.exit(1);
      }
      const graph = finalizeSession(graphPath, sessionId);
      console.log(
        JSON.stringify(
          {
            nodeCount: graph.nodes.length,
            updatedNodes: graph.nodes.filter((n) => n.mastery?.evidence && n.mastery.evidence.length > 0).length,
          },
          null,
          2
        )
      );
      break;
    }

    case "next": {
      const levelArg = args[1];
      if (!levelArg) {
        printHelp();
        process.exit(1);
      }
      const level = levelArg.toUpperCase() as MasteryLevel;
      console.log(suggestNextStep(level));
      break;
    }

    default:
      printHelp();
      process.exit(1);
  }
}

// Run if called directly
if (process.argv[1]?.endsWith("mastery-evaluator.ts")) {
  main();
}
