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

// ── Mastery Assessment ──

/**
 * Analyze conversation text and determine what mastery levels are demonstrated
 * for each mentioned node.
 */
export function assessLevelsFromConversation(
  text: string
): Array<{ nodeId: string; level: MasteryLevel; detail: string }> {
  const results: Array<{ nodeId: string; level: MasteryLevel; detail: string }> = [];

  // Match node IDs in the text (e.g., "L1-three-way-routing", "three-way routing")
  const nodeMentions = text.match(/[a-zA-Z0-9_-]+(?:routing|executor|pipeline|module|chain|flow|loop|queue|skill|agent|memory|session|hook|mcp|cli)/gi);

  if (!nodeMentions) return results;

  const uniqueMatches = [...new Set(nodeMentions.map((m) => m.toLowerCase()))];

  for (const match of uniqueMatches) {
    const nodeId = match.replace(/[^a-zA-Z0-9_-]/g, "-");

    // Determine level based on conversation patterns
    let level: MasteryLevel = "L1";
    let detail = "";

    // L5: Proposes alternatives with tradeoffs
    if (
      /\b(alternative|tradeoff|instead of|rather than|pros? and cons?|compare|vs\.?)\b/i.test(text) &&
      /\b(because|since|reason|advantage|disadvantage|drawback|benefit)\b/i.test(text)
    ) {
      level = "L5";
      detail = "User proposed alternatives with tradeoff analysis";
    }
    // L4: Completed code changes + tests
    else if (
      /\b(implemented|created|wrote|added|modified|changed|fixed|refactored)\b/i.test(text) &&
      /\b(test|spec|schema|code|function|class|file)\b/i.test(text)
    ) {
      level = "L4";
      detail = "User described completing code changes";
    }
    // L3: Traces end-to-end call flow
    else if (
      /(?:call flow|call chain|execution path|end.to.end|traces?|pipeline|sequence|step\s+\d)/i.test(text)
    ) {
      level = "L3";
      detail = "User traced end-to-end call flow";
    }
    // L2: Provides file:line reference
    else if (
      /(?:file:\s*\w+\.\w+|:\d+|line\s+\d+|located\s+in\s+\S+\.\w+)/i.test(text)
    ) {
      level = "L2";
      detail = "User provided file:line reference";
    }
    // L1: Repeats concept name + description
    else {
      level = "L1";
      detail = "User demonstrated concept recognition";
    }

    results.push({ nodeId: match, level, detail });
  }

  return results;
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

// ── Session End Handler ──

/**
 * On session end, update the in-memory graph with accumulated evidence.
 */
export function finalizeSession(
  graphPath: string,
  sessionId: string,
  conversationSummary: string
): KnowledgeGraph {
  const graph = loadGraph(graphPath);
  const assessments = assessLevelsFromConversation(conversationSummary);

  for (const assessment of assessments) {
    try {
      updateMastery(graph, assessment.nodeId, sessionId, assessment.level, assessment.detail);
    } catch {
      // Node not found, skip
    }
  }

  saveGraph(graphPath, graph);
  return graph;
}

// ── CLI Entrypoint ──

function printHelp(): void {
  console.error(`
Usage:
  mastery-evaluator.ts assess <text>         -- Assess mastery level from conversation text
  mastery-evaluator.ts update <node-id> <level> [detail] [session-id]
                                             -- Update mastery for a node
  mastery-evaluator.ts finalize <session-id> [summary-file]
                                             -- Finalize session with accumulated evidence
  mastery-evaluator.ts next <level>          -- Show suggested next step for a level
  mastery-evaluator.ts analyze <file-path>   -- Analyze conversation log file and update graph
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
    case "assess": {
      const text = args.slice(1).join(" ");
      if (!text) {
        printHelp();
        process.exit(1);
      }
      const results = assessLevelsFromConversation(text);
      console.log(JSON.stringify(results, null, 2));
      break;
    }

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

    case "finalize": {
      const sessionId = args[1];
      const summaryFile = args[2];
      if (!sessionId) {
        printHelp();
        process.exit(1);
      }
      let summary = "";
      if (summaryFile) {
        summary = readFileSafe(path.resolve(summaryFile)) || "";
      }
      const graph = finalizeSession(graphPath, sessionId, summary);
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

    case "analyze": {
      const filePath = args[1];
      if (!filePath) {
        printHelp();
        process.exit(1);
      }
      const content = readFileSafe(path.resolve(filePath));
      if (!content) {
        console.error(`Cannot read file: ${filePath}`);
        process.exit(1);
      }
      const sessionId = `analyze-${path.basename(filePath, path.extname(filePath))}`;
      finalizeSession(graphPath, sessionId, content);
      console.log(`[mastery-evaluator] Analyzed ${filePath}, graph updated.`);
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
