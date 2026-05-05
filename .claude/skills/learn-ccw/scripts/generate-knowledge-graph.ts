#!/usr/bin/env node
// generate-knowledge-graph.ts
// Scans docs/architecture/ and src/ to auto-generate knowledge-graph.json.
// Run: npx tsx .claude/skills/learn-ccw/scripts/generate-knowledge-graph.ts [--project-root <path>]

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import type {
  NodeType, MasteryLevel, EdgeRelation, GraphLevel,
  EvidenceEntry, Mastery, Annotation, VersionInfo,
  Node, Edge, KnowledgeGraph
} from "../specs/knowledge-graph-types";

// ── Helpers ──

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

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

function getHeadCommit(projectRoot: string): string {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: projectRoot,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

// ── Architecture Doc Scanner ──

function scanArchitectureDocs(
  archDir: string
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!fs.existsSync(archDir)) {
    return { nodes, edges };
  }

  const files = fs
    .readdirSync(archDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  for (const file of files) {
    const filePath = path.join(archDir, file);
    const content = readFileSafe(filePath);
    if (!content) continue;

    const relativePath = path.relative(process.cwd(), filePath);
    const docNodeId = `doc-${slugify(file.replace(/\.md$/, ""))}`;
    const docTitle = content.split("\n")[0]?.replace(/^#\s*/, "").trim() || file;

    // Extract level from frontmatter or heading
    const levelMatch = content.match(/\*\*层级\*\*:\s*(L[0-6])/);
    const level = levelMatch?.[1] as GraphLevel | undefined;

    // Create a document-level node
    let docType: NodeType = "concept";
    if (file.includes("module-map")) docType = "module";
    if (file.includes("core-engine") || file.includes("orchestration"))
      docType = "mechanism";

    const docNode: Node = {
      id: docNodeId,
      label: docTitle,
      type: docType,
      description: `Documentation: ${file}`,
      files: [relativePath],
      level,
      mastery: { level: "L0", evidence: [] },
      _version: { last_read_commit: "", stale: false },
    };

    nodes.push(docNode);

    // Extract ## headings as concept nodes
    const headingRegex = /^##\s+(.+)$/gm;
    let headingMatch: RegExpExecArray | null;
    while ((headingMatch = headingRegex.exec(content)) !== null) {
      const headingText = headingMatch[1].trim();
      // Skip section markers like "> **层级**:"
      if (headingText.startsWith(">")) continue;

      const headingId = slugify(headingText);
      const nodeId = `${docNodeId}-${headingId}`;

      // Extract paragraph after heading as description
      const afterHeading = content.slice(headingMatch.index + headingMatch[0].length);
      const paraEnd = afterHeading.search(/\n(?=##|\n##|$)/);
      const paraText =
        paraEnd > 0
          ? afterHeading.slice(0, paraEnd).trim()
          : afterHeading.split("\n\n").find((p) => p.trim().length > 0)?.trim() || "";

      const cleanDesc = paraText
        .replace(/^\|.*\|$/gm, "") // remove table lines
        .replace(/>.*$/gm, "") // remove blockquotes
        .replace(/```[\s\S]*?```/g, "") // remove code blocks
        .split("\n")
        .find((l) => l.trim().length > 0)
        ?.trim()
        .slice(0, 200) || headingText;

      const headingNode: Node = {
        id: nodeId,
        label: headingText,
        type: "concept",
        description: cleanDesc,
        files: [relativePath],
        level,
        mastery: { level: "L0", evidence: [] },
        _version: { last_read_commit: "", stale: false },
      };

      nodes.push(headingNode);

      edges.push({
        from: nodeId,
        to: docNodeId,
        relation: "part_of",
      });
    }
  }

  return { nodes, edges };
}

// ── Module Dependency Scanner (from 02-module-map.md) ──

function scanModuleDependencies(
  archDir: string
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const moduleMapPath = path.join(archDir, "02-module-map.md");
  const content = readFileSafe(moduleMapPath);
  if (!content) return { nodes, edges };

  // Parse the module responsibility table
  const tableRegex = /\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g;
  let match: RegExpExecArray | null;
  let headerSkipped = false;

  while ((match = tableRegex.exec(content)) !== null) {
    const cells = match.slice(1).map((c) => c.trim());
    // Skip header and separator rows
    if (!headerSkipped || cells[0].startsWith("-") || cells[0] === "模块") {
      if (cells[0] === "模块") headerSkipped = true;
      continue;
    }

    const moduleName = slugify(cells[0]);
    const moduleLabel = cells[0];
    const category = cells[1];
    const fileCount = cells[2];
    const entryPoint = cells[3];
    const upstream = cells[4];
    const downstream = cells[5];

    const nodeId = `module-${moduleName}`;

    nodes.push({
      id: nodeId,
      label: moduleLabel,
      type: "module",
      description: `Files: ${fileCount} | Entry: ${entryPoint} | Category: ${category}`,
      files: entryPoint.split(", ").map((f) => f.trim()).filter(Boolean),
      level: "L2",
      mastery: { level: "L0", evidence: [] },
      _version: { last_read_commit: "", stale: false },
    });

    // Parse upstream dependencies
    if (upstream && upstream !== "none" && upstream !== "N/A") {
      for (const dep of upstream.split(/[,+]\s*/)) {
        const depSlug = slugify(dep.replace(/\(.*?\)/g, "").trim());
        edges.push({
          from: nodeId,
          to: `module-${depSlug}`,
          relation: "depends_on",
        });
      }
    }
  }

  return { nodes, edges };
}

// ── Skill File Scanner (fallback when no arch docs) ──

function scanSkillFiles(skillsDir: string): Node[] {
  const nodes: Node[] = [];

  if (!fs.existsSync(skillsDir)) return nodes;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
    const content = readFileSafe(skillMdPath);
    if (!content) continue;

    // Extract purpose/description from frontmatter or purpose block
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);
    const purposeMatch = content.match(/<purpose>([\s\S]*?)<\/purpose>/);

    const label = nameMatch?.[1]?.trim() || entry.name;
    const desc = descMatch?.[1]?.trim() || purposeMatch?.[1]?.trim().slice(0, 200) || "";

    nodes.push({
      id: `skill-${slugify(entry.name)}`,
      label,
      type: "mechanism",
      description: desc,
      files: [path.relative(process.cwd(), skillMdPath)],
      level: "L3",
      mastery: { level: "L0", evidence: [] },
      _version: { last_read_commit: "", stale: false },
    });
  }

  return nodes;
}

// ── Source File Finder ──

function findRelatedSources(
  nodes: Node[],
  projectRoot: string
): void {
  for (const node of nodes) {
    const srcDir = path.join(projectRoot, "ccw", "src");
    if (!fs.existsSync(srcDir)) continue;

    // Search for files containing the node label or key terms
    const keywords = node.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((k) => k.length > 2);

    for (const keyword of keywords.slice(0, 5)) {
      try {
        const result = execSync(
          `grep -r -l -i "${keyword}" --include="*.ts" --include="*.js" ccw/src/ 2>/dev/null | head -5`,
          { cwd: projectRoot, encoding: "utf-8", maxBuffer: 1024 * 1024 }
        ).trim();
        if (result) {
          const foundFiles = result.split("\n").filter(Boolean);
          for (const f of foundFiles) {
            if (!node.files?.includes(f)) {
              if (!node.files) node.files = [];
              if (!node.files.includes(f)) {
                node.files.push(f);
              }
            }
          }
        }
      } catch {
        // grep returned nothing or error, skip
      }
    }
  }
}

// ── Validation ──

function validateGraph(graph: KnowledgeGraph): string[] {
  const errors: string[] = [];

  if (!graph.graph_version) errors.push("Missing graph_version");
  if (!graph.project_root) errors.push("Missing project_root");
  if (!graph.generated_from_commit) errors.push("Missing generated_from_commit");
  if (!graph.nodes || graph.nodes.length === 0)
    errors.push("No nodes in graph");

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const node of graph.nodes) {
    if (!node.id) errors.push("Node missing id");
    if (!node.label) errors.push(`Node ${node.id} missing label`);
    if (!node.type) errors.push(`Node ${node.id} missing type`);
    if (!["concept", "module", "mechanism"].includes(node.type))
      errors.push(`Node ${node.id} has invalid type: ${node.type}`);

    if (node.depends_on) {
      for (const dep of node.depends_on) {
        if (!nodeIds.has(dep)) {
          errors.push(`Node ${node.id} depends on missing node: ${dep}`);
        }
      }
    }
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from))
      errors.push(`Edge from missing node: ${edge.from}`);
    if (!nodeIds.has(edge.to))
      errors.push(`Edge to missing node: ${edge.to}`);
    if (
      !["depends_on", "part_of", "references", "implements", "extends", "related_to"].includes(
        edge.relation
      )
    )
      errors.push(`Edge has invalid relation: ${edge.relation}`);
  }

  return errors;
}

