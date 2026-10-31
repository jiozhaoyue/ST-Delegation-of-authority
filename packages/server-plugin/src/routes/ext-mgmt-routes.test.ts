import { describe, expect, it, vi } from 'vitest';
import type { AuthorityRuntime } from '../runtime.js';
import { AUTHORITY_SDK_EXTENSION_ID, buildAuthorityFeatureFlags } from '../constants.js';
import { ExtMgmtServiceError } from '../services/ext-mgmt-service.js';
import { registerExtMgmtRoutes } from './ext-mgmt-routes.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Handler = (req: any, res: any) => void | Promise<void>;

function makeRouter() {
    const gets = new Map<string, Handler>();
    const posts = new Map<string, Handler>();
    const router = {
        get(path: string, handler: Handler) {
            gets.set(path, handler);
        },
        post(path: string, handler: Handler) {
            posts.set(path, handler);
        },
    };
    return { router, gets, posts };
}

function makeResponse() {
    const response: any = {
        status: vi.fn(),
        json: vi.fn(),
        send: vi.fn(),
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
}

function makeRuntime(overrides: Partial<AuthorityRuntime['extMgmt']> = {}): AuthorityRuntime {
    return {
        extMgmt: {
            rebuildUpdate: vi.fn(),
            listBackups: vi.fn(),
            restoreBackup: vi.fn(),
            deleteBackup: vi.fn(),
            ...overrides,
        },
        audit: {
            logUsage: vi.fn().mockResolvedValue(undefined),
            logError: vi.fn().mockResolvedValue(undefined),
        },
    } as unknown as AuthorityRuntime;
}

function adminRequest(body?: unknown, query?: Record<string, string>) {
    return {
        user: {
            profile: { handle: 'alice', admin: true },
            directories: { root: 'C:/users/alice' },
        },
        body,
        query,
        headers: {},
    };
}

function nonAdminRequest(body?: unknown) {
    return {
        user: {
            profile: { handle: 'bob', admin: false },
            directories: { root: 'C:/users/bob' },
        },
        body,
        headers: {},
    };
}

describe('registerExtMgmtRoutes', () => {
    it('registers all four ext-mgmt endpoints', () => {
        const { router, gets, posts } = makeRouter();
        registerExtMgmtRoutes(router as never, makeRuntime(), vi.fn() as never);
        expect(posts.get('/ext-mgmt/rebuild-update')).toBeTypeOf('function');
        expect(gets.get('/ext-mgmt/backups')).toBeTypeOf('function');
        expect(posts.get('/ext-mgmt/backups/restore')).toBeTypeOf('function');
        expect(posts.get('/ext-mgmt/backups/delete')).toBeTypeOf('function');
    });

    it('rejects non-admin users through the unified fail path with 403 Forbidden', async () => {
        const { router, posts } = makeRouter();
        const runtime = makeRuntime();
        const fail = vi.fn((_rt: any, _req: any, res: any, _extensionId: string, error: unknown) => {
            res.status(403).json({ error: String((error as Error).message), code: 'permission_denied', category: 'permission' });
        });
        registerExtMgmtRoutes(router as never, runtime, fail as never);

        const response = makeResponse();
        await posts.get('/ext-mgmt/rebuild-update')!(nonAdminRequest({ target: { location: 'third-party', name: 'demo' } }), response);

        expect(fail).toHaveBeenCalledTimes(1);
        expect(fail.mock.calls[0]![3]).toBe(AUTHORITY_SDK_EXTENSION_ID);
        expect((fail.mock.calls[0]![4] as Error).message).toBe('Forbidden');
        // ext-mgmt 服务根本不会被调用
        expect(runtime.extMgmt.rebuildUpdate).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(403);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'permission_denied' }));
    });

    it('maps ExtMgmtServiceError to the three-part error payload with audit', async () => {
        const { router, posts } = makeRouter();
        const runtime = makeRuntime({
            rebuildUpdate: vi.fn().mockRejectedValue(new ExtMgmtServiceError(
                'ext_mgmt_git_remote_failed',
                'git_remote_failed',
                'ext_mgmt_git_remote_failed',
                '从 origin 拉取分支 main 的 depth-1 快照失败。',
                '检查网络与 origin 远端可达性。',
            )),
        });
        registerExtMgmtRoutes(router as never, runtime, vi.fn() as never);

        const response = makeResponse();
        await posts.get('/ext-mgmt/rebuild-update')!(adminRequest({ target: { location: 'third-party', name: 'demo' } }), response);

        expect(response.status).toHaveBeenCalledWith(502);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'ext_mgmt_git_remote_failed',
            code: 'ext_mgmt_git_remote_failed',
            category: 'core',
            reason: '从 origin 拉取分支 main 的 depth-1 快照失败。',
            remedy: '检查网络与 origin 远端可达性。',
        }));
        expect(runtime.audit.logError).toHaveBeenCalledTimes(1);
    });

    it('returns the service response and writes usage audit on success', async () => {
        const { router, posts } = makeRouter();
        const updateResult = {
            target: { location: 'third-party', name: 'demo' },
            status: 'updated',
            branch: 'main',
            changed: true,
            dirty: false,
            backup: { backupId: 'b1', ref: 'refs/ext-mgmt/backup/demo/b1', revision: 'a'.repeat(40), parentRevision: 'b'.repeat(40), createdAt: '', message: '', dirty: false },
        };
        const runtime = makeRuntime({
            rebuildUpdate: vi.fn().mockResolvedValue(updateResult),
        });
        registerExtMgmtRoutes(router as never, runtime, vi.fn() as never);

        const response = makeResponse();
        await posts.get('/ext-mgmt/rebuild-update')!(adminRequest({ target: { location: 'third-party', name: 'demo' } }), response);

        expect(response.json).toHaveBeenCalledWith(updateResult);
        expect(runtime.audit.logUsage).toHaveBeenCalledWith(
            expect.objectContaining({ handle: 'alice' }),
            AUTHORITY_SDK_EXTENSION_ID,
            'Ext-mgmt rebuild update',
            expect.objectContaining({ target: 'third-party/demo', status: 'updated' }),
        );
    });

    it('parses GET /ext-mgmt/backups query parameters', async () => {
        const { router, gets } = makeRouter();
        const runtime = makeRuntime({
            listBackups: vi.fn().mockResolvedValue({ target: { location: 'plugins', name: 'my-plugin' }, backups: [], count: 0, generatedAt: '' }),
        });
        registerExtMgmtRoutes(router as never, runtime, vi.fn() as never);

        const response = makeResponse();
        await gets.get('/ext-mgmt/backups')!(adminRequest(undefined, { location: 'plugins', name: 'my-plugin' }), response);

        expect(runtime.extMgmt.listBackups).toHaveBeenCalledWith(expect.objectContaining({ handle: 'alice' }), {
            location: 'plugins',
            name: 'my-plugin',
        });
        expect(response.json).toHaveBeenCalled();
    });

    it('reports the extMgmt feature group in probe feature flags', () => {
        const features = buildAuthorityFeatureFlags(true, 0);
        expect(features.extMgmt).toEqual({ rebuildUpdate: true });
        expect(buildAuthorityFeatureFlags(false, 0).extMgmt.rebuildUpdate).toBe(true);
    });
});
