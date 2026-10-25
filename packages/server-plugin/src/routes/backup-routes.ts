import fs from 'node:fs/promises';
import path from 'node:path';
import { AUTHORITY_SDK_EXTENSION_ID } from '../constants.js';
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
 * 整包恢复（写宿主目录）属高危面，留待治理裁定后另开路由，本文件不做。
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
}