// ── Main ──

function main(): void {
  const args = process.argv.slice(2);
  const projectRootIdx = args.indexOf("--project-root");
  const projectRoot =
    projectRootIdx >= 0 && projectRootIdx + 1 < args.length
      ? path.resolve(args[projectRootIdx + 1])
      : process.cwd();

  const archDir = path.join(projectRoot, "docs", "architecture");
  const skillsDir = path.join(projectRoot, ".claude", "skills");
  const outputPath = path.join(projectRoot, ".claude", "skills", "learn-ccw", "specs", "knowledge-graph.json");

  const headCommit = getHeadCommit(projectRoot);

  // Phase 1: Scan architecture docs
  console.error("[generate-knowledge-graph] Scanning architecture docs...");
  const archResult = scanArchitectureDocs(archDir);
  let nodes: Node[] = [...archResult.nodes];
  let edges: Edge[] = [...archResult.edges];

  // Phase 2: Scan module dependencies
  console.error("[generate-knowledge-graph] Scanning module dependencies...");
  const moduleResult = scanModuleDependencies(archDir);
  nodes.push(...moduleResult.nodes);
  edges.push(...moduleResult.edges);

  // Phase 3: If no arch docs, fallback to SKILL.md scanning
  if (nodes.length === 0) {
    console.error("[generate-knowledge-graph] No architecture docs found, scanning SKILL.md files...");
    const skillNodes = scanSkillFiles(skillsDir);
    nodes.push(...skillNodes);
  }

  // Phase 4: Find related source files
  console.error("[generate-knowledge-graph] Finding related source files...");
  findRelatedSources(nodes, projectRoot);

  // Phase 5: Deduplicate nodes by ID
  const nodeMap = new Map<string, Node>();
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      const existing = nodeMap.get(node.id)!;
      // Merge files arrays
      if (node.files) {
        const existingFiles = new Set(existing.files || []);
        for (const f of node.files) existingFiles.add(f);
        existing.files = [...existingFiles];
      }
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // Phase 6: Build final graph
  const graph: KnowledgeGraph = {
    graph_version: "1.0.0",
    project_root: projectRoot,
    generated_from_commit: headCommit,
    generated_at: nowISO(),
    nodes: Array.from(nodeMap.values()),
    edges,
  };

  // Phase 7: Validate
  console.error("[generate-knowledge-graph] Validating graph...");
  const errors = validateGraph(graph);
  if (errors.length > 0) {
    console.error("[generate-knowledge-graph] Validation errors:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Phase 8: Write output
  console.error(`[generate-knowledge-graph] Writing to ${outputPath}...`);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf-8");

  console.error(`[generate-knowledge-graph] Done. ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
}

main();
