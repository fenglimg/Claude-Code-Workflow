import { Command } from 'commander';
import { viewCommand } from './commands/view.js';
import { serveCommand } from './commands/serve.js';
import { stopCommand } from './commands/stop.js';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { upgradeCommand } from './commands/upgrade.js';
import { listCommand } from './commands/list.js';
import { toolCommand } from './commands/tool.js';
import { sessionCommand } from './commands/session.js';
import { cliCommand } from './commands/cli.js';
import { memoryCommand } from './commands/memory.js';
import { coreMemoryCommand } from './commands/core-memory.js';
import { hookCommand } from './commands/hook.js';
import { issueCommand } from './commands/issue.js';
import {
  learnReadStateCommand,
  learnUpdateStateCommand,
  learnReadProfileCommand,
		learnWriteProfileCommand,
		learnAppendProfileEventCommand,
		learnAppendProfileEventsBatchCommand,
		learnProposeInferredSkillCommand,
		learnConfirmInferredSkillCommand,
		learnRejectInferredSkillCommand,
		learnAppendTelemetryEventCommand,
	  learnReadProfileSnapshotCommand,
	  learnRebuildProfileSnapshotCommand,
	  learnRollbackProfileCommand,
	  learnListProfilesCommand,
	  learnSetActiveProfileCommand,
	  learnReadSessionCommand,
	  learnUpdateProgressCommand,
	  learnResolvePackKeyCommand,
	  learnReadPackCommand,
	  learnWritePackCommand,
	  learnPackStatusCommand,
	  learnEnsurePackCommand,
	  learnResolveTopicCommand,
	  learnEnsureTopicCommand,
	  learnTaxonomyAliasCommand,
	  learnTaxonomyRedirectCommand,
	  learnTaxonomyPromoteCommand
	} from './commands/learn.js';
import { learnParseBackgroundCommand } from './commands/learn-background.js';
import { learnAdaptiveStepCommand } from './commands/learn-adaptive.js';
import { learnValidateQuestionsCommand } from './commands/learn-questions.js';
import { workflowCommand } from './commands/workflow.js';
import { loopCommand } from './commands/loop.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Load package.json with error handling
 * Tries root package.json first (../../package.json from dist),
 * then falls back to ccw package.json (../package.json from dist)
 * @returns Package info with version
 */
