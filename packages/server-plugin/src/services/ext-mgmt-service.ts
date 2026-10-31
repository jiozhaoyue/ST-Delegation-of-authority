import childProcess from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
    AuthorityErrorCategory,
    AuthorityErrorCode,
    AuthorityExtMgmtBackupDeleteResponse,
    AuthorityExtMgmtBackupEntry,
    AuthorityExtMgmtBackupListResponse,
    AuthorityExtMgmtBackupRestoreResponse,
    AuthorityExtMgmtRebuildUpdateRequest,
    AuthorityExtMgmtRebuildUpdateResponse,
    AuthorityExtMgmtTarget,
} from '@stdo/shared-types';
import type { UserContext } from '../types.js';
import { sanitizeFileSegment } from '../utils.js';

/**
 * 扩展管理服务（ext-mgmt）—— rebuildUpdate 能力 + 备份管理。
 *
 * 职责：对「装进酒馆的扩展 / 服务端插件目录」（独立 Git 仓库）执行安全更新：
 * depth-1 fetch → 候选树校验 → 工作区快照自动提交到备份 ref → 原子重建 tracked 文件。
 *
 * Git 语义模板来自 {@link InstallService.pullLatestFromGit}（preflight
 * `git status --short --branch` + 有界超时 + windowsHide），但按本能力需要**泛化目录签名**
 * （操作任意扩展目录而非 pluginRoot），并额外承担凭据擦洗义务（D8-3：凭据只在请求内存在，
 * 不落盘、不出现在任何返回输出里），因此独立实现而非改公开面复用。
 *
 * 纪律对齐：
 * - 磁盘扫描纪律（extension-registry-service）：不执行扩展代码、跳过 `.git`；
 * - 链接禁穿（P-19 / L0-1）：目标目录是 symlink / junction 时直接拒绝；
 * - 有界等待（L1-MR-7）：所有 git 子进程带超时，fetch 用 GIT_TERMINAL_PROMPT=0 防挂起；
 * - 不动数据文件布局（L1-MF-9）：只通过 git 高层命令操作，绝不手写 `.git` 内部路径。
 */

/** 备份 / fetch 专用 ref 命名空间（全部在 refs/ext-mgmt/ 下，不碰 refs/heads 与 tags）。 */
const REF_NAMESPACE = 'refs/ext-mgmt';
const BACKUP_REF_PREFIX = `${REF_NAMESPACE}/backup`;
const FETCH_REF_PREFIX = `${REF_NAMESPACE}/fetch`;

/** 默认 git 超时：与 install-service 的 runGit 一致；fetch 稍长。 */
const GIT_TIMEOUT_MS = 30_000;
const GIT_FETCH_TIMEOUT_MS = 120_000;

/** 扩展目录候选树必须包含的根标记文件（防 reset 到无关仓库）。 */
const EXTENSION_MARKER_FILES = ['manifest.json'];
/** 服务端插件候选树必须包含的根标记文件（任一即可）。 */
const PLUGIN_MARKER_FILES = ['manifest.json', 'package.json', 'index.js'];

const COMMITTER_ARGS = ['-c', 'user.name=authority-ext-mgmt', '-c', 'user.email=authority@localhost'];

export type ExtMgmtErrorKind = 'validation' | 'not_found' | 'conflict' | 'git_remote_failed' | 'internal';

/** ext_mgmt_* 机器码（AuthorityErrorCode 的 ext-mgmt 子集）。 */
export type ExtMgmtErrorCode = Extract<AuthorityErrorCode, `ext_mgmt_${string}`>;

export class ExtMgmtServiceError extends Error {
    constructor(
        message: string,
        public readonly kind: ExtMgmtErrorKind,
        /** 机器码（三段式 error / code 字段）。 */
        public readonly errorCode: ExtMgmtErrorCode,
        /** 人话原因（三段式 reason）。 */
        public readonly reason: string,
        /** 出路建议（三段式 remedy）。 */
        public readonly remedy: string,
    ) {
        super(message);
        this.name = 'ExtMgmtServiceError';
    }
}

