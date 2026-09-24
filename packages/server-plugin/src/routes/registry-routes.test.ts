import { describe, expect, it, vi } from 'vitest';
import type { AuthorityRuntime } from '../runtime.js';
import type { AuthorityRequest, AuthorityResponse, SessionRecord } from '../types.js';
import { registerRegistryRoutes } from './registry-routes.js';

type Handler = (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>;

describe('registry routes', () => {
    it('lists extensions for a sessioned user', async () => {
        const fixture = setup();
        const res = response();
        await fixture.get.get('/registry/extensions')!(request(), res.res);

        expect(fixture.runtime.sessions.assertSession).toHaveBeenCalledTimes(1);
        const payload = vi.mocked(res.res.json).mock.calls[0]![0] as { count: number; records: unknown[] };
        expect(payload.count).toBeGreaterThan(0);
        expect(payload.records[0]).toMatchObject({ extensionId: 'third-party/ext-a' });
    });

    it('returns 404 for an unknown extension id', async () => {
        const fixture = setup();
        const res = response();
        await fixture.get.get('/registry/extensions/:extensionId')!(
            request({ params: { extensionId: 'third-party/missing' } }),
            res.res,
        );

        expect(res.res.status).toHaveBeenCalledWith(404);
        expect(res.res.json).toHaveBeenCalledWith({ error: 'extension_not_found' });
    });

    it('returns the detail view for a known extension', async () => {
        const fixture = setup();
        const res = response();
        await fixture.get.get('/registry/extensions/:extensionId')!(
            request({ params: { extensionId: 'third-party/ext-a' } }),
            res.res,
        );

        const payload = vi.mocked(res.res.json).mock.calls[0]![0] as { record: { extensionId: string } };
        expect(payload.record.extensionId).toBe('third-party/ext-a');
    });

    it('rejects refresh with 403 for a non-admin user', async () => {
        const fixture = setup();
        const res = response();
        await fixture.post.get('/registry/refresh')!(request(), res.res);

        expect(res.res.status).toHaveBeenCalledWith(403);
        expect(res.res.json).toHaveBeenCalledWith({ error: 'admin_required' });
        expect(fixture.runtime.sessions.assertSession).not.toHaveBeenCalled();
    });

    it('refreshes the snapshot for an admin user', async () => {
        const fixture = setup();
        const res = response();
        await fixture.post.get('/registry/refresh')!(request({ admin: true }), res.res);

        expect(fixture.runtime.sessions.assertSession).toHaveBeenCalledTimes(1);
        const payload = vi.mocked(res.res.json).mock.calls[0]![0] as { refreshed: boolean; generatedAt: string };
        expect(payload.refreshed).toBe(true);
        expect(typeof payload.generatedAt).toBe('string');
    });

    it('fails closed when the session assertion rejects', async () => {
        const fixture = setup();
        fixture.runtime.sessions.assertSession = vi.fn().mockRejectedValue(new Error('invalid session')) as never;
        const res = response();

        await expect(
            fixture.get.get('/registry/extensions')!(request(), res.res),
        ).rejects.toThrow('invalid session');
    });
});

function setup() {
    const get = new Map<string, Handler>();
    const post = new Map<string, Handler>();
    const session = {
        token: 'session-token',
        userHandle: 'alice',
        isAdmin: false,
        extension: { id: 'third-party/ext-a', displayName: 'Ext A', version: '1.0.0', installType: 'local' },
    } as SessionRecord;
    const runtime = {
        sessions: { assertSession: vi.fn().mockResolvedValue(session) },
        extensions: {
            listExtensions: vi.fn().mockResolvedValue([
                {
                    id: 'third-party/ext-a',
                    displayName: 'Ext A',
                    version: '1.0.0',
                    installType: 'local',
                    firstSeenAt: '2026-09-24T00:00:00.000Z',
                    declaredPermissions: { storage: { kv: true } },
                },
            ]),
        },
        install: { getSillyTavernRoot: vi.fn().mockReturnValue(null) },
        modules: { listRecords: vi.fn().mockReturnValue([]) },
        audit: { getRecentActivity: vi.fn().mockResolvedValue({ permissions: [], usage: [], errors: [], warnings: [] }) },
        registries: new Map(),
    } as unknown as AuthorityRuntime;
    const fail = vi.fn((_runtime, _req, _res, _extensionId, error: unknown) => {
        throw error;
    });
    registerRegistryRoutes({
        get: (path, handler) => get.set(path, handler),
        post: (path, handler) => post.set(path, handler),
    }, runtime, fail);
    return { runtime, session, get, post };
}

function request(options: {
    body?: unknown;
    params?: Record<string, string>;
    handle?: string;
    admin?: boolean;
} = {}): AuthorityRequest {
    return {
        headers: { 'x-authority-session-token': 'session-token' },
        ...(options.body === undefined ? {} : { body: options.body }),
        ...(options.params === undefined ? {} : { params: options.params }),
        user: {
            profile: { handle: options.handle ?? 'alice', admin: options.admin ?? false },
            directories: { root: `C:\\users\\${options.handle ?? 'alice'}` },
        },
    };
}

function response(): { res: AuthorityResponse } {
    const res = {} as AuthorityResponse;
    Object.assign(res, {
        status: vi.fn(() => res),
        json: vi.fn(),
        send: vi.fn(),
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        on: vi.fn(),
    });
    return { res };
}