function loadPackageInfo(): PackageInfo {
  // First try root package.json (parent of ccw directory)
  const rootPkgPath = join(__dirname, '../../package.json');
  // Fallback to ccw package.json
  const ccwPkgPath = join(__dirname, '../package.json');

  try {
    // Try root package.json first
    if (existsSync(rootPkgPath)) {
      const content = readFileSync(rootPkgPath, 'utf8');
      return JSON.parse(content) as PackageInfo;
    }

    // Fallback to ccw package.json
    if (existsSync(ccwPkgPath)) {
      const content = readFileSync(ccwPkgPath, 'utf8');
      return JSON.parse(content) as PackageInfo;
    }

    console.error('Fatal Error: package.json not found.');
    console.error(`Tried locations:\n  - ${rootPkgPath}\n  - ${ccwPkgPath}`);
    process.exit(1);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Fatal Error: package.json contains invalid JSON.');
      console.error(`Parse error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error('Fatal Error: Could not read package.json.');
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

const pkg = loadPackageInfo();

export function run(argv: string[]): void {
  const program = new Command();

  program
    .name('ccw')
    .description('Claude Code Workflow CLI - Dashboard and workflow tools')
    .version(pkg.version);

  // View command (server mode with live path switching)
  program
    .command('view')
    .description('Open workflow dashboard server with live path switching')
    .option('-p, --path <path>', 'Path to project directory', '.')
    .option('--port <port>', 'Server port', '3456')
    .option('--host <host>', 'Server host to bind', '127.0.0.1')
    .option('--no-browser', 'Start server without opening browser')
    .action(viewCommand);

  // Serve command (alias for view)
  program
    .command('serve')
    .description('Alias for view command')
    .option('-p, --path <path>', 'Initial project directory')
    .option('--port <port>', 'Server port', '3456')
    .option('--host <host>', 'Server host to bind', '127.0.0.1')
    .option('--no-browser', 'Start server without opening browser')
    .action(serveCommand);

  // Stop command
  program
    .command('stop')
    .description('Stop the running CCW dashboard server')
    .option('--port <port>', 'Server port', '3456')
    .option('-f, --force', 'Force kill process on the port')
    .action(stopCommand);

  // Install command
  program
    .command('install')
    .description('Install Claude Code Workflow to your system (includes .codex/prompts)')
    .option('-m, --mode <mode>', 'Installation mode: Global or Path')
    .option('-p, --path <path>', 'Installation path (for Path mode)')
    .option('-f, --force', 'Force installation without prompts')
    .action(installCommand);

  // Uninstall command
  program
    .command('uninstall')
    .description('Uninstall Claude Code Workflow')
    .action(uninstallCommand);

  // Upgrade command
  program
    .command('upgrade')
    .description('Upgrade Claude Code Workflow installations')
    .option('-a, --all', 'Upgrade all installations without prompting')
    .action(upgradeCommand);

  // List command
  program
    .command('list')
    .description('List all installed Claude Code Workflow instances')
    .action(listCommand);

  // Tool command
  program
    .command('tool [subcommand] [args...]')
    .description('Execute CCW tools')
    .option('--path <path>', 'File path (for edit_file)')
    .option('--old <text>', 'Old text to replace (for edit_file)')
    .option('--new <text>', 'New text (for edit_file)')
    .option('--action <action>', 'Action to perform (for codex_lens)')
    .option('--query <query>', 'Search query (for codex_lens)')
    .option('--limit <n>', 'Max results (for codex_lens)', '20')
    .option('--file <file>', 'File path for symbol extraction (for codex_lens)')
    .option('--files <files>', 'Comma-separated file paths (for codex_lens update)')
    .option('--languages <langs>', 'Comma-separated languages (for codex_lens init)')
    .action((subcommand, args, options) => toolCommand(subcommand, args, options));

  // Session command
  program
    .command('session [subcommand] [args...]')
    .description('Workflow session lifecycle management')
    .option('--location <loc>', 'Session location: active|lite-plan|lite-fix (init); Filter: active|archived|both (list)')
    .option('--type <type>', 'Content type or session type')
    .option('--content <json>', 'Content for write/update')
    .option('--task-id <id>', 'Task ID for task content')
    .option('--filename <name>', 'Filename for process/chat/etc')
    .option('--dimension <dim>', 'Dimension for review-dim')
    .option('--iteration <iter>', 'Iteration for review-iter')
    .option('--subdir <dir>', 'Subdirectory for mkdir')
    .option('--raw', 'Output raw content only')
    .option('--no-metadata', 'Exclude metadata from list')
    .option('--no-update-status', 'Skip status update on archive')
    .action((subcommand, args, options) => sessionCommand(subcommand, args, options));

  // CLI command
  program
    .command('cli [subcommand] [args...]')
    .description('Unified CLI tool executor (gemini/qwen/codex/claude)')
    .option('-p, --prompt <prompt>', 'Prompt text (alternative to positional argument)')
    .option('-f, --file <file>', 'Read prompt from file (best for multi-line prompts)')
    .option('--tool <tool>', 'CLI tool to use (reads from cli-settings.json defaultTool if not specified)')
    .option('--mode <mode>', 'Execution mode: analysis, write, auto', 'analysis')
    .option('-d, --debug', 'Enable debug logging for troubleshooting')
    .option('--model <model>', 'Model override')
    .option('--cd <path>', 'Working directory')
    .option('--includeDirs <dirs>', 'Additional directories (--include-directories for gemini/qwen, --add-dir for codex/claude)')
    // --timeout removed - controlled by external caller (bash timeout)
    .option('--stream', 'Enable streaming output (default: non-streaming with caching)')
    .option('--limit <n>', 'History limit')
    .option('--status <status>', 'Filter by status')
    .option('--category <category>', 'Execution category: user, internal, insight', 'user')
    .option('--resume [id]', 'Resume previous session (empty=last, or execution ID, or comma-separated IDs for merge)')
    .option('--id <id>', 'Custom execution ID (e.g., IMPL-001-step1)')
    .option('--no-native', 'Force prompt concatenation instead of native resume')
    .option('--cache [items]', 'Cache: comma-separated @patterns and text content')
    .option('--inject-mode <mode>', 'Inject mode: none, full, progressive (default: codex=full, others=none)')
    // Template/Rules options
    .option('--rule <template>', 'Template name for auto-discovery (defines $PROTO and $TMPL env vars)')
    // Codex review options
    .option('--uncommitted', 'Review uncommitted changes (codex review)')
    .option('--base <branch>', 'Review changes against base branch (codex review)')
    .option('--commit <sha>', 'Review changes from specific commit (codex review)')
    .option('--title <title>', 'Optional commit title for review summary (codex review)')
    // Storage options
    .option('--project <path>', 'Project path for storage operations')
    .option('--force', 'Confirm destructive operations')
    .option('--cli-history', 'Target CLI history storage')
    .option('--memory', 'Target memory storage')
    .option('--storage-cache', 'Target cache storage')
    .option('--config', 'Target config storage')
    // Cache subcommand options
    .option('--offset <n>', 'Character offset for cache pagination', '0')
    .option('--output-type <type>', 'Output type: stdout, stderr, both', 'both')
    .option('--turn <n>', 'Turn number for cache (default: latest)')
    .option('--raw', 'Raw output only (no formatting)')
    .option('--final', 'Output final result only with usage hint')
    .option('--to-file <path>', 'Save output to file')
    .action((subcommand, args, options) => cliCommand(subcommand, args, options));

  // Memory command
  program
    .command('memory [subcommand] [args...]')
    .description('Memory module for context tracking and prompt optimization')
    .option('--type <type>', 'Entity type: file, module, topic (track) OR source type: core_memory, workflow, cli_history (search)')
    .option('--action <action>', 'Action: read, write, mention')
    .option('--value <value>', 'Entity value (file path, etc.)')
    .option('--session <session>', 'Session ID')
    .option('--stdin', 'Read input from stdin (for Claude Code hooks)')
    .option('--source <source>', 'Import source: history, sessions, all', 'all')
    .option('--project <project>', 'Project name filter')
    .option('--limit <n>', 'Number of results (prompt search)', '20')
    .option('--sort <field>', 'Sort by: heat, reads, writes', 'heat')
    .option('--json', 'Output as JSON')
    .option('--context <text>', 'Current task context')
    .option('--older-than <age>', 'Age threshold for pruning', '30d')
    .option('--dry-run', 'Preview without deleting')
    .option('--id <id>', 'Memory/session ID (for embed command)')
    .option('--force', 'Force re-embed all chunks')
    .option('--batch-size <n>', 'Batch size for embedding', '8')
    .option('--top-k <n>', 'Number of semantic search results', '10')
    .option('--min-score <f>', 'Minimum similarity score for semantic search', '0.5')
    .action((subcommand, args, options) => memoryCommand(subcommand, args, options));

  // Core Memory command
  program
    .command('core-memory [subcommand] [args...]')
    .description('Manage core memory entries for strategic context')
    .option('--id <id>', 'Memory ID')
    .option('--all', 'Archive all memories')
    .option('--before <date>', 'Archive memories before date (YYYY-MM-DD)')
    .option('--interactive', 'Interactive selection')
    .option('--archived', 'List archived memories')
    .option('--limit <n>', 'Number of results', '50')
    .option('--json', 'Output as JSON')
    .option('--force', 'Skip confirmation')
    .option('--tool <tool>', 'Tool to use for summary: gemini, qwen', 'gemini')
    .option('--auto', 'Run auto-clustering')
    .option('--scope <scope>', 'Auto-cluster scope: all, recent, unclustered', 'recent')
    .option('--create', 'Create new cluster')
    .option('--name <name>', 'Cluster name')
    .option('--members <ids>', 'Cluster member IDs (comma-separated)')
    .option('--status <status>', 'Cluster status filter')
    .option('--level <level>', 'Context level: metadata, keyFiles, full')
    .option('--delete', 'Delete a cluster')
    .option('--merge <ids>', 'Merge clusters into target (comma-separated source IDs)')
    .option('--dedup', 'Deduplicate clusters by merging similar ones')
    .option('--output <file>', 'Output file path for export')
    .option('--overwrite', 'Overwrite existing memories when importing')
    .option('--prefix <prefix>', 'Add prefix to imported memory IDs')
    .action((subcommand, args, options) => coreMemoryCommand(subcommand, args, options));

  // Hook command - CLI endpoint for Claude Code hooks
  program
    .command('hook [subcommand] [args...]')
    .description('CLI endpoint for Claude Code hooks (session-context, notify)')
    .option('--stdin', 'Read input from stdin (for Claude Code hooks)')
    .option('--session-id <id>', 'Session ID')
    .option('--prompt <text>', 'Prompt text')
    .option('--type <type>', 'Context type: session-start, context')
    .action((subcommand, args, options) => hookCommand(subcommand, args, options));

  // Issue command - Issue lifecycle management with JSONL task tracking
  program
    .command('issue [subcommand] [args...]')
    .description('Issue lifecycle management with JSONL task tracking')
    .option('--title <title>', 'Task title')
    .option('--type <type>', 'Task type: feature, bug, refactor, test, chore, docs')
    .option('--status <status>', 'Task status')
    .option('--phase <phase>', 'Execution phase')
    .option('--description <desc>', 'Task description')
    .option('--depends-on <ids>', 'Comma-separated dependency task IDs')
    .option('--delivery-criteria <items>', 'Pipe-separated delivery criteria')
    .option('--pause-criteria <items>', 'Pipe-separated pause criteria')
    .option('--executor <type>', 'Executor: agent, codex, gemini, auto')
    .option('--priority <n>', 'Task priority (1-5)')
    .option('--format <fmt>', 'Output format: json, markdown')
    .option('--json', 'Output as JSON')
    .option('--brief', 'Brief JSON output (minimal fields)')
    .option('--force', 'Force operation')
    // New options for solution/queue management
    .option('--solution <path>', 'Solution JSON file path')
    .option('--solution-id <id>', 'Solution ID')
    .option('--data <json>', 'JSON data for create/solution')
    .option('--result <json>', 'Execution result JSON')
    .option('--reason <text>', 'Failure reason')
    .option('--fail', 'Mark task as failed')
    .option('--from-queue [queue-id]', 'Sync issue statuses from queue (default: active queue)')
    .option('--queue <queue-id>', 'Target queue ID for multi-queue operations')
    // GitHub pull options
    .option('--state <state>', 'GitHub issue state: open, closed, or all')
    .option('--limit <n>', 'Maximum number of issues to pull from GitHub')
    .option('--labels <labels>', 'Filter by GitHub labels (comma-separated)')
    .action((subcommand, args, options) => issueCommand(subcommand, args, options));

  // Learn workflow state commands (internal API for agents)
  program
    .command('learn:read-state')
    .description('Read learn workflow state (initializes default if missing)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnReadStateCommand(options));

  program
    .command('learn:update-state')
    .description('Update a single field in learn state (atomic + validated)')
    .requiredOption('--field <field>', 'Field to update: active_profile_id|active_session_id|current_phase')
    .requiredOption('--value <value>', 'Value to set (use "null" to clear)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnUpdateStateCommand(options));

  program
    .command('learn:read-profile')
    .description('Read learn profile by id (validated)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnReadProfileCommand(options));

  program
    .command('learn:write-profile')
    .description('Write learn profile by id (atomic + validated)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .requiredOption('--data <json>', 'Profile JSON string')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnWriteProfileCommand(options));

		  program
		    .command('learn:append-profile-event')
		    .description('Append an immutable profile event (NDJSON, lock-protected)')
		    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
		    .requiredOption('--type <type>', 'Event type (e.g. PRECONTEXT_CAPTURED|FIELD_SET)')
		    .option('--actor <actor>', 'Actor: user|agent|system (default: user)')
		    .option('--payload <json>', 'Event payload JSON string')
		    .option('--json', 'Output as JSON (recommended for agents)')
		    .action((options) => learnAppendProfileEventCommand(options));

		  program
		    .command('learn:append-profile-events-batch')
		    .description('Append multiple immutable profile events in one lock (NDJSON, lock-protected)')
		    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
		    .requiredOption('--events <json>', 'JSON array of {type, actor?, payload?}')
		    .option('--json', 'Output as JSON (recommended for agents)')
		    .action((options) => learnAppendProfileEventsBatchCommand(options));

	  program
	    .command('learn:propose-inferred-skill')
	    .description('Propose an inferred skill (agent/system) with cooldown + new evidence gating after rejection')
	    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
	    .requiredOption('--topic-id <id>', 'Inferred skill topic id (normalized to lowercase)')
	    .requiredOption('--proficiency <n>', 'Proposed proficiency (0..1)')
	    .option('--confidence <n>', 'Proposed confidence (0..1)')
	    .requiredOption('--evidence <text>', 'Evidence text (used for new-evidence gating)')
	    .option('--actor <actor>', 'Actor: user|agent|system (default: agent)')
	    .option('--json', 'Output as JSON (recommended for agents)')
	    .action((options) => learnProposeInferredSkillCommand(options));

	  program
	    .command('learn:confirm-inferred-skill')
	    .description('Confirm an inferred skill (must be actor=user; no auto-confirm)')
	    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
	    .requiredOption('--topic-id <id>', 'Inferred skill topic id (normalized to lowercase)')
	    .option('--actor <actor>', 'Actor: must be user (default: user)')
	    .option('--json', 'Output as JSON (recommended for agents)')
	    .action((options) => learnConfirmInferredSkillCommand(options));

	  program
	    .command('learn:reject-inferred-skill')
	    .description('Reject an inferred skill (must be actor=user; blocks re-propose until cooldown + new evidence)')
	    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
	    .requiredOption('--topic-id <id>', 'Inferred skill topic id (normalized to lowercase)')
	    .option('--reason <text>', 'Optional rejection reason')
	    .option('--actor <actor>', 'Actor: must be user (default: user)')
	    .option('--json', 'Output as JSON (recommended for agents)')
	    .action((options) => learnRejectInferredSkillCommand(options));
	
	  program
	    .command('learn:append-telemetry-event')
	    .description('Append a telemetry event (NDJSON, lock-protected)')
	    .requiredOption('--event <name>', 'Telemetry event name')
    .option('--profile-id <id>', 'Optional profile id')
    .option('--session-id <id>', 'Optional session id')
    .option('--payload <json>', 'Event payload JSON string')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnAppendTelemetryEventCommand(options));

  program
    .command('learn:read-profile-snapshot')
    .description('Read learn profile snapshot by id (validated)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnReadProfileSnapshotCommand(options));

  program
    .command('learn:rebuild-profile-snapshot')
    .description('Rebuild learn profile snapshot from immutable events (lock-protected)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .option('--target-version <n>', 'Optional target event version (fold point)')
    .option('--no-persist', 'Do not persist rebuilt snapshot to disk')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnRebuildProfileSnapshotCommand(options));

  program
    .command('learn:rollback-profile')
    .description('Rollback snapshot view by appending ROLLBACK_TO_VERSION (no event deletion)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .requiredOption('--target-version <n>', 'Target event version to roll back to (0..head)')
    .option('--actor <actor>', 'Actor: user|agent|system (default: user)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnRollbackProfileCommand(options));

  program
    .command('learn:list-profiles')
    .description('List learn profiles (validated summaries)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnListProfilesCommand(options));

  program
    .command('learn:set-active-profile')
    .description('Set active learn profile id (validated + persists state)')
    .requiredOption('--profile-id <id>', 'Profile id (filename stem)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnSetActiveProfileCommand(options));

  program
    .command('learn:read-session')
    .description('Read learn session plan + progress (best-effort, lock-protected)')
    .requiredOption('--session-id <id>', 'Session id (folder name, e.g. LS-YYYYMMDD-NNN)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnReadSessionCommand(options));

  program
    .command('learn:update-progress')
    .description('Update learn session progress for a single knowledge point (atomic + lock-protected)')
    .requiredOption('--session-id <id>', 'Session id (folder name, e.g. LS-YYYYMMDD-NNN)')
    .requiredOption('--topic-id <id>', 'Knowledge point id (e.g. KP-1)')
    .requiredOption('--status <status>', 'Status (e.g. in_progress|completed)')
    .option('--evidence <json>', 'Evidence JSON string')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnUpdateProgressCommand(options));

  program
    .command('learn:resolve-pack-key')
    .description('Resolve canonical assessment pack_key for a topic (stable defaults)')
    .requiredOption('--topic-id <id>', 'Topic id (canonical taxonomy id)')
    .option('--taxonomy-version <v>', 'Taxonomy version (default: v0)')
    .option('--rubric-version <v>', 'Rubric version (default: v0)')
    .option('--question-bank-version <v>', 'Question bank version (default: taxonomy_version)')
    .option('--language <lang>', 'Language tag (default: zh-CN)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnResolvePackKeyCommand(options));

  program
    .command('learn:read-pack')
    .description('Read assessment pack by pack_key (or by individual key fields)')
    .option('--pack-key <json>', 'Pack key JSON (overrides individual fields)')
    .option('--topic-id <id>', 'Topic id (required if --pack-key not provided)')
    .option('--taxonomy-version <v>', 'Taxonomy version (default: v0)')
    .option('--rubric-version <v>', 'Rubric version (default: v0)')
    .option('--question-bank-version <v>', 'Question bank version (default: taxonomy_version)')
    .option('--language <lang>', 'Language tag (default: zh-CN)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnReadPackCommand(options));

  program
    .command('learn:write-pack')
    .description('Write (overwrite) assessment pack JSON to .workflow/learn/packs/*')
    .requiredOption('--pack <json>', 'Full pack JSON (must include pack_key and questions[])')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnWritePackCommand(options));

  program
    .command('learn:pack-status')
    .description('Compute assessment pack completeness status (seed/full gate)')
    .option('--pack-key <json>', 'Pack key JSON (overrides individual fields)')
    .option('--topic-id <id>', 'Topic id (required if --pack-key not provided)')
    .option('--taxonomy-version <v>', 'Taxonomy version (default: v0)')
    .option('--rubric-version <v>', 'Rubric version (default: v0)')
    .option('--question-bank-version <v>', 'Question bank version (default: taxonomy_version)')
    .option('--language <lang>', 'Language tag (default: zh-CN)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnPackStatusCommand(options));

  program
    .command('learn:ensure-pack')
    .description('Ensure an assessment pack exists (seed=4 or full completeness)')
    .requiredOption('--topic-id <id>', 'Canonical taxonomy topic_id')
    .option('--mode <mode>', 'auto|seed|full (default: auto)')
    .option('--language <lang>', 'Language tag (default: zh-CN)')
    .option('--seed-questions <n>', 'Seed question count (default: 4)')
    .option('--force', 'Force overwrite even if pack exists')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnEnsurePackCommand(options));

  program
    .command('learn:resolve-topic')
    .description('Resolve raw topic label to canonical taxonomy topic_id (taxonomy-first)')
    .requiredOption('--raw-topic-label <text>', 'Raw topic label (user/agent text)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnResolveTopicCommand(options));

  program
    .command('learn:ensure-topic')
    .description('Ensure topic exists in taxonomy (creates provisional when missing)')
    .requiredOption('--raw-topic-label <text>', 'Raw topic label (user/agent text)')
    .option('--actor <actor>', 'Actor: user|agent|system (default: agent)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnEnsureTopicCommand(options));

  program
    .command('learn:taxonomy-alias')
    .description('Add an alias to a canonical topic_id (audited)')
    .requiredOption('--topic-id <id>', 'Canonical taxonomy topic_id')
    .requiredOption('--alias <text>', 'Alias text to add')
    .option('--actor <actor>', 'Actor: user|agent|system (default: agent)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnTaxonomyAliasCommand(options));

  program
    .command('learn:taxonomy-redirect')
    .description('Redirect one topic_id to another (merge/rename without breaking history)')
    .requiredOption('--from-topic-id <id>', 'Source topic_id (will become status=redirect)')
    .requiredOption('--to-topic-id <id>', 'Target topic_id (canonical)')
    .option('--actor <actor>', 'Actor: user|agent|system (default: agent)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnTaxonomyRedirectCommand(options));

  program
    .command('learn:taxonomy-promote')
    .description('Promote provisional topic to active (requires regression>=30)')
    .requiredOption('--topic-id <id>', 'Canonical topic_id to promote')
    .option('--actor <actor>', 'Actor: user|agent|system (default: agent)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnTaxonomyPromoteCommand(options));

  program
    .command('learn:parse-background')
    .description('Parse background text into inferred skills (JSON)')
    .option('--text <text>', 'Background text (mutually exclusive with --file)')
    .option('--file <path>', 'Read background text from file (mutually exclusive with --text)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnParseBackgroundCommand(options));

  program
    .command('learn:adaptive-step')
    .description('Pure adaptive assessment step (no interaction)')
    .requiredOption('--state <json>', 'Adaptive assessment state JSON')
    .requiredOption('--round-result <json>', 'Round result JSON (correct_ratio/consistency, optional target_difficulty/question_count)')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnAdaptiveStepCommand(options));

  program
    .command('learn:validate-questions')
    .description('Validate generated questions against quality rules')
    .requiredOption('--target-difficulty <0-1>', 'Target difficulty for validation (0..1)')
    .requiredOption('--questions <json>', 'Questions JSON string (array or {questions: []})')
    .option('--json', 'Output as JSON (recommended for agents)')
    .action((options) => learnValidateQuestionsCommand(options));

  // Loop command - Loop management for multi-CLI orchestration
  program
    .command('loop [subcommand] [args...]')
    .description('Loop management for automated multi-CLI execution')
    .option('--session <name>', 'Specify workflow session')
    .action((subcommand, args, options) => loopCommand(subcommand, args, options));

  // Workflow command - Workflow installation and management
  program
    .command('workflow [subcommand] [args...]')
    .description('Workflow installation and management (install, list, sync)')
    .option('-f, --force', 'Force installation without prompts')
    .option('--source <source>', 'Install specific source only')
    .action((subcommand, args, options) => workflowCommand(subcommand, args, options));

  program.parse(argv);
}
