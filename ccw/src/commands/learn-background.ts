import chalk from 'chalk';
import { existsSync, readFileSync, realpathSync } from 'fs';
import { resolve, join } from 'path';
import { getPackageRoot } from '../utils/project-root.js';
import { parseBackground } from '../learn/background-parser.js';

interface BaseOptions {
  json?: boolean;
}

interface ParseBackgroundOptions extends BaseOptions {
  text?: string;
  file?: string;
}

type ResultOk<T> = { ok: true; data: T };
type ResultErr = { ok: false; error: { code: string; message: string; details?: any } };
type Result<T> = ResultOk<T> | ResultErr;

function print<T>(options: BaseOptions, payload: Result<T>): void {
  if (options.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
    return;
  }

  if (payload.ok) {
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓ OK'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(JSON.stringify(payload.data, null, 2)));
    return;
  }

  // eslint-disable-next-line no-console
  console.error(chalk.red(`✗ ${payload.error.code}: ${payload.error.message}`));
  if (payload.error.details) {
    // eslint-disable-next-line no-console
    console.error(chalk.gray(JSON.stringify(payload.error.details, null, 2)));
  }
}

function fail<T>(options: BaseOptions, error: ResultErr['error']): never {
  print(options, { ok: false, error } as Result<T>);
  process.exit(1);
}

const PROJECT_ROOT = (() => {
  const raw = process.env.CCW_PROJECT_ROOT || getPackageRoot();
  const absolute = resolve(raw);
  try {
    return realpathSync(absolute);
  } catch {
    return absolute;
  }
})();

function loadKeywordDictionary(): any {
  const dictPath = join(PROJECT_ROOT, '.workflow', 'learn', 'tech-stack', 'KeywordDictionary.json');
  if (!existsSync(dictPath)) {
    throw Object.assign(new Error(`Keyword dictionary not found: ${dictPath}`), { code: 'NOT_FOUND' });
  }
  const raw = readFileSync(dictPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err: any) {
    throw Object.assign(new Error('Keyword dictionary contains invalid JSON'), {
      code: 'INVALID_JSON',
      details: err?.message ?? String(err)
    });
  }
}

export async function learnParseBackgroundCommand(options: ParseBackgroundOptions): Promise<void> {
  const text = options.text;
  const file = options.file;
  if ((text && file) || (!text && !file)) {
    fail(options, { code: 'INVALID_ARGS', message: 'Provide exactly one of --text or --file' });
  }

  let input = '';
  try {
    input = text ? String(text) : readFileSync(String(file), 'utf8');
  } catch (err: any) {
    fail(options, { code: 'IO_ERROR', message: err?.message ?? String(err) });
  }

  try {
    const dict = loadKeywordDictionary();
    if (!dict || typeof dict !== 'object' || !dict.categories || typeof dict.categories !== 'object') {
      fail(options, { code: 'INVALID_DICT', message: 'Keyword dictionary must contain a categories object' });
    }

    const parsed = await parseBackground(input, dict);
    print(options, { ok: true, data: { skills: parsed.skills, truncated: parsed.truncated } });
  } catch (err: any) {
    fail(options, { code: err?.code ?? 'PARSE_ERROR', message: err?.message ?? String(err), details: err?.details });
  }
}
