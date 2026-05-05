// knowledge-graph-types.ts
// TypeScript types matching knowledge-graph-schema.json exactly.
// All types are plain interfaces for direct JSON serialization/deserialization.

export type NodeType = "concept" | "module" | "mechanism";

export type MasteryLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export type EdgeRelation =
  | "depends_on"
  | "part_of"
  | "references"
  | "implements"
  | "extends"
  | "related_to";

export type GraphLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export interface EvidenceEntry {
  /** Mastery level this evidence supports */
  level: MasteryLevel;
  /** What the user did to demonstrate mastery */
  action: string;
  /** Session ID where the evidence was observed */
  session_id: string;
  /** When the evidence was recorded */
  timestamp: string; // ISO-8601
  /** Optional additional context about the evidence */
  detail?: string;
}

export interface Mastery {
  /** Current mastery level (L1-L5, or L0 for uncovered) */
  level: MasteryLevel;
  /** Evidence records supporting the current level */
  evidence: EvidenceEntry[];
  /** Suggested action to level up */
  next?: string;
}

export interface Annotation {
  /** Who created this annotation */
  author: string;
  /** When the annotation was created */
  timestamp: string; // ISO-8601
  /** Annotation content */
  text: string;
}

export interface VersionInfo {
  /** Git commit hash when this node's files were last verified */
  last_read_commit: string; // 40-char hex
  /** Timestamp of last verification */
  last_verified_at?: string; // ISO-8601
  /** Whether tracked files have changed since last_read_commit */
  stale: boolean;
  /** List of files that changed since last verification */
  stale_files?: string[];
}

export interface Node {
  /** Unique identifier (e.g., 'L1-three-way-routing') */
  id: string;
  /** Human-readable display name */
  label: string;
  /** Category of the node */
  type: NodeType;
  /** Brief description of what this node represents */
  description: string;
  /** File paths relevant to this node, relative to project_root */
  files?: string[];
  /** IDs of nodes this node depends on */
  depends_on?: string[];
  /** Knowledge graph tier level (L0-L6) */
  level?: GraphLevel;
  /** User mastery tracking */
  mastery?: Mastery;
  /** User annotations */
  annotations?: Annotation[];
  /** Git version anchoring and staleness tracking */
  _version?: VersionInfo;
}

export interface Edge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Type of relationship */
  relation: EdgeRelation;
}

export interface KnowledgeGraph {
  /** Semantic version of the graph schema */
  graph_version: string; // semver, e.g. "1.0.0"
  /** Absolute or relative path to the project root */
  project_root: string;
  /** Git commit hash from which this graph was generated */
  generated_from_commit: string; // 40-char hex
  /** ISO-8601 timestamp of generation */
  generated_at?: string;
  /** All nodes in the graph */
  nodes: Node[];
  /** All edges connecting nodes */
  edges: Edge[];
}
