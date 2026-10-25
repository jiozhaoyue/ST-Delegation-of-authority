import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerBackupRoutes } from './backup-routes.js';
import type { AuthorityRuntime } from '../runtime.js';
import type { AuthorityRequest, AuthorityResponse } from '../types.js';

/** 最小桩：真实临时目录当用户数据根，收集型 res */
function makeHarness(selection: Record<string, unknown>) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'st-backup-test-'));
    fs.mkdirSync(path.join(root, 'characters'), { recursive: true });
    fs.mkdirSync(path.join(root, 'chats'), { recursive: true });
    fs.writeFileSync(path.join(root, 'characters', 'card.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    fs.writeFileSync(path.join(root, 'chats', 'chat.jsonl'), Buffer.from('{"m":1}\n'));
    fs.writeFileSync(path.join(root, 'secrets.json'), Buffer.from('{}'));
    fs.writeFileSync(path.join(root, 'settings.json'), Buffer.from('{}'));

    const chunks: Buffer[] = [];
    const headers: Record<string, string> = {};
    let statusCode = 200;
    const res: AuthorityResponse = {
        status(code) { statusCode = code; return this; },
        json(data: unknown) { chunks.push(Buffer.from(JSON.stringify(data))); },
        send() { /* unused */ },
        setHeader(name, value) { headers[name] = value; },
        write(chunk) { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); },
        end() { /* flush marker */ },
    };

    const runtime = {
        sessions: { assertSession: async () => ({ extension: { id: 'test-ext' } }) },
        audit: { logUsage: async () => undefined },
    } as unknown as AuthorityRuntime;

    const handlers = new Map<string, (req: AuthorityRequest, res: AuthorityResponse) => Promise<void> | void>();
    const router = {
        get(p: string, _h: unknown) { handlers.set(`GET ${p}`, undefined as never); },
        post(p: string, h: (req: AuthorityRequest, res: AuthorityResponse) => Promise<void> | void) { handlers.set(`POST ${p}`, h); },
    };
    registerBackupRoutes(router, runtime, () => undefined as never);

    const req = {
        body: { selection },
        user: {
            profile: { handle: 'default-user', admin: true },
            directories: { root },
        },
        headers: {},
    } as unknown as AuthorityRequest;

    return {
        root,
        run: async () => {
            const h = handlers.get('POST /host/st-backup');
            if (!h) throw new Error('route not registered');
            await h(req, res);
            return { statusCode, headers, body: Buffer.concat(chunks) };
        },
    };
}

/** 极简 stored-zip 解析：列出全部条目名 */
function listEntries(zip: Buffer): string[] {
    let eocd = -1;
    for (let i = zip.length - 22; i >= 0; i -= 1) {
        if (zip.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('EOCD not found');
    const count = zip.readUInt16LE(eocd + 10);
    const cdOffset = zip.readUInt32LE(eocd + 16);
    const names: string[] = [];
    let p = cdOffset;
    for (let i = 0; i < count; i += 1) {
        if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central record at ${p}`);
        const nameLen = zip.readUInt16LE(p + 28);
        names.push(zip.toString('utf8', p + 46, p + 46 + nameLen));
        p += 46 + nameLen;
    }
    return names;
}

describe('registerBackupRoutes /host/st-backup', () => {
    it('注册了 POST /host/st-backup', () => {
        const posts: string[] = [];
        registerBackupRoutes({
            get: () => undefined, post: (p: string) => posts.push(p),
        } as never, {} as AuthorityRuntime, () => undefined as never);
        expect(posts).toContain('/host/st-backup');
    });

    it('selection 差分：只勾 characters ⇒ 产物只含 characters 条目（AC-1）', async () => {
        const h = makeHarness({ characters: true });
        const { statusCode, headers, body } = await h.run();
        expect(statusCode).toBe(200);
        expect(headers['Content-Type']).toBe('application/zip');
        const names = listEntries(body);
        expect(names).toEqual(['characters/card.png']);
        expect(names.some((n) => n.startsWith('chats/'))).toBe(false);
        expect(names.includes('secrets.json')).toBe(false);
    });

    it('多类目勾选 ⇒ 对应条目全在，产物是合法 stored zip', async () => {
        const h = makeHarness({ characters: true, chats: true, secrets: true });
        const { body } = await h.run();
        expect(listEntries(body).sort()).toEqual(['characters/card.png', 'chats/chat.jsonl', 'secrets.json'].sort());
    });

    it('空 selection / 全 false ⇒ 400 且带可读错误体（对齐宿主原生语义）', async () => {
        const h = makeHarness({ characters: false });
        const { statusCode, body } = await h.run();
        expect(statusCode).toBe(400);
        expect(body.toString('utf8')).toContain('At least one backup category');
    });

    it('类目目录不存在（vectors/globalExtensions 无路径）⇒ 静默跳过不报错', async () => {
        const h = makeHarness({ vectors: true, characters: true });
        const { statusCode, body } = await h.run();
        expect(statusCode).toBe(200);
        expect(listEntries(body)).toEqual(['characters/card.png']);
    });
});
