import fs from 'node:fs/promises';
import path from 'node:path';
import { AUTHORITY_SDK_EXTENSION_ID } from '../constants.js';
import { readZipArchive } from '../services/zip-archive.js';
import type { AuthorityRuntime } from '../runtime.js';
import type { AuthorityRequest, AuthorityResponse } from '../types.js';
import { getSessionToken, getUserContext } from '../utils.js';

/**
 * ST 选择性备份路由（任务 10-25-st-backup-capability · R1）。
 *
 * 为什么存在：ST 宿主原生 `POST /api/users/backup` 忽略 selection（必全量打包），
 * 消费方（st-zip-converter 等）只能全量拉回浏览器再过滤。本路由在 Authority
 * 可移植子集内补「类目级选择性备份」：POST body `{ selection: {<category>: boolean} }`，
 * 只把勾选类目打进 zip（stored 无压缩、**流式**输出——GB 级数据不驻留内存）。
 *
 * 粒度=类目级（与 Luker 原生 selection 同构）；不臆造文件/路径级粒度。
 *
 * 对偶恢复端点 `POST /host/st-restore` 同在本文件：ST 1.19 无整包恢复端点，
 * 消费方需要可写回用户目录的恢复通道。镜像 Luker restore-backup 契约
 * （multipart ZIP + selection 十类目 + mode merge/overwrite），与 st-manager
 * 恢复桥分工（后者面向运维管理控制面，本端点面向插件数据包用户数据面）。
 * 「增量」= 按 selection 类目写入，非字节 diff。
 */