export function isExtMgmtServiceError(error: unknown): error is ExtMgmtServiceError {
    return error instanceof ExtMgmtServiceError;
}

export function statusFromExtMgmtErrorKind(kind: ExtMgmtErrorKind): number {
    switch (kind) {
        case 'validation':
            return 400;
        case 'not_found':
            return 404;
        case 'conflict':
            return 409;
        case 'git_remote_failed':
            return 502;
        default:
            return 500;
    }
}

export function categoryFromExtMgmtErrorKind(kind: ExtMgmtErrorKind): AuthorityErrorCategory {
    switch (kind) {
        case 'validation':
            return 'validation';
        case 'not_found':
            return 'validation';
        case 'conflict':
            return 'validation';
        case 'git_remote_failed':
            return 'core';
        default:
            return 'core';
    }
}

export interface ExtMgmtServiceOptions {
    /** 解析宿主（SillyTavern 根）目录；third-party / plugins 定位依赖它。 */
    resolveSillyTavernRoot: () => string | null;
    env?: NodeJS.ProcessEnv;
    logger?: Pick<typeof console, 'info' | 'warn' | 'error'>;
}

interface GitResult {
    stdout: string;
    stderr: string;
}

interface TargetContext {
    target: AuthorityExtMgmtTarget;
    dir: string;
}

export class ExtMgmtService {
    private readonly resolveSillyTavernRoot: () => string | null;
    private readonly env: NodeJS.ProcessEnv;
    private readonly logger: Pick<typeof console, 'info' | 'warn' | 'error'>;

    constructor(options: ExtMgmtServiceOptions) {
        this.resolveSillyTavernRoot = options.resolveSillyTavernRoot;
        this.env = options.env ?? process.env;
        this.logger = options.logger ?? console;
    }

