import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AuthorityExtMgmtRebuildUpdateRequest, AuthorityExtMgmtTarget } from '@stdo/shared-types';
import { ExtMgmtService, buildAuthenticatedUrl, scrubSecrets } from './ext-mgmt-service.js';
import type { UserContext } from '../types.js';

/**
 * ext-mgmt 服务单测（真实 git fixture，不走网络）：
 * 每个用例在临时目录建 origin（bare）+ 宿主 third-party 目录下的 target clone，
 * 通过第二个 upstream clone 推进上游提交来模拟「上游有新版本」。
 */

interface Fixture {
    root: string;
    originPath: string;
    stRoot: string;
    targetDir: string;
    upstreamDir: string;
}

const cleanupDirs: string[] = [];

const THIRD_PARTY_NAME = 'demo-ext';

function runGit(cwd: string, args: string[], env?: NodeJS.ProcessEnv): string {
    const result = childProcess.spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        env: env ? { ...process.env, ...env } : process.env,
    });
    if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')} failed (exit ${result.status}): ${result.stderr ?? ''}${result.stdout ?? ''}`);
    }
    return (result.stdout ?? '').trim();
}

function commitAll(dir: string, message: string, env?: NodeJS.ProcessEnv): string {
    const identity = ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.test'];
    runGit(dir, [...identity, 'add', '-A', '--'], env);
    runGit(dir, [...identity, 'commit', '-m', message], env);
    return runGit(dir, ['rev-parse', 'HEAD']);
}

