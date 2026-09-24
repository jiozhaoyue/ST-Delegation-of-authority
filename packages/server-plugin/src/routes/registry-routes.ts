import type { DeclaredPermissions } from '@stdo/shared-types';
import type { AuthorityRuntime } from '../runtime.js';
import type { AuthorityRequest, AuthorityResponse, UserContext } from '../types.js';
import { ExtensionRegistryService } from '../services/extension-registry-service.js';
import { getSessionToken, getUserContext } from '../utils.js';

type RouterLike = {
    get(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
    post(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
};

type RouteFailureHandler = (runtime: AuthorityRuntime, req: AuthorityRequest, res: AuthorityResponse, extensionId: string, error: unknown) => void;

function ok(res: AuthorityResponse, data: unknown): void {
    res.json(data);
}

function decodeParam(value: string | undefined): string {
    return typeof value === 'string' ? decodeURIComponent(value) : '';
}

/**
 * Resolve the user-scoped registry instance for a request. The runtime
 * holds one {@link ExtensionRegistryService} per user handle (each user's
 * control DB is isolated), each with its own scan cache; refresh on one
 * user's registry never touches another user's snapshot.
 */
function registryFor(runtime: AuthorityRuntime, user: UserContext): ExtensionRegistryService {
    let registry = runtime.registries.get(user.handle);
    if (!registry) {
        registry = new ExtensionRegistryService({
            resolveSillyTavernRoot: () => runtime.install.getSillyTavernRoot(),
            getRegisteredExtensions: async () => {
                const entries = await runtime.extensions.listExtensions(user);
                const map = new Map<string, { declaredPermissions: DeclaredPermissions | null }>();
                for (const entry of entries) {
                    map.set(entry.id, { declaredPermissions: entry.declaredPermissions });
                }
                return map;
            },
            getModuleRecords: () => runtime.modules.listRecords(),
            getObservedUsage: async () => {
                const map = new Map<string, string[]>();
                const extensionIds = new Set(
                    runtime.modules.listRecords().map((record) => record.source.extensionId),
                );
                for (const extensionId of extensionIds) {
                    try {
                        const activity = await runtime.audit.getRecentActivity(user, extensionId);
                        if (activity.usage.length > 0) {
                            map.set(extensionId, activity.usage.map((record) => record.message));
                        }
                    } catch {
                        // Audit reads are best-effort; a failing read never
                        // breaks the registry scan.
                    }
                }
                return map;
            },
            logger: console,
        });
        runtime.registries.set(user.handle, registry);
    }
    return registry;
}

export function registerRegistryRoutes(router: RouterLike, runtime: AuthorityRuntime, fail: RouteFailureHandler): void {
    router.get('/registry/extensions', async (req, res) => {
        let extensionId = 'registry';
        try {
            const user = getUserContext(req);
            const session = await runtime.sessions.assertSession(getSessionToken(req), user);
            extensionId = session.extension.id;
            ok(res, await registryFor(runtime, user).list());
        } catch (error) {
            fail(runtime, req, res, extensionId, error);
        }
    });

    router.get('/registry/extensions/:extensionId', async (req, res) => {
        let auditExtensionId = 'registry';
        try {
            const user = getUserContext(req);
            const session = await runtime.sessions.assertSession(getSessionToken(req), user);
            auditExtensionId = session.extension.id;
            const result = await registryFor(runtime, user).get(decodeParam(req.params?.extensionId));
            if (!result.record) {
                res.status(404).json({ error: 'extension_not_found' });
                return;
            }
            ok(res, result);
        } catch (error) {
            fail(runtime, req, res, auditExtensionId, error);
        }
    });

    router.post('/registry/refresh', async (req, res) => {
        let auditExtensionId = 'registry';
        try {
            const user = getUserContext(req);
            if (!user.isAdmin) {
                res.status(403).json({ error: 'admin_required' });
                return;
            }
            const session = await runtime.sessions.assertSession(getSessionToken(req), user);
            auditExtensionId = session.extension.id;
            const snapshot = await registryFor(runtime, user).refresh();
            ok(res, { refreshed: true as const, generatedAt: snapshot.generatedAt });
        } catch (error) {
            fail(runtime, req, res, auditExtensionId, error);
        }
    });
}