    /**
     * rebuildUpdate：depth-1 fetch → 候选树校验 → 工作区快照提交到备份 ref →
     * 原子重建 tracked 文件到候选提交。任何失败路径都保证「先校验后动手」：
     * 候选树校验与未跟踪冲突预检全部通过之前，不发生任何本地变更。
     */
    async rebuildUpdate(user: UserContext, request: AuthorityExtMgmtRebuildUpdateRequest): Promise<AuthorityExtMgmtRebuildUpdateResponse> {
        const context = this.resolveTarget(user, request.target);
        const dir = context.dir;
        const targetName = this.targetRefSegment(context.target);

        // ---- preflight（模板：install-service pullLatestFromGit）----
        this.assertGitRepo(dir);
        const branch = this.resolveBranch(dir, request.branch);
        const previousRevision = this.runGit(dir, ['rev-parse', 'HEAD']).stdout;
        const preflightStatus = this.runGit(dir, ['status', '--short', '--branch'], { allowNoisyOutput: true }).stdout;
        const originUrl = this.getOriginUrl(dir);
        const dirty = this.getWorktreeDirty(dir);

        // ---- depth-1 fetch（候选提交落到 refs/ext-mgmt/fetch/<name>，不写远端配置）----
        const fetchArgs = ['fetch', '--depth', '1'];
        let secrets: string[] = [];
        if (request.credentials?.token) {
            const authenticatedUrl = buildAuthenticatedUrl(originUrl, request.credentials);
            if (!authenticatedUrl) {
                throw new ExtMgmtServiceError(
                    'ext_mgmt_credentials_unsupported',
                    'validation',
                    'ext_mgmt_credentials_unsupported',
                    `origin 远端是 ${describeTransport(originUrl)}，无法按请求注入用户名/令牌凭据。`,
                    '凭据注入仅支持 http/https 远端；ssh 远端请改用宿主已配置的密钥认证后重试（credentials 留空）。',
                );
            }
            secrets = [request.credentials.token];
            fetchArgs.push(authenticatedUrl);
        } else {
            fetchArgs.push('origin');
        }
        const fetchRef = `${FETCH_REF_PREFIX}/${targetName}`;
        fetchArgs.push('--force', `+refs/heads/${branch}:${fetchRef}`);
        this.runGit(dir, fetchArgs, {
            allowNoisyOutput: true,
            timeoutMs: GIT_FETCH_TIMEOUT_MS,
            secrets,
            extraEnv: { GIT_TERMINAL_PROMPT: '0' },
            failureKind: 'git_remote_failed',
            failureCode: 'ext_mgmt_git_remote_failed',
            failureReason: `从 origin 拉取分支 ${branch} 的 depth-1 快照失败。`,
            failureRemedy: '检查网络与 origin 远端可达性；私有仓请随请求注入凭据（token 只在本次请求内存中使用，不会被保存）。',
        });
        const fetchedRevision = this.runGit(dir, ['rev-parse', fetchRef], { secrets }).stdout;

        // ---- 候选树校验：候选提交必须是同一种扩展/插件，而不是无关仓库 ----
        this.assertCandidateTree(dir, context.target, fetchedRevision, secrets);

        // ---- 已最新 + 干净：无操作路径 ----
        if (fetchedRevision === previousRevision && !dirty) {
            return {
                target: context.target,
                status: 'already_up_to_date',
                branch,
                previousRevision,
                currentRevision: previousRevision,
                changed: false,
                dirty: false,
                backup: null,
                untrackedPreservedCount: this.listUntracked(dir).length,
                preflightStatus,
                updatedAt: new Date().toISOString(),
            };
        }

        // ---- 未跟踪冲突预检：候选树要写入的文件若被未跟踪文件占位，先失败（零变更）----
        const untrackedConflicts = intersect(
            this.listUntracked(dir),
            this.listTreeFiles(dir, fetchedRevision, secrets),
        );
        if (untrackedConflicts.length > 0) {
            const preview = untrackedConflicts.slice(0, 5).join(', ');
            throw new ExtMgmtServiceError(
                'ext_mgmt_untracked_conflict',
                'conflict',
                'ext_mgmt_untracked_conflict',
                `候选版本要写入的文件与现有未跟踪文件冲突（共 ${untrackedConflicts.length} 个，如：${preview}）。`,
                '把这些未跟踪文件移走或删除后重试；它们不受 git 跟踪，本服务不会替你删除。',
            );
        }

        // ---- 工作区快照 → 备份 ref（含未提交改动与未跟踪文件；不动真实 index / HEAD）----
        const backup = this.createBackupRef(dir, context.target, previousRevision, dirty);

        // ---- 原子重建 tracked 文件：分支指到候选提交，index 与工作树随之重建 ----
        this.runGit(dir, ['reset', '--hard', fetchedRevision], { secrets });
        const currentRevision = this.runGit(dir, ['rev-parse', 'HEAD'], { secrets }).stdout;
        if (currentRevision !== fetchedRevision) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_rebuild_mismatch',
                'internal',
                'ext_mgmt_rebuild_mismatch',
                '重建后 HEAD 与候选提交不一致，工作区状态未知。',
                `可用备份 ref ${backup.ref} 恢复更新前的工作区快照。`,
            );
        }

        this.logger.info(`[authority] ext-mgmt rebuilt ${context.target.location}/${context.target.name}: ${shortSha(previousRevision)} -> ${shortSha(currentRevision)} (backup ${backup.backupId})`);

        return {
            target: context.target,
            status: 'updated',
            branch,
            previousRevision,
            currentRevision,
            changed: previousRevision !== currentRevision,
            dirty,
            backup,
            untrackedPreservedCount: this.listUntracked(dir).length,
            preflightStatus,
            updatedAt: new Date().toISOString(),
        };
    }

    async listBackups(user: UserContext, target: AuthorityExtMgmtTarget): Promise<AuthorityExtMgmtBackupListResponse> {
        const context = this.resolveTarget(user, target);
        const dir = context.dir;
        this.assertGitRepo(dir);
        const prefix = `${BACKUP_REF_PREFIX}/${this.targetRefSegment(context.target)}/`;
        const result = this.runGit(dir, [
            'for-each-ref',
            prefix,
            '--format=%(refname)%09%(objectname)%09%(creatordate:iso-strict)%09%(subject)%09%(parent)',
        ]);
        const backups: AuthorityExtMgmtBackupEntry[] = [];
        for (const line of result.stdout.split('\n')) {
            if (!line.trim()) {
                continue;
            }
            const [refname, objectname, createdAt, subject, parent] = line.split('\t');
            if (!refname || !objectname) {
                continue;
            }
            backups.push({
                backupId: refname.slice(prefix.length),
                ref: refname,
                revision: objectname,
                parentRevision: parent || null,
                createdAt: createdAt || '',
                message: subject || '',
                dirty: (subject ?? '').includes('(dirty)'),
            });
        }
        backups.sort((left, right) => right.backupId.localeCompare(left.backupId));
        return {
            target: context.target,
            backups,
            count: backups.length,
            generatedAt: new Date().toISOString(),
        };
    }

    async restoreBackup(user: UserContext, requestTarget: AuthorityExtMgmtTarget, backupId: string): Promise<AuthorityExtMgmtBackupRestoreResponse> {
        const context = this.resolveTarget(user, requestTarget);
        const dir = context.dir;
        this.assertGitRepo(dir);
        const ref = this.resolveBackupRef(context.target, backupId, dir);

        // 恢复前先把当前状态（含未提交改动）快照成新的备份 ref，保证恢复本身可回退。
        const dirty = this.getWorktreeDirty(dir);
        const headRevision = this.runGit(dir, ['rev-parse', 'HEAD']).stdout;
        const preRestore = this.createBackupRef(dir, context.target, headRevision, dirty, 'pre-restore snapshot');

        // 备份树里可能出现「现在是未跟踪文件、快照里是跟踪文件」的占位冲突，先预检。
        const conflicts = intersect(
            this.listUntracked(dir),
            this.listTreeFiles(dir, ref.revision),
        );
        if (conflicts.length > 0) {
            const preview = conflicts.slice(0, 5).join(', ');
            throw new ExtMgmtServiceError(
                'ext_mgmt_untracked_conflict',
                'conflict',
                'ext_mgmt_untracked_conflict',
                `备份快照中的文件与当前未跟踪文件冲突（共 ${conflicts.length} 个，如：${preview}）。`,
                '先移走或删除这些未跟踪文件再恢复。',
            );
        }

        this.runGit(dir, ['reset', '--hard', ref.revision]);
        this.logger.info(`[authority] ext-mgmt restored ${context.target.location}/${context.target.name} from backup ${backupId} (pre-restore ${preRestore.backupId})`);
        return {
            target: context.target,
            backupId,
            revision: ref.revision,
            preRestoreBackupId: preRestore.backupId,
            restoredAt: new Date().toISOString(),
        };
    }

    async deleteBackup(user: UserContext, requestTarget: AuthorityExtMgmtTarget, backupId: string): Promise<AuthorityExtMgmtBackupDeleteResponse> {
        const context = this.resolveTarget(user, requestTarget);
        const dir = context.dir;
        this.assertGitRepo(dir);
        const ref = this.resolveBackupRef(context.target, backupId, dir);
        this.runGit(dir, ['update-ref', '-d', ref.ref]);
        this.logger.info(`[authority] ext-mgmt deleted backup ${ref.ref}`);
        return {
            target: context.target,
            backupId,
            deleted: true,
        };
    }

    // ------------------------------------------------------------------
    // 目标解析与定位
    // ------------------------------------------------------------------

    private resolveTarget(user: UserContext, target: AuthorityExtMgmtTarget): TargetContext {
        const name = typeof target?.name === 'string' ? target.name : '';
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes('..')) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_invalid_target',
                'validation',
                'ext_mgmt_invalid_target',
                `扩展目录名不合法：${JSON.stringify(name ?? null)}。`,
                'name 只允许一段目录名（字母、数字、点、下划线、连字符），不允许路径分隔符。',
            );
        }

        const location = target.location;
        let baseDir: string | null = null;
        if (location === 'third-party') {
            const sillyTavernRoot = this.resolveSillyTavernRoot();
            if (!sillyTavernRoot) {
                throw new ExtMgmtServiceError(
                    'ext_mgmt_host_root_unavailable',
                    'not_found',
                    'ext_mgmt_host_root_unavailable',
                    '无法定位宿主（SillyTavern）根目录，third-party 扩展不可用。',
                    '确认 Authority 服务端插件安装在宿主的 plugins 目录下后重试。',
                );
            }
            baseDir = path.join(sillyTavernRoot, 'public', 'scripts', 'extensions', 'third-party');
        } else if (location === 'plugins') {
            const sillyTavernRoot = this.resolveSillyTavernRoot();
            if (!sillyTavernRoot) {
                throw new ExtMgmtServiceError(
                    'ext_mgmt_host_root_unavailable',
                    'not_found',
                    'ext_mgmt_host_root_unavailable',
                    '无法定位宿主（SillyTavern）根目录，plugins 插件不可用。',
                    '确认 Authority 服务端插件安装在宿主的 plugins 目录下后重试。',
                );
            }
            baseDir = path.join(sillyTavernRoot, 'plugins');
        } else if (location === 'user-extensions') {
            const userRoot = user.rootDir || null;
            if (!userRoot) {
                throw new ExtMgmtServiceError(
                    'ext_mgmt_user_root_unavailable',
                    'not_found',
                    'ext_mgmt_user_root_unavailable',
                    '请求缺少用户数据根目录，用户私有扩展不可用。',
                    '确认宿主在请求上下文中注入了用户目录信息。',
                );
            }
            baseDir = path.join(userRoot, 'extensions');
        } else {
            throw new ExtMgmtServiceError(
                'ext_mgmt_invalid_target',
                'validation',
                'ext_mgmt_invalid_target',
                `未知的扩展位置类型：${String(location)}。`,
                'location 必须是 third-party / plugins / user-extensions 之一。',
            );
        }

        // resolveContainedPath（utils.ts 惯例）防目录穿越；再 lstat 拒绝 symlink/junction（P-19）。
        const dir = path.resolve(baseDir, name);
        if (dir !== path.resolve(baseDir) && !dir.startsWith(path.resolve(baseDir) + path.sep)) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_invalid_target',
                'validation',
                'ext_mgmt_invalid_target',
                '扩展目录解析后逃逸出基础目录。',
                'name 不允许包含路径分隔符或上级目录引用。',
            );
        }

        let stats: fs.Stats;
        try {
            stats = fs.lstatSync(dir);
        } catch {
            throw new ExtMgmtServiceError(
                'ext_mgmt_target_not_found',
                'not_found',
                'ext_mgmt_target_not_found',
                `扩展目录不存在：${location}/${name}。`,
                '检查 location 与 name 是否正确；目录列表可用扩展注册表（/registry/extensions）查询。',
            );
        }
        if (stats.isSymbolicLink()) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_symlink_not_allowed',
                'validation',
                'ext_mgmt_symlink_not_allowed',
                `扩展目录 ${location}/${name} 是符号链接/junction，拒绝执行写操作。`,
                '写穿链接会污染链接目标（可能是工作区源码仓）；请先在宿主侧改为真实目录或解除链接。',
            );
        }
        if (!stats.isDirectory()) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_invalid_target',
                'validation',
                'ext_mgmt_invalid_target',
                `扩展目标 ${location}/${name} 不是目录。`,
                'location/name 应指向一个扩展或插件目录。',
            );
        }

        return { target: { location, name }, dir };
    }

    private targetRefSegment(target: AuthorityExtMgmtTarget): string {
        return sanitizeFileSegment(target.name);
    }

    private assertGitRepo(dir: string): void {
        if (!fs.existsSync(path.join(dir, '.git'))) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_not_git_repo',
                'validation',
                'ext_mgmt_not_git_repo',
                '目标目录不是 Git 仓库，无法执行 git 更新。',
                '该扩展不是通过 git 安装的；请改用宿主原生安装通道更新。',
            );
        }
        try {
            this.runGit(dir, ['rev-parse', '--verify', 'HEAD']);
        } catch {
            throw new ExtMgmtServiceError(
                'ext_mgmt_no_commit',
                'validation',
                'ext_mgmt_no_commit',
                '目标仓库没有任何提交（HEAD 不存在）。',
                '先在宿主侧完成安装提交，或改用宿主原生安装通道。',
            );
        }
    }

    private resolveBranch(dir: string, requestedBranch: string | undefined): string {
        if (requestedBranch !== undefined && requestedBranch !== null) {
            const branch = String(requestedBranch).trim();
            if (!/^[A-Za-z0-9._\-/]+$/.test(branch) || branch.startsWith('-') || branch.includes('..')) {
                throw new ExtMgmtServiceError(
                    'ext_mgmt_invalid_branch',
                    'validation',
                    'ext_mgmt_invalid_branch',
                    `分支名不合法：${JSON.stringify(requestedBranch)}。`,
                    '分支名必须是合法的 git ref（字母、数字、点、下划线、连字符、斜杠）。',
                );
            }
            return branch;
        }
        const current = this.runGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
        if (current === 'HEAD') {
            throw new ExtMgmtServiceError(
                'ext_mgmt_detached_head',
                'validation',
                'ext_mgmt_detached_head',
                '目标仓库处于 detached HEAD 状态，且未指定要更新到的分支。',
                '在请求中显式传入 branch（上游分支名）后重试。',
            );
        }
        return current;
    }

    private getOriginUrl(dir: string): string {
        try {
            return this.runGit(dir, ['remote', 'get-url', 'origin']).stdout;
        } catch {
            throw new ExtMgmtServiceError(
                'ext_mgmt_no_origin',
                'validation',
                'ext_mgmt_no_origin',
                '目标仓库没有配置 origin 远端，无法拉取更新。',
                '先在宿主侧为该扩展配置 origin 远端。',
            );
        }
    }

    private getWorktreeDirty(dir: string): boolean {
        return this.runGit(dir, ['status', '--porcelain']).stdout.length > 0;
    }

    private listUntracked(dir: string): string[] {
        const result = this.runGit(dir, ['ls-files', '--others', '--exclude-standard']);
        return result.stdout.split('\n').filter(Boolean);
    }

    private listTreeFiles(dir: string, revision: string, secrets: string[] = []): string[] {
        const result = this.runGit(dir, ['ls-tree', '-r', '--name-only', revision], { secrets });
        return result.stdout.split('\n').filter(Boolean);
    }

    private assertCandidateTree(dir: string, target: AuthorityExtMgmtTarget, revision: string, secrets: string[]): void {
        const markers = target.location === 'plugins' ? PLUGIN_MARKER_FILES : EXTENSION_MARKER_FILES;
        const currentMarkers = markers.filter(marker => fs.existsSync(path.join(dir, marker)));
        const candidateMarkers = markers.filter(marker => {
            try {
                this.runGit(dir, ['cat-file', '-e', `${revision}:${marker}`], { secrets });
                return true;
            } catch {
                return false;
            }
        });

        if (currentMarkers.length === 0 && candidateMarkers.length === 0) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_candidate_tree_invalid',
                'validation',
                'ext_mgmt_candidate_tree_invalid',
                '候选提交与当前目录都不是可识别的扩展/插件（缺少根标记文件）。',
                `候选树根目录至少应包含 ${markers.join(' / ')} 之一；确认 branch 指向正确的上游仓库分支。`,
            );
        }
        if (candidateMarkers.length === 0) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_candidate_tree_invalid',
                'validation',
                'ext_mgmt_candidate_tree_invalid',
                `候选提交缺少扩展根标记文件（当前目录含 ${currentMarkers.join(', ')}，候选树一个都没有）。`,
                `候选分支可能不是该扩展的上游仓库；确认 branch 后重试。`,
            );
        }
    }

    // ------------------------------------------------------------------
    // 备份 ref
    // ------------------------------------------------------------------

    private createBackupRef(dir: string, target: AuthorityExtMgmtTarget, headRevision: string, dirty: boolean, label = 'backup'): AuthorityExtMgmtBackupEntry {
        const tempIndex = path.join(os.tmpdir(), `authority-ext-mgmt-index-${crypto.randomUUID()}`);
        try {
            // 用临时 index 快照工作区：read-tree HEAD 起底（记录删除），add -A 对齐工作区；
            // 全程 GIT_INDEX_FILE 指向临时文件，绝不触碰真实 index / HEAD。
            this.runGit(dir, ['read-tree', 'HEAD'], { extraEnv: { GIT_INDEX_FILE: tempIndex } });
            this.runGit(dir, ['add', '-A', '--'], { extraEnv: { GIT_INDEX_FILE: tempIndex } });
            const tree = this.runGit(dir, ['write-tree'], { extraEnv: { GIT_INDEX_FILE: tempIndex } }).stdout;
            const createdAt = new Date();
            const backupId = `${formatRefTimestamp(createdAt)}-${crypto.randomBytes(4).toString('hex')}`;
            const message = `ext-mgmt ${label} ${target.location}/${target.name}${dirty ? ' (dirty)' : ''}`;
            const commit = this.runGit(dir, [
                ...COMMITTER_ARGS,
                'commit-tree',
                tree,
                '-p',
                headRevision,
                '-m',
                message,
            ]).stdout;
            const ref = `${BACKUP_REF_PREFIX}/${this.targetRefSegment(target)}/${backupId}`;
            this.runGit(dir, ['update-ref', ref, commit]);
            return {
                backupId,
                ref,
                revision: commit,
                parentRevision: headRevision,
                createdAt: createdAt.toISOString(),
                message,
                dirty,
            };
        } finally {
            fs.rmSync(tempIndex, { force: true });
        }
    }

    private resolveBackupRef(target: AuthorityExtMgmtTarget, backupId: string, dir: string): AuthorityExtMgmtBackupEntry {
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(backupId)) {
            throw new ExtMgmtServiceError(
                'ext_mgmt_invalid_backup_id',
                'validation',
                'ext_mgmt_invalid_backup_id',
                `备份 id 不合法：${JSON.stringify(backupId)}。`,
                '备份 id 是列表接口返回的 backupId 原样字符串。',
            );
        }
        const prefix = `${BACKUP_REF_PREFIX}/${this.targetRefSegment(target)}/`;
        const ref = `${prefix}${backupId}`;
        try {
            const revision = this.runGit(dir, ['rev-parse', '--verify', ref]).stdout;
            const message = this.runGit(dir, ['log', '-1', '--format=%s', ref]).stdout;
            return {
                backupId,
                ref,
                revision,
                parentRevision: null,
                createdAt: '',
                message,
                dirty: message.includes('(dirty)'),
            };
        } catch {
            throw new ExtMgmtServiceError(
                'ext_mgmt_backup_not_found',
                'not_found',
                'ext_mgmt_backup_not_found',
                `备份不存在：${backupId}。`,
                '先用 GET /ext-mgmt/backups 列出可用备份。',
            );
        }
    }

    // ------------------------------------------------------------------
    // git 进程（模板：install-service runGit；差异：凭据擦洗 + 自定义超时 + extraEnv）
    // ------------------------------------------------------------------

    private runGit(
        cwd: string,
        args: string[],
        options: {
            allowNoisyOutput?: boolean;
            timeoutMs?: number;
            secrets?: string[];
            extraEnv?: NodeJS.ProcessEnv;
            failureKind?: ExtMgmtErrorKind;
            failureCode?: ExtMgmtErrorCode;
            failureReason?: string;
            failureRemedy?: string;
        } = {},
    ): GitResult {
        const result = childProcess.spawnSync('git', args, {
            cwd,
            env: { ...this.env, ...(options.extraEnv ?? {}) },
            encoding: 'utf8',
            timeout: options.timeoutMs ?? GIT_TIMEOUT_MS,
            windowsHide: true,
        });

        const secrets = options.secrets ?? [];
        const scrub = (value: string): string => scrubSecrets(value, secrets);
        const stdout = scrub((result.stdout ?? '').trim());
        const stderr = scrub((result.stderr ?? '').trim());

        if (result.error) {
            if (options.failureCode) {
                throw new ExtMgmtServiceError(
                    options.failureCode,
                    options.failureKind ?? 'git_remote_failed',
                    options.failureCode,
                    scrub(asErrorMessage(result.error)),
                    options.failureRemedy ?? '',
                );
            }
            throw new Error(scrub(asErrorMessage(result.error)));
        }

        if (typeof result.status === 'number' && result.status !== 0) {
            const message = [stderr, stdout].filter(Boolean).join('\n') || `git ${args.join(' ')} failed with exit code ${result.status}`;
            if (options.failureCode) {
                throw new ExtMgmtServiceError(
                    options.failureCode,
                    options.failureKind ?? 'git_remote_failed',
                    options.failureCode,
                    options.failureReason ?? message,
                    options.failureRemedy ?? '',
                );
            }
            throw new Error(message);
        }

        if (!options.allowNoisyOutput && stderr) {
            return { stdout, stderr: '' };
        }

        return { stdout, stderr };
    }
}