function writeManifest(dir: string, version: string): void {
    fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify({ display_name: 'Demo Ext', version }, null, 2)}\n`);
}

function createFixture(): Fixture {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'authority-ext-mgmt-test-'));
    cleanupDirs.push(root);

    const originPath = path.join(root, 'origin.git');
    runGit(root, ['init', '--bare', '-b', 'main', originPath]);

    const seedDir = path.join(root, 'seed');
    runGit(root, ['clone', originPath, seedDir]);
    writeManifest(seedDir, '0.1.0');
    fs.writeFileSync(path.join(seedDir, 'index.js'), 'console.log("demo 0.1.0");\n');
    commitAll(seedDir, 'seed 0.1.0');
    runGit(seedDir, ['push', 'origin', 'main']);

    const stRoot = path.join(root, 'sillytavern');
    const targetDir = path.join(stRoot, 'public', 'scripts', 'extensions', 'third-party', THIRD_PARTY_NAME);
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    runGit(root, ['clone', originPath, targetDir]);

    const upstreamDir = path.join(root, 'upstream');
    runGit(root, ['clone', originPath, upstreamDir]);

    return { root, originPath, stRoot, targetDir, upstreamDir };
}

/** 推进上游：在 upstream clone 写入新版本并 push。 */
function pushUpstreamVersion(fixture: Fixture, version: string, extraFiles: Record<string, string> = {}): string {
    writeManifest(fixture.upstreamDir, version);
    for (const [name, content] of Object.entries(extraFiles)) {
        fs.writeFileSync(path.join(fixture.upstreamDir, name), content);
    }
    const revision = commitAll(fixture.upstreamDir, `upstream ${version}`);
    runGit(fixture.upstreamDir, ['push', 'origin', 'main']);
    return revision;
}

function readTargetManifest(fixture: Fixture): { version: string } {
    return JSON.parse(fs.readFileSync(path.join(fixture.targetDir, 'manifest.json'), 'utf8')) as { version: string };
}

function listBackupRefs(fixture: Fixture): string[] {
    const output = runGit(fixture.targetDir, ['for-each-ref', 'refs/ext-mgmt/backup/', '--format=%(refname)']);
    return output.split('\n').filter(Boolean);
}

function createService(fixture: Fixture): ExtMgmtService {
    return new ExtMgmtService({ resolveSillyTavernRoot: () => fixture.stRoot, logger: { info: () => undefined, warn: () => undefined, error: () => undefined } });
}

function adminUser(fixture: Fixture): UserContext {
    return {
        handle: 'alice',
        isAdmin: true,
        rootDir: path.join(fixture.root, 'data', 'alice'),
    };
}

function updateRequest(fixture: Fixture, overrides: Partial<AuthorityExtMgmtRebuildUpdateRequest> = {}): AuthorityExtMgmtRebuildUpdateRequest {
    const target: AuthorityExtMgmtTarget = { location: 'third-party', name: THIRD_PARTY_NAME };
    return { target, ...overrides };
}

describe('ExtMgmtService.rebuildUpdate', () => {
    beforeEach(() => {
        // 每个用例独立 fixture
    });

    afterEach(() => {
        while (cleanupDirs.length > 0) {
            const dir = cleanupDirs.pop();
            if (dir) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        }
    });

    it('updates a clean worktree to the upstream tip and records a backup ref', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        const upstreamRevision = pushUpstreamVersion(fixture, '0.2.0');
        const previousRevision = runGit(fixture.targetDir, ['rev-parse', 'HEAD']);

        const response = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture));

        expect(response.status).toBe('updated');
        expect(response.changed).toBe(true);
        expect(response.dirty).toBe(false);
        expect(response.previousRevision).toBe(previousRevision);
        expect(response.currentRevision).toBe(upstreamRevision);
        expect(response.branch).toBe('main');
        expect(readTargetManifest(fixture).version).toBe('0.2.0');

        const backupRefs = listBackupRefs(fixture);
        expect(backupRefs).toHaveLength(1);
        expect(response.backup?.ref).toBe(backupRefs[0]);
        expect(response.backup?.parentRevision).toBe(previousRevision);
        // 备份提交的树与更新前 HEAD 树一致（干净目录快照）
        const backupTree = runGit(fixture.targetDir, ['rev-parse', `${response.backup!.revision}^{tree}`]);
        const headTreeBefore = runGit(fixture.targetDir, ['rev-parse', `${previousRevision}^{tree}`]);
        expect(backupTree).toBe(headTreeBefore);
    });

    it('returns already_up_to_date without creating a backup when clean and current', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        pushUpstreamVersion(fixture, '0.2.0');
        await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture));

        const response = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture));

        expect(response.status).toBe('already_up_to_date');
        expect(response.changed).toBe(false);
        expect(response.backup).toBeNull();
        expect(listBackupRefs(fixture)).toHaveLength(1);
    });

    it('backs up dirty worktree (including untracked files) before rebuilding', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        const upstreamRevision = pushUpstreamVersion(fixture, '0.2.0', { 'upstream-only.txt': 'from upstream\n' });
        const previousRevision = runGit(fixture.targetDir, ['rev-parse', 'HEAD']);

        // 本地改动：改 tracked + 加 untracked
        writeManifest(fixture.targetDir, '0.1.0-local');
        fs.writeFileSync(path.join(fixture.targetDir, 'local-notes.txt'), 'local note\n');

        const response = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture));

        expect(response.dirty).toBe(true);
        expect(response.status).toBe('updated');
        expect(response.currentRevision).toBe(upstreamRevision);
        // 重建后 tracked 文件对齐上游，untracked 保留
        expect(readTargetManifest(fixture).version).toBe('0.2.0');
        expect(fs.existsSync(path.join(fixture.targetDir, 'local-notes.txt'))).toBe(true);
        expect(fs.existsSync(path.join(fixture.targetDir, 'upstream-only.txt'))).toBe(true);
        expect(response.untrackedPreservedCount).toBe(1);

        // 备份快照包含本地改动与未跟踪文件
        const backupRef = response.backup!.ref;
        expect(runGit(fixture.targetDir, ['show', `${backupRef}:manifest.json`])).toContain('0.1.0-local');
        expect(runGit(fixture.targetDir, ['show', `${backupRef}:local-notes.txt`])).toContain('local note');
        expect(response.backup!.parentRevision).toBe(previousRevision);
        expect(response.backup!.dirty).toBe(true);
    });

    it('fails with git_remote_failed and leaves the worktree untouched when origin is unreachable', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        const missingPath = path.join(fixture.root, 'missing.git');
        runGit(fixture.targetDir, ['remote', 'set-url', 'origin', missingPath]);
        writeManifest(fixture.targetDir, '0.1.0-local');
        const statusBefore = runGit(fixture.targetDir, ['status', '--porcelain']);

        const error = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture)).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(Error);
        const extError = error as { kind?: string; errorCode?: string; reason?: string; remedy?: string };
        expect(extError.kind).toBe('git_remote_failed');
        expect(extError.errorCode).toBe('ext_mgmt_git_remote_failed');
        expect(extError.reason).toBeTruthy();
        expect(extError.remedy).toBeTruthy();
        // 零变更
        expect(readTargetManifest(fixture).version).toBe('0.1.0-local');
        expect(runGit(fixture.targetDir, ['status', '--porcelain'])).toBe(statusBefore);
        expect(listBackupRefs(fixture)).toHaveLength(0);
    });

    it('rejects updates whose candidate tree is not a valid extension (marker files missing)', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        // 上游提交删除 manifest.json（无关仓库形态）
        fs.rmSync(path.join(fixture.upstreamDir, 'manifest.json'));
        commitAll(fixture.upstreamDir, 'remove manifest');
        runGit(fixture.upstreamDir, ['push', 'origin', 'main']);

        const error = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture)).catch((caught: unknown) => caught);
        const extError = error as { kind?: string; errorCode?: string };
        expect(extError.kind).toBe('validation');
        expect(extError.errorCode).toBe('ext_mgmt_candidate_tree_invalid');
        // 工作区未被动过
        expect(readTargetManifest(fixture).version).toBe('0.1.0');
        expect(listBackupRefs(fixture)).toHaveLength(0);
    });

    it('rejects updates when untracked files collide with the candidate tree (pre-mutation check)', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        pushUpstreamVersion(fixture, '0.2.0', { 'collide.txt': 'upstream\n' });
        // 本地未跟踪文件占住了候选树要写的路径
        fs.writeFileSync(path.join(fixture.targetDir, 'collide.txt'), 'local\n');

        const error = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture)).catch((caught: unknown) => caught);
        const extError = error as { kind?: string; errorCode?: string; reason?: string };
        expect(extError.kind).toBe('conflict');
        expect(extError.errorCode).toBe('ext_mgmt_untracked_conflict');
        expect(extError.reason).toContain('collide.txt');
        // 零变更：文件原样、无备份
        expect(fs.readFileSync(path.join(fixture.targetDir, 'collide.txt'), 'utf8')).toBe('local\n');
        expect(readTargetManifest(fixture).version).toBe('0.1.0');
        expect(listBackupRefs(fixture)).toHaveLength(0);
    });

    it('requires an explicit branch on detached HEAD and honors it', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        const upstreamRevision = pushUpstreamVersion(fixture, '0.2.0');
        runGit(fixture.targetDir, ['checkout', '--detach']);

        const detachedError = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture)).catch((caught: unknown) => caught);
        expect((detachedError as { errorCode?: string }).errorCode).toBe('ext_mgmt_detached_head');

        const response = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture, { branch: 'main' }));
        expect(response.status).toBe('updated');
        expect(response.branch).toBe('main');
        expect(response.currentRevision).toBe(upstreamRevision);
    });

    it('never persists request credentials and scrubs them from failures', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        // origin 指向一个必然快速失败的 http(s) 地址（端口 1 连接拒绝）
        runGit(fixture.targetDir, ['remote', 'set-url', 'origin', 'http://127.0.0.1:1/repo.git']);
        const token = 'super-secret-token-abc123';
        const configPath = path.join(fixture.targetDir, '.git', 'config');
        const configBefore = fs.readFileSync(configPath, 'utf8');

        const error = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture, {
            credentials: { username: 'oauth2', token },
        })).catch((caught: unknown) => caught);

        const extError = error as { kind?: string; message?: string; reason?: string; remedy?: string };
        expect(extError.kind).toBe('git_remote_failed');
        // 凭据不出现在任何输出/字段里
        expect(extError.message ?? '').not.toContain(token);
        expect(extError.reason ?? '').not.toContain(token);
        expect(extError.remedy ?? '').not.toContain(token);
        // .git/config 不含凭据（与调用前逐字节一致）
        expect(fs.readFileSync(configPath, 'utf8')).toBe(configBefore);
        expect(fs.readFileSync(configPath, 'utf8')).not.toContain(token);
    });
});

describe('ExtMgmtService.backup management', () => {
    afterEach(() => {
        while (cleanupDirs.length > 0) {
            const dir = cleanupDirs.pop();
            if (dir) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        }
    });

    it('lists backups newest first, restores with a pre-restore snapshot, and deletes refs', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        pushUpstreamVersion(fixture, '0.2.0');
        // 制造 dirty 更新 → 生成一个「含本地改动」的备份
        writeManifest(fixture.targetDir, '0.1.0-local');
        const updateResponse = await service.rebuildUpdate(adminUser(fixture), updateRequest(fixture));
        const backupId = updateResponse.backup!.backupId;

        // 再次制造本地改动，然后恢复
        writeManifest(fixture.targetDir, '0.1.0-local-again');
        const restore = await service.restoreBackup(adminUser(fixture), updateRequest(fixture).target, backupId);
        expect(restore.revision).toBe(updateResponse.backup!.revision);
        expect(restore.preRestoreBackupId).toBeTruthy();
        expect(readTargetManifest(fixture).version).toBe('0.1.0-local');

        const listed = await service.listBackups(adminUser(fixture), updateRequest(fixture).target);
        expect(listed.count).toBe(2); // 更新备份 + pre-restore 快照
        expect(listed.backups[0]?.backupId).toBe(restore.preRestoreBackupId);
        expect(listed.backups.map(entry => entry.backupId)).toContain(backupId);

        const removed = await service.deleteBackup(adminUser(fixture), updateRequest(fixture).target, backupId);
        expect(removed.deleted).toBe(true);
        const afterDelete = await service.listBackups(adminUser(fixture), updateRequest(fixture).target);
        expect(afterDelete.count).toBe(1);

        const missingError = await service.restoreBackup(adminUser(fixture), updateRequest(fixture).target, backupId).catch((caught: unknown) => caught);
        expect((missingError as { errorCode?: string }).errorCode).toBe('ext_mgmt_backup_not_found');
    });
});

describe('ExtMgmtService target resolution', () => {
    afterEach(() => {
        while (cleanupDirs.length > 0) {
            const dir = cleanupDirs.pop();
            if (dir) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        }
    });

    it('resolves user-extensions targets from the request user root', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);

        const userRoot = path.join(fixture.root, 'data', 'alice');
        const userExtDir = path.join(userRoot, 'extensions', 'my-ext');
        fs.mkdirSync(path.dirname(userExtDir), { recursive: true });
        runGit(fixture.root, ['clone', fixture.originPath, userExtDir]);

        const upstreamRevision = pushUpstreamVersion(fixture, '0.2.0');

        const response = await service.rebuildUpdate(adminUser(fixture), {
            target: { location: 'user-extensions', name: 'my-ext' },
        });
        expect(response.status).toBe('updated');
        expect(response.currentRevision).toBe(upstreamRevision);
        expect(readTargetManifest({ ...fixture, targetDir: userExtDir }).version).toBe('0.2.0');
    });

    it('rejects traversal-style names and symlinked target directories', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);

        const traversal = await service.rebuildUpdate(adminUser(fixture), {
            target: { location: 'third-party', name: '..%2F..%2Fescape' },
        }).catch((caught: unknown) => caught);
        expect((traversal as { errorCode?: string }).errorCode).toBe('ext_mgmt_invalid_target');

        // 链接禁穿（P-19）：junction/symbolic 目录一律拒绝
        const realDir = path.join(fixture.root, 'real-ext');
        fs.mkdirSync(realDir, { recursive: true });
        const linkDir = path.join(fixture.stRoot, 'public', 'scripts', 'extensions', 'third-party', 'linked-ext');
        fs.symlinkSync(realDir, linkDir, process.platform === 'win32' ? 'junction' : 'dir');
        try {
            const linkError = await service.rebuildUpdate(adminUser(fixture), {
                target: { location: 'third-party', name: 'linked-ext' },
            }).catch((caught: unknown) => caught);
            expect((linkError as { errorCode?: string }).errorCode).toBe('ext_mgmt_symlink_not_allowed');
        } finally {
            fs.rmSync(linkDir, { force: true });
        }
    });

    it('reports missing target directories as ext_mgmt_target_not_found', { timeout: 60_000 }, async () => {
        const fixture = createFixture();
        const service = createService(fixture);
        const error = await service.rebuildUpdate(adminUser(fixture), {
            target: { location: 'third-party', name: 'not-installed' },
        }).catch((caught: unknown) => caught);
        expect((error as { errorCode?: string }).errorCode).toBe('ext_mgmt_target_not_found');
    });
});

describe('credential helpers', () => {
    it('buildAuthenticatedUrl injects credentials only for http(s) remotes', () => {
        const credentials = { username: 'alice', token: 'tok' };
        expect(buildAuthenticatedUrl('https://github.com/acme/ext.git', credentials)).toBe('https://alice:tok@github.com/acme/ext.git');
        expect(buildAuthenticatedUrl('http://example.com/ext.git', { token: 'tok' })).toBe('http://oauth2:tok@example.com/ext.git');
        // 已有 userinfo 会被替换而不是叠加
        expect(buildAuthenticatedUrl('https://old:old@github.com/acme/ext.git', credentials)).toBe('https://alice:tok@github.com/acme/ext.git');
        // 非 http(s) 一律拒绝
        expect(buildAuthenticatedUrl('git@github.com:acme/ext.git', credentials)).toBeNull();
        expect(buildAuthenticatedUrl('ssh://git@github.com/acme/ext.git', credentials)).toBeNull();
        expect(buildAuthenticatedUrl('/local/path/repo.git', credentials)).toBeNull();
    });

    it('scrubSecrets removes token occurrences from git output', () => {
        const output = 'fatal: unable to access \'https://oauth2:tok@example.com/ext.git\': failed to connect';
        expect(scrubSecrets(output, ['tok'])).not.toContain('tok');
        expect(scrubSecrets(output, ['tok'])).toContain('[redacted]');
    });
});