type RouterLike = {
    get(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
    post(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
};

type RouteFailureHandler = (runtime: AuthorityRuntime, req: AuthorityRequest, res: AuthorityResponse, extensionId: string, error: unknown) => void;

/** ST 标准类目 → 用户数据根下的路径（目录或单文件）。空数组占位=该类目无对应路径。 */
const CATEGORY_PATHS: Record<string, string[]> = {
    characters: ['characters'],
    chats: ['chats'],
    lorebooks: ['worlds'],
    presets: ['OpenAI Settings', 'KoboldAI Settings', 'NovelAI Settings', 'TextGen Settings', 'context', 'instruct', 'sysprompt', 'reasoning', 'QuickReplies'],
    settings: ['settings.json'],
    secrets: ['secrets.json'],
    assets: ['User Avatars', 'backgrounds', 'themes'],
    extensions: ['extensions'],
    globalExtensions: [],
    vectors: ['vectors'],
};

/** CRC-32（IEEE 802.3，查表法）——stored zip 条目的必要校验 */
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(buf: Buffer, seed = 0): number {
    let c = (seed ^ 0xffffffff) >>> 0;
    for (let i = 0; i < buf.length; i += 1) c = ((CRC_TABLE[(c ^ buf[i]!) & 0xff] ?? 0) ^ (c >>> 8)) >>> 0;
    return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntryMeta {
    name: string;
    crc: number;
    size: number;
    offset: number;
}

/** 收集一个类目路径（目录递归 / 单文件直收）下全部文件；不存在则静默跳过（该类目为空） */
async function collectFiles(absRoot: string, relPath: string, out: { rel: string; abs: string }[]): Promise<void> {
    const abs = path.join(absRoot, relPath);
    let stat: import('node:fs').Stats;
    try {
        stat = await fs.stat(abs);
    } catch {
        return; // 类目路径不存在 = 该类目为空
    }
    if (stat.isFile()) {
        out.push({ rel: relPath, abs });
        return;
    }
    if (!stat.isDirectory()) return;
    let dirEntries: import('node:fs').Dirent[];
    try {
        dirEntries = await fs.readdir(abs, { withFileTypes: true });
    } catch {
        return;
    }
    for (const d of dirEntries) {
        if (d.name === '.git' || d.name === 'node_modules') continue;
        const rel = `${relPath}/${d.name}`;
        if (d.isDirectory()) await collectFiles(absRoot, rel, out);
        else if (d.isFile()) out.push({ rel, abs: path.join(absRoot, rel) });
    }
}

function dosDateTime(date: Date): { time: number; date: number } {
    const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
    const d = (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f);
    return { time, date: d };
}

function localHeader(nameBuf: Buffer, crc: number, size: number, { time, date }: { time: number; date: number }): Buffer {
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0);   // signature
    h.writeUInt16LE(20, 4);           // version needed
    h.writeUInt16LE(0, 6);            // flags
    h.writeUInt16LE(0, 8);            // method: stored
    h.writeUInt16LE(time, 10);
    h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(size, 18);        // compressed
    h.writeUInt32LE(size, 22);        // uncompressed
    h.writeUInt16LE(nameBuf.length, 26);
    h.writeUInt16LE(0, 28);           // extra len
    return h;
}

function centralRecord(meta: ZipEntryMeta, { time, date }: { time: number; date: number }): Buffer {
    const nameBuf = Buffer.from(meta.name, 'utf8');
    const h = Buffer.alloc(46);
    h.writeUInt32LE(0x02014b50, 0);
    h.writeUInt16LE(20, 4);           // version made by
    h.writeUInt16LE(20, 6);           // version needed
    h.writeUInt16LE(0, 8);
    h.writeUInt16LE(0, 10);           // stored
    h.writeUInt16LE(time, 12);
    h.writeUInt16LE(date, 14);
    h.writeUInt32LE(meta.crc, 16);
    h.writeUInt32LE(meta.size, 20);
    h.writeUInt32LE(meta.size, 24);
    h.writeUInt16LE(nameBuf.length, 28);
    h.writeUInt16LE(0, 30);           // extra
    h.writeUInt16LE(0, 32);           // comment
    h.writeUInt16LE(0, 34);           // disk
    h.writeUInt16LE(0, 36);           // internal attrs
    h.writeUInt32LE(0, 38);           // external attrs
    h.writeUInt32LE(meta.offset, 42);
    return Buffer.concat([h, nameBuf]);
}

function endRecord(count: number, cdSize: number, cdOffset: number): Buffer {
    const h = Buffer.alloc(22);
    h.writeUInt32LE(0x06054b50, 0);
    h.writeUInt16LE(0, 4);
    h.writeUInt16LE(0, 6);
    h.writeUInt16LE(count, 8);
    h.writeUInt16LE(count, 10);
    h.writeUInt32LE(cdSize, 12);
    h.writeUInt32LE(cdOffset, 16);
    h.writeUInt16LE(0, 20);
    return h;
}

/** 恢复模式：merge=只写缺失/内容有变化的文件；overwrite=无条件覆盖。 */
type RestoreMode = 'merge' | 'overwrite';

/** 从请求体提取 ZIP 字节：兼容 multipart 解析后的文件字段与整包 base64 两种承载。 */
function extractArchiveBytes(body: unknown): Buffer | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const candidate = b.avatar ?? b.archive ?? b.zip ?? b.file;
    if (Buffer.isBuffer(candidate)) return candidate;
    if (candidate instanceof Uint8Array) return Buffer.from(candidate);
    if (typeof candidate === 'string') {
        const cleaned = candidate.replace(/^data:[^;]*;base64,/, '');
        return cleaned ? Buffer.from(cleaned, 'base64') : null;
    }
    return null;
}

/** selection 兼容 JSON 字符串（multipart 字段）与对象（JSON body）两种形态。 */
function parseRestoreSelection(raw: unknown): Record<string, unknown> {
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
        } catch {
            return {};
        }
    }
    return raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
}

/** 判断归档条目相对路径归属哪个 selection 类目；未命中返回 null。 */
function categoryOfEntry(rel: string): string | null {
    for (const [category, paths] of Object.entries(CATEGORY_PATHS)) {
        for (const p of paths) {
            if (rel === p || rel.startsWith(`${p}/`)) return category;
        }
    }
    return null;
}

/** 单条目落盘；返回是否实际写入。路径穿越由 zip-archive 规范化 + 此处绝对路径校验双重拦截。 */
async function writeRestoredEntry(rootDir: string, rel: string, bytes: Buffer, mode: RestoreMode): Promise<boolean> {
    const abs = path.resolve(rootDir, rel);
    const rootAbs = path.resolve(rootDir);
    if (abs !== rootAbs && !abs.startsWith(`${rootAbs}${path.sep}`)) {
        throw new Error('Zip entry escapes user data root');
    }
    if (mode === 'merge') {
        try {
            if ((await fs.readFile(abs)).equals(bytes)) return false; // 内容相同 → 跳过
        } catch { /* 文件缺失或不可读 → 写入 */ }
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);
    return true;
}