/**
 * 把凭据注入远端 URL（仅内存）。仅支持 http/https；其余传输（ssh / 本地路径）
 * 返回 null 由调用方转成三段式错误。若 URL 已带 userinfo，先剥离再注入。
 */
export function buildAuthenticatedUrl(
    originUrl: string,
    credentials: { username?: string; token: string },
): string | null {
    let parsed: URL;
    try {
        parsed = new URL(originUrl);
    } catch {
        return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
    }
    parsed.username = encodeURIComponent(credentials.username?.trim() || 'oauth2');
    parsed.password = encodeURIComponent(credentials.token);
    return parsed.toString();
}

/** 把已知的秘密串从输出里替换为 [redacted]（错误信息也可能回显带凭据的 URL）。 */
export function scrubSecrets(text: string, secrets: string[]): string {
    let output = text;
    for (const secret of secrets) {
        if (secret) {
            output = output.split(secret).join('[redacted]');
        }
    }
    return output;
}

function describeTransport(originUrl: string): string {
    if (/^https?:\/\//i.test(originUrl)) {
        return 'http(s)';
    }
    if (originUrl.startsWith('git@') || originUrl.startsWith('ssh://')) {
        return 'ssh';
    }
    return '本地路径';
}

function intersect(left: string[], right: string[]): string[] {
    const rightSet = new Set(right);
    return left.filter(entry => rightSet.has(entry));
}

function shortSha(revision: string): string {
    return revision.slice(0, 10);
}

/** 备份 ref 时间戳段：UTC 紧凑形如 20261031T101500（ref 名与文件名安全）。 */
function formatRefTimestamp(date: Date): string {
    const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

function asErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
