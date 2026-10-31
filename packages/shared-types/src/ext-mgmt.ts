import type { AuthorityErrorCategory, AuthorityErrorCode, AuthorityErrorPayload } from './common.js';

/**
 * 扩展管理（ext-mgmt）能力域 DTO。
 *
 * 设计原则（authority-contract v0.2，任务 10-31-pure-frontend-panel-ui）：
 * - 通用扩展管理，非某前端扩展专用；
 * - 全部端点仅管理员（server 侧 assertAdminUser）；
 * - 逐能力探测：能力标记挂在 probe 的 `features.extMgmt`，不新增 capabilities 端点；
 * - 凭据按请求内存注入，绝不落盘（D8-3）；
 * - 错误三段式 `{ error, reason, remedy }`（本文件 AuthorityExtMgmtErrorPayload）。
 */

/** probe features 内的扩展管理特性组（本 PR 仅 rebuildUpdate；后续能力逐个扩充）。 */
export interface AuthorityExtMgmtFeatureFlags {
    rebuildUpdate: boolean;
}

/** 可管理的扩展/插件目录位置。 */
export type AuthorityExtMgmtTargetLocation =
    /** 前端扩展：`<ST 根>/public/scripts/extensions/third-party/<name>` */
    | 'third-party'
    /** 服务端插件：`<ST 根>/plugins/<name>` */
    | 'plugins'
    /** 用户私有扩展：`<用户数据根>/extensions/<name>` */
    | 'user-extensions';

/** 扩展/插件目标。name 只允许 `[A-Za-z0-9._-]`（目录名一段，禁止穿越）。 */
export interface AuthorityExtMgmtTarget {
    location: AuthorityExtMgmtTargetLocation;
    name: string;
}

/** 按请求注入的 Git 凭据（仅内存使用，服务端不持久化）。 */
export interface AuthorityExtMgmtCredentials {
    username?: string;
    token: string;
}

/** rebuildUpdate 请求：对目标目录执行「depth-1 fetch → 候选树校验 → 备份 → 原子重建」。 */
export interface AuthorityExtMgmtRebuildUpdateRequest {
    target: AuthorityExtMgmtTarget;
    /** 要更新到的上游分支；缺省用目标仓库当前分支。 */
    branch?: string;
    /** 私有仓凭据（http/https 远端）；缺省走 origin 既有的认证方式。 */
    credentials?: AuthorityExtMgmtCredentials;
}

export type AuthorityExtMgmtRebuildUpdateStatus = 'updated' | 'already_up_to_date';

/** 备份条目：一个 `refs/ext-mgmt/backup/<name>/<ts>` 引用的快照提交。 */
export interface AuthorityExtMgmtBackupEntry {
    /** ref 末段时间戳段（即备份 id），形如 `20261031T101500-ab12cd34`。 */
    backupId: string;
    /** 完整 ref 名。 */
    ref: string;
    /** 快照提交 SHA。 */
    revision: string;
    /** 快照的父提交（创建备份时的工作区 HEAD）。 */
    parentRevision: string | null;
    createdAt: string;
    message: string;
    /** 快照创建时工作区是否有未提交改动。 */
    dirty: boolean;
}

export interface AuthorityExtMgmtRebuildUpdateResponse {
    target: AuthorityExtMgmtTarget;
    status: AuthorityExtMgmtRebuildUpdateStatus;
    /** 更新所用的目标分支。 */
    branch: string | null;
    previousRevision: string | null;
    currentRevision: string | null;
    changed: boolean;
    /** 更新前工作区是否有本地改动（已备份）。 */
    dirty: boolean;
    /** 本次更新创建的备份；干净且已最新时为 null。 */
    backup: AuthorityExtMgmtBackupEntry | null;
    /** 重建后保留在磁盘上的未跟踪文件数（git 不管理，按纪律不删）。 */
    untrackedPreservedCount: number;
    /** preflight 的 `git status --short --branch` 输出。 */
    preflightStatus: string | null;
    updatedAt: string;
}

export interface AuthorityExtMgmtBackupListResponse {
    target: AuthorityExtMgmtTarget;
    backups: AuthorityExtMgmtBackupEntry[];
    count: number;
    generatedAt: string;
}

export interface AuthorityExtMgmtBackupRestoreRequest {
    target: AuthorityExtMgmtTarget;
    backupId: string;
}

export interface AuthorityExtMgmtBackupRestoreResponse {
    target: AuthorityExtMgmtTarget;
    backupId: string;
    /** 恢复所用快照提交 SHA（恢复后 HEAD 指向它）。 */
    revision: string;
    /** 恢复前自动创建的 pre-restore 快照 id（当前状态先备份再回滚）。 */
    preRestoreBackupId: string;
    restoredAt: string;
}

export interface AuthorityExtMgmtBackupDeleteRequest {
    target: AuthorityExtMgmtTarget;
    backupId: string;
}

export interface AuthorityExtMgmtBackupDeleteResponse {
    target: AuthorityExtMgmtTarget;
    backupId: string;
    deleted: boolean;
}

/**
 * ext-mgmt 错误三段式。`error` 字段承载**机器码**（如 `ext_mgmt_git_remote_failed`），
 * `reason` 为人话原因，`remedy` 为出路建议；同时保留标准载荷的
 * `code` / `category` 供既有 SDK 错误分类路径复用。
 */
export interface AuthorityExtMgmtErrorPayload extends AuthorityErrorPayload {
    error: AuthorityErrorCode;
    code: AuthorityErrorCode;
    category: AuthorityErrorCategory;
    reason: string;
    remedy: string;
}
