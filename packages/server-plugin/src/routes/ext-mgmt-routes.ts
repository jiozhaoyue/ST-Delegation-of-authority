import type {
    AuthorityExtMgmtBackupDeleteResponse,
    AuthorityExtMgmtBackupListResponse,
    AuthorityExtMgmtBackupRestoreRequest,
    AuthorityExtMgmtBackupRestoreResponse,
    AuthorityExtMgmtErrorPayload,
    AuthorityExtMgmtRebuildUpdateRequest,
    AuthorityExtMgmtRebuildUpdateResponse,
    AuthorityExtMgmtTarget,
} from '@stdo/shared-types';
import { AUTHORITY_SDK_EXTENSION_ID } from '../constants.js';
import { categoryFromExtMgmtErrorKind, ExtMgmtServiceError, isExtMgmtServiceError, statusFromExtMgmtErrorKind } from '../services/ext-mgmt-service.js';
import type { AuthorityRuntime } from '../runtime.js';
import type { AuthorityRequest, AuthorityResponse } from '../types.js';
import { getUserContext } from '../utils.js';

/**
 * 扩展管理路由组（ext-mgmt，PR-1 底座 + PR-2 rebuildUpdate）。
 *
 * - 全部端点仅管理员（assertAdminUser 惯例：`request.user.profile.admin`）；
 * - 能力错误走三段式 `{ error, code, category, reason, remedy }`
 *   （AuthorityExtMgmtErrorPayload），并写审计日志；
 * - 非能力错误（未预期异常，含 401 / 403 语义）回落到统一 `fail()` 规范化路径；
 * - 目标解析 / git 语义全部在 ExtMgmtService，本文件只做权限、参数与审计。
 */

type RouterLike = {
    get(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
    post(path: string, handler: (req: AuthorityRequest, res: AuthorityResponse) => void | Promise<void>): void;
};

type RouteFailureHandler = (runtime: AuthorityRuntime, req: AuthorityRequest, res: AuthorityResponse, extensionId: string, error: unknown) => void;

function assertAdminUser(user: ReturnType<typeof getUserContext>): void {
    if (!user.isAdmin) {
        throw new Error('Forbidden');
    }
}

function parseTarget(body: unknown): AuthorityExtMgmtTarget {
    const raw = (body as { target?: unknown } | undefined)?.target;
    if (!raw || typeof raw !== 'object') {
        throw new ExtMgmtServiceError(
            'ext_mgmt_invalid_target',
            'validation',
            'ext_mgmt_invalid_target',
            '请求缺少 target（{ location, name }）。',
            'target.location 取 third-party / plugins / user-extensions 之一；target.name 是目录名。',
        );
    }
    const candidate = raw as { location?: unknown; name?: unknown };
    return {
        location: candidate.location as AuthorityExtMgmtTarget['location'],
        name: typeof candidate.name === 'string' ? candidate.name : '',
    };
}

/**
 * 三段式响应 + 审计。机器码同时落在 error 与 code 字段（error 按契约承载机器码，
 * code 保留既有 SDK 错误分类路径）；非 ext-mgmt 错误回落统一 fail()。
 */
function failExtMgmt(
    runtime: AuthorityRuntime,
    req: AuthorityRequest,
    res: AuthorityResponse,
    fail: RouteFailureHandler,
    error: unknown,
): void {
    if (!isExtMgmtServiceError(error)) {
        fail(runtime, req, res, AUTHORITY_SDK_EXTENSION_ID, error);
        return;
    }

    const status = statusFromExtMgmtErrorKind(error.kind);
    const payload: AuthorityExtMgmtErrorPayload = {
        error: error.errorCode,
        code: error.errorCode,
        category: categoryFromExtMgmtErrorKind(error.kind),
        reason: error.reason,
        remedy: error.remedy,
    };
    try {
        const user = getUserContext(req);
        void runtime.audit.logError(user, AUTHORITY_SDK_EXTENSION_ID, `ext-mgmt ${error.errorCode}: ${error.reason}`).catch(() => undefined);
    } catch {
    }
    res.status(status).json(payload);
}

export function registerExtMgmtRoutes(
    router: RouterLike,
    runtime: AuthorityRuntime,
    fail: RouteFailureHandler,
): void {
    router.post('/ext-mgmt/rebuild-update', async (req, res) => {
        try {
            const user = getUserContext(req);
            assertAdminUser(user);
            const request = (req.body ?? {}) as AuthorityExtMgmtRebuildUpdateRequest;
            const response = await runtime.extMgmt.rebuildUpdate(user, {
                target: parseTarget(request),
                ...(request.branch !== undefined ? { branch: request.branch } : {}),
                ...(request.credentials !== undefined ? { credentials: request.credentials } : {}),
            });
            void runtime.audit.logUsage(user, AUTHORITY_SDK_EXTENSION_ID, 'Ext-mgmt rebuild update', {
                target: `${response.target.location}/${response.target.name}`,
                status: response.status,
                changed: response.changed,
                dirty: response.dirty,
                backupId: response.backup?.backupId ?? null,
            }).catch(() => undefined);
            res.json(response satisfies AuthorityExtMgmtRebuildUpdateResponse);
        } catch (error) {
            failExtMgmt(runtime, req, res, fail, error);
        }
    });

    router.get('/ext-mgmt/backups', async (req, res) => {
        try {
            const user = getUserContext(req);
            assertAdminUser(user);
            const target = parseTarget({
                target: {
                    location: req.query?.location,
                    name: req.query?.name,
                },
            });
            const response = await runtime.extMgmt.listBackups(user, target);
            res.json(response satisfies AuthorityExtMgmtBackupListResponse);
        } catch (error) {
            failExtMgmt(runtime, req, res, fail, error);
        }
    });

    router.post('/ext-mgmt/backups/restore', async (req, res) => {
        try {
            const user = getUserContext(req);
            assertAdminUser(user);
            const body = (req.body ?? {}) as AuthorityExtMgmtBackupRestoreRequest;
            const backupId = typeof body.backupId === 'string' ? body.backupId : '';
            const response = await runtime.extMgmt.restoreBackup(user, parseTarget(body), backupId);
            void runtime.audit.logUsage(user, AUTHORITY_SDK_EXTENSION_ID, 'Ext-mgmt backup restored', {
                target: `${response.target.location}/${response.target.name}`,
                backupId,
                revision: response.revision,
            }).catch(() => undefined);
            res.json(response satisfies AuthorityExtMgmtBackupRestoreResponse);
        } catch (error) {
            failExtMgmt(runtime, req, res, fail, error);
        }
    });

    router.post('/ext-mgmt/backups/delete', async (req, res) => {
        try {
            const user = getUserContext(req);
            assertAdminUser(user);
            const body = (req.body ?? {}) as { target?: unknown; backupId?: unknown };
            const backupId = typeof body.backupId === 'string' ? body.backupId : '';
            const response = await runtime.extMgmt.deleteBackup(user, parseTarget(body), backupId);
            void runtime.audit.logUsage(user, AUTHORITY_SDK_EXTENSION_ID, 'Ext-mgmt backup deleted', {
                target: `${response.target.location}/${response.target.name}`,
                backupId,
            }).catch(() => undefined);
            res.json(response satisfies AuthorityExtMgmtBackupDeleteResponse);
        } catch (error) {
            failExtMgmt(runtime, req, res, fail, error);
        }
    });
}