export function registerBackupRoutes(router: RouterLike, runtime: AuthorityRuntime, fail: RouteFailureHandler): void {
    router.post('/host/st-backup', async (req, res) => {
        const extensionId = AUTHORITY_SDK_EXTENSION_ID;
        try {
            const user = getUserContext(req);
            await runtime.sessions.assertSession(getSessionToken(req), user);

            const selection = (req.body && typeof req.body.selection === 'object' && req.body.selection)
                ? req.body.selection as Record<string, unknown> : {};
            const known = Object.keys(CATEGORY_PATHS);
            const chosen = known.filter((k) => selection[k] === true);
            if (chosen.length === 0) {
                res.status(400).json({ error: 'At least one backup category must be selected.', code: 'bad-request' });
                return;
            }

            const rootDir = String(user.directories?.root ?? user.rootDir ?? '');
            if (!rootDir) {
                res.status(500).json({ error: 'Host user data root unavailable.', code: 'internal' });
                return;
            }
            const files: { rel: string; abs: string }[] = [];
            for (const category of chosen) {
                for (const rel of CATEGORY_PATHS[category] ?? []) {
                    await collectFiles(String(rootDir), rel, files);
                }
            }

            // 流式写出 stored zip：逐文件 local header + 分块数据；最后集中 central directory
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${user.handle}-selective.zip"`);
            res.setHeader('Transfer-Encoding', 'chunked');

            const stamp = dosDateTime(new Date());
            const metas: ZipEntryMeta[] = [];
            let offset = 0;
            for (const file of files) {
                const stat = await fs.stat(file.abs);
                const nameBuf = Buffer.from(file.rel, 'utf8');
                const crc = crc32(await fs.readFile(file.abs)); // 读一次算 CRC（文件级驻留；
                // 类目资产多为中小文件；超大单文件优化留待需要时改两遍流式）
                const header = localHeader(nameBuf, crc, stat.size, stamp);
                res.write(header);
                res.write(nameBuf);
                await new Promise<void>((resolve, reject) => {
                    const stream = require('node:fs').createReadStream(file.abs, { highWaterMark: 1 << 20 });
                    stream.on('data', (chunk: Buffer) => { res.write(chunk); });
                    stream.on('end', () => resolve());
                    stream.on('error', reject);
                });
                metas.push({ name: file.rel, crc, size: stat.size, offset });
                offset += header.length + nameBuf.length + stat.size;
            }
            const cdOffset = offset;
            let cdSize = 0;
            for (const meta of metas) {
                const rec = centralRecord(meta, stamp);
                res.write(rec);
                cdSize += rec.length;
            }
            res.write(endRecord(metas.length, cdSize, cdOffset));
            res.end();
        } catch (error) {
            fail(runtime, req, res, extensionId, error);
        }
    });

    // 对偶恢复端点：镜像 Luker restore-backup 契约（整包 multipart/base64 ZIP
    // + 十类目 selection + mode merge/overwrite）。分片 uploads/chunks/finalize
    // 协议留待后续迭代；本轮先交付整包解包与按类目落盘。
    router.post('/host/st-restore', async (req, res) => {
        const extensionId = AUTHORITY_SDK_EXTENSION_ID;
        try {
            const user = getUserContext(req);
            await runtime.sessions.assertSession(getSessionToken(req), user);

            const body = req.body as Record<string, unknown> | undefined;
            const archive = extractArchiveBytes(body);
            if (!archive || archive.length === 0) {
                res.status(400).json({ error: 'A ZIP archive is required for restore.', code: 'bad-request' });
                return;
            }

            const selection = parseRestoreSelection(body?.selection);
            const chosen = new Set(Object.keys(CATEGORY_PATHS).filter((k) => selection[k] === true));
            if (chosen.size === 0) {
                res.status(400).json({ error: 'At least one restore category must be selected.', code: 'bad-request' });
                return;
            }

            const rawMode = String(body?.mode ?? 'merge').toLowerCase();
            const mode: RestoreMode = rawMode === 'overwrite' ? 'overwrite' : 'merge';

            const rootDir = String(user.directories?.root ?? user.rootDir ?? '');
            if (!rootDir) {
                res.status(500).json({ error: 'Host user data root unavailable.', code: 'internal' });
                return;
            }

            const entries = readZipArchive(archive);
            let restoredCount = 0;
            let skippedCount = 0;
            for (const [rel, bytes] of entries) {
                if (!chosen.has(categoryOfEntry(rel) ?? '')) {
                    skippedCount += 1; // 未勾选类目 → 跳过
                    continue;
                }
                if (await writeRestoredEntry(rootDir, rel, bytes, mode)) restoredCount += 1;
                else skippedCount += 1;
            }
            res.status(200).json({ restoredCount, skippedCount, mode });
        } catch (error) {
            fail(runtime, req, res, extensionId, error);
        }
    });
}
