#!/usr/bin/env node
// inject-knowledge-graph.js
// Reads learn-project.html template and knowledge-graph.json, produces a standalone
// HTML file with data embedded in a <script> tag (no fetch needed, works via file://).
// Run: node .claude/skills/learn-ccw/scripts/inject-knowledge-graph.js
//
// Options:
//   --template <path>   Path to HTML template (default: auto-detect)
//   --data <path>       Path to knowledge-graph.json (default: auto-detect)
//   --output <path>     Output path (default: overwrites template)

var fs = require("fs");
var path = require("path");

// ── Resolve paths ──

var SKILL_DIR = path.resolve(__dirname, "..");

function resolvePath(argValue, defaultRel) {
  if (argValue) return path.resolve(argValue);
  return path.join(SKILL_DIR, defaultRel);
}

var args = process.argv.slice(2);
var opts = {
  template: null,
  data: null,
  output: null,
};
for (var i = 0; i < args.length; i++) {
  if (args[i] === "--template" && i + 1 < args.length) opts.template = args[++i];
  else if (args[i] === "--data" && i + 1 < args.length) opts.data = args[++i];
  else if (args[i] === "--output" && i + 1 < args.length) opts.output = args[++i];
  else if (args[i] === "--help") {
    console.log("Usage: inject-knowledge-graph.js [--template <path>] [--data <path>] [--output <path>]");
    process.exit(0);
  }
}

var templatePath = resolvePath(opts.template, "templates/learn-project.html");
var dataPath = resolvePath(opts.data, "specs/knowledge-graph.json");
var outputPath = opts.output ? path.resolve(opts.output) : templatePath;

// ── Read files ──

var template = fs.readFileSync(templatePath, "utf-8");
var graphData = fs.readFileSync(dataPath, "utf-8");

// Validate JSON
try { JSON.parse(graphData); } catch (e) {
  console.error("[inject] Invalid JSON in " + dataPath + ": " + e.message);
  process.exit(1);
}

// ── Inject ──

// Replace the placeholder null with actual graph data
var marker = "var GRAPH_DATA = null;";
var injection = "var GRAPH_DATA = " + graphData + ";";

var result = template.replace(marker, injection);

// Remove the INJECTION POINT comments
result = result.replace(/\/\/ ── INJECTION POINT ──[\s\S]*?\n/, "");
result = result.replace(/\/\/ ── END INJECTION POINT ──\n?/, "");

// ── Write ──

fs.writeFileSync(outputPath, result, "utf-8");
var dataSize = (Buffer.byteLength(graphData, "utf-8") / 1024).toFixed(1);
console.log("[inject] Injected " + dataSize + " KB of graph data into " + outputPath);
console.log("[inject] Nodes: " + JSON.parse(graphData).nodes.length + ", Edges: " + JSON.parse(graphData).edges.length);
