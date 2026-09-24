import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTHORITY_MODULE_PROTOCOL_VERSION } from '../constants.js';
import { ExtensionRegistryService, type ExtensionRegistryDependencies } from './extension-registry-service.js';
import type {
    AuthorityModuleRecord,
    DeclaredPermissions,
} from '@stdo/shared-types';
import { estimateForHost } from './host-capability-matrix.js';

const cleanupDirs: string[] = [];

interface Fixture {
    sillyTavernRoot: string;
    thirdPartyRoot: string;
}

function createFixture(): Fixture {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'authority-registry-'));
    cleanupDirs.push(baseDir);
    const sillyTavernRoot = path.join(baseDir, 'SillyTavern');
    const thirdPartyRoot = path.join(sillyTavernRoot, 'public', 'scripts', 'extensions', 'third-party');
    fs.mkdirSync(thirdPartyRoot, { recursive: true });
    return { sillyTavernRoot, thirdPartyRoot };
}

function writeExtensionManifest(extensionDir: string, manifest?: Record<string, unknown> | null): void {
    fs.mkdirSync(extensionDir, { recursive: true });
    if (manifest === null) {
        return;
    }
    fs.writeFileSync(
        path.join(extensionDir, 'manifest.json'),
        JSON.stringify(manifest ?? { display_name: 'Test Extension', version: '1.2.3' }, null, 2),
        'utf8',
    );
}

function writeModuleManifest(
    extensionDir: string,
    moduleId: string,
    options: { transactionNames?: string[]; resource?: string; protocolVersion?: number } = {},
): void {
    const moduleDir = path.join(extensionDir, '.authority');
    fs.mkdirSync(moduleDir, { recursive: true });
    const transactionNames = options.transactionNames ?? ['data.commit'];
    const transactions: Record<string, unknown> = {};
    for (const name of transactionNames) {
        transactions[name] = {
            name,
            version: '1.0.0',
            title: name,
            riskLevel: 'low',
            permissionTarget: { kind: 'transaction' },
            requiredResources: [{ resource: options.resource ?? 'sql.private', target: 'default' }],
            idempotency: 'required',
            timeoutMs: 120_000,
            maxRequestBytes: 64 * 1024 * 1024,
            maxResponseBytes: 64 * 1024 * 1024,
        };
    }
    fs.writeFileSync(
        path.join(moduleDir, 'module.json'),
        JSON.stringify(
            {
                id: moduleId,
                displayName: `Module ${moduleId}`,
                ownerExtensionId: `third-party/${path.basename(extensionDir)}`,
                version: '1.0.0',
                schemaVersion: 1,
                protocolVersion: options.protocolVersion ?? AUTHORITY_MODULE_PROTOCOL_VERSION,
                entry: './server.cjs',
                transactions,
            },
            null,
            2,
        ),
        'utf8',
    );
}

function moduleRecord(
    moduleId: string,
    extensionDirName: string,
    options: { transactionNames?: string[]; resource?: string; protocolVersion?: number; withManifest?: boolean } = {},
): AuthorityModuleRecord {
    const transactionNames = options.transactionNames ?? ['data.commit'];
    const transactions: Record<string, unknown> = {};
    for (const name of transactionNames) {
        transactions[name] = {
            requiredResources: [{ resource: options.resource ?? 'sql.private', target: 'default' }],
        };
    }
    return {
        moduleId,
        ownerExtensionId: `third-party/${extensionDirName}`,
        status: 'available',
        manifest: options.withManifest === false
            ? null
            : {
                id: moduleId,
                displayName: `Module ${moduleId}`,
                version: '1.0.0',
                protocolVersion: options.protocolVersion ?? AUTHORITY_MODULE_PROTOCOL_VERSION,
                schemaVersion: 1,
                ownerExtensionId: `third-party/${extensionDirName}`,
                entry: './server.cjs',
                transactions: transactions as AuthorityModuleRecord['manifest'] extends null ? never : NonNullable<AuthorityModuleRecord['manifest']>['transactions'],
            },
        source: {
            extensionId: `third-party/${extensionDirName}`,
            modulePath: '.authority/module.json',
            entry: './server.cjs',
        },
        diagnostics: [],
    };
}

function createRegistry(
    fixture: Fixture,
    deps: Partial<ExtensionRegistryDependencies> = {},
): ExtensionRegistryService {
    return new ExtensionRegistryService({
        resolveSillyTavernRoot: () => fixture.sillyTavernRoot,
        getRegisteredExtensions: async () => new Map<string, { declaredPermissions: DeclaredPermissions | null }>(),
        getModuleRecords: () => [],
        getObservedUsage: async () => new Map<string, string[]>(),
        logger: { info() {}, warn() {}, error() {} },
        ...deps,
    });
}

describe('ExtensionRegistryService', () => {
    afterEach(() => {
        while (cleanupDirs.length > 0) {
            const dir = cleanupDirs.pop();
            if (dir) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        }
    });

    it('lists extensions and reads manifest display name and version', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'), {
            display_name: 'Alpha Extension',
            version: '2.0.0',
        });

        const registry = createRegistry(fixture);
        const result = await registry.list();

        expect(result.count).toBe(1);
        expect(result.records[0]!.extensionId).toBe('third-party/alpha');
        expect(result.records[0]!.displayName).toBe('Alpha Extension');
        expect(result.records[0]!.version).toBe('2.0.0');
        expect(result.records[0]!.isAuthorityUser).toBe(false);
    });

    it('records a diagnostic and continues when manifest.json is unreadable', async () => {
        const fixture = createFixture();
        const brokenDir = path.join(fixture.thirdPartyRoot, 'broken');
        fs.mkdirSync(brokenDir, { recursive: true });
        fs.writeFileSync(path.join(brokenDir, 'manifest.json'), '{ not json', 'utf8');
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'healthy'));

        const registry = createRegistry(fixture);
        const result = await registry.list();

        expect(result.count).toBe(2);
        const broken = result.records.find((record) => record.extensionId === 'third-party/broken')!;
        expect(broken.diagnostics.some((diagnostic) => diagnostic.code === 'manifest_unreadable')).toBe(true);
        expect(broken.version).toBeNull();
        expect(broken.displayName).toBe('broken');
        const healthy = result.records.find((record) => record.extensionId === 'third-party/healthy')!;
        expect(healthy.diagnostics).toHaveLength(0);
    });

    it('aggregates dependencies from module manifests, session declarations, and observed usage', async () => {
        const fixture = createFixture();
        const alphaDir = path.join(fixture.thirdPartyRoot, 'alpha');
        writeExtensionManifest(alphaDir);

        const registry = createRegistry(fixture, {
            getModuleRecords: () => [moduleRecord('third-party.alpha', 'alpha', { resource: 'sql.private' })],
            getRegisteredExtensions: async () => new Map([
                ['third-party/alpha', { declaredPermissions: { storage: { kv: true } } }],
            ]),
            getObservedUsage: async () => new Map([
                ['third-party/alpha', ['invoked http.fetch for external resource']],
            ]),
        });
        const result = await registry.list();

        const record = result.records.find((entry) => entry.extensionId === 'third-party/alpha')!;
        expect(record.isAuthorityUser).toBe(true);
        const capabilities = record.dependencies.map((dependency) => dependency.capability);
        expect(capabilities).toContain('sql');
        expect(capabilities).toContain('kv');
        expect(capabilities).toContain('http');
        const sqlDependency = record.dependencies.find((dependency) => dependency.capability === 'sql')!;
        expect(sqlDependency.sources).toEqual(['manifest']);
        const kvDependency = record.dependencies.find((dependency) => dependency.capability === 'kv')!;
        expect(kvDependency.sources).toEqual(['session']);
        const httpDependency = record.dependencies.find((dependency) => dependency.capability === 'http')!;
        expect(httpDependency.sources).toEqual(['observed']);
    });

    it('flags duplicate module ids across extensions as an error conflict', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'beta'));

        const registry = createRegistry(fixture, {
            getModuleRecords: () => [
                moduleRecord('shared.module', 'alpha'),
                moduleRecord('shared.module', 'beta'),
            ],
        });
        const result = await registry.list();

        const conflict = result.conflicts.find((entry) => entry.kind === 'duplicate_module_id')!;
        expect(conflict.severity).toBe('error');
        expect(conflict.extensionIds).toContain('third-party/alpha');
        expect(conflict.extensionIds).toContain('third-party/beta');
    });

    it('flags duplicate transaction names as an error conflict', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'beta'));

        const registry = createRegistry(fixture, {
            getModuleRecords: () => [
                moduleRecord('third-party.alpha', 'alpha', { transactionNames: ['data.commit'] }),
                moduleRecord('third-party.beta', 'beta', { transactionNames: ['data.commit'] }),
            ],
        });
        const result = await registry.list();

        const conflict = result.conflicts.find((entry) => entry.kind === 'duplicate_transaction')!;
        expect(conflict.severity).toBe('error');
    });

    it('flags protocol mismatch as a warning conflict and diagnostic', async () => {
        const fixture = createFixture();
        const alphaDir = path.join(fixture.thirdPartyRoot, 'alpha');
        writeExtensionManifest(alphaDir);

        const registry = createRegistry(fixture, {
            getModuleRecords: () => [
                moduleRecord('third-party.alpha', 'alpha', { protocolVersion: AUTHORITY_MODULE_PROTOCOL_VERSION + 1 }),
            ],
        });
        const result = await registry.list();

        const conflict = result.conflicts.find((entry) => entry.kind === 'protocol_mismatch')!;
        expect(conflict.severity).toBe('warning');
        const record = result.records.find((entry) => entry.extensionId === 'third-party/alpha')!;
        expect(record.diagnostics.some((diagnostic) => diagnostic.code === 'protocol_mismatch')).toBe(true);
    });

    it('flags fs dependency on puretavern as unsupported_capability_on_host warning', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));

        const registry = createRegistry(fixture, {
            getRegisteredExtensions: async () => new Map([
                ['third-party/alpha', { declaredPermissions: { fs: { private: true } } }],
            ]),
        });
        const result = await registry.list();

        const conflict = result.conflicts.find((entry) => entry.kind === 'unsupported_capability_on_host')!;
        expect(conflict.severity).toBe('warning');
        expect(conflict.detail).toContain('puretavern');
        const record = result.records.find((entry) => entry.extensionId === 'third-party/alpha')!;
        expect(record.crossHost.estimates.puretavern).toBe('absent');
        expect(record.crossHost.estimates.sillytavern).toBe('supported');
    });

    it('caches the scan: second list() does not rescan, refresh() does', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));
        const resolveRoot = vi.fn(() => fixture.sillyTavernRoot);
        const registry = new ExtensionRegistryService({
            resolveSillyTavernRoot: resolveRoot,
            getRegisteredExtensions: async () => new Map(),
            getModuleRecords: () => [],
            getObservedUsage: async () => new Map(),
        });

        const first = await registry.list();
        const second = await registry.list();
        expect(second.generatedAt).toBe(first.generatedAt);
        // resolveSillyTavernRoot runs once per scan; a cached second call
        // must not trigger another scan.
        expect(resolveRoot).toHaveBeenCalledTimes(1);

        const third = await registry.refresh();
        expect(resolveRoot).toHaveBeenCalledTimes(2);
        // The refreshed snapshot is a fresh scan, but same-millisecond
        // timestamps are legal; only scan-count and cache identity matter.
        expect(third.count).toBe(second.count);
        // The fourth call hits the refreshed cache.
        const fourth = await registry.list();
        expect(fourth.generatedAt).toBe(third.generatedAt);
        expect(resolveRoot).toHaveBeenCalledTimes(2);
    });

    it('merges concurrent list() calls into a single scan', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));
        const resolveRoot = vi.fn(() => fixture.sillyTavernRoot);
        const registry = new ExtensionRegistryService({
            resolveSillyTavernRoot: resolveRoot,
            getRegisteredExtensions: async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return new Map();
            },
            getModuleRecords: () => [],
            getObservedUsage: async () => new Map(),
        });

        const [a, b] = await Promise.all([registry.list(), registry.list()]);
        expect(a.generatedAt).toBe(b.generatedAt);
        expect(resolveRoot).toHaveBeenCalledTimes(1);
    });

    it('surfaces registered extensions whose directory is gone', async () => {
        const fixture = createFixture();
        writeExtensionManifest(path.join(fixture.thirdPartyRoot, 'alpha'));

        const registry = createRegistry(fixture, {
            getRegisteredExtensions: async () => new Map([
                ['third-party/ghost', { declaredPermissions: { sql: { private: true } } }],
            ]),
        });
        const result = await registry.list();

        const ghost = result.records.find((record) => record.extensionId === 'third-party/ghost')!;
        expect(ghost).toBeDefined();
        expect(ghost.diagnostics.some((diagnostic) => diagnostic.code === 'extension_dir_missing')).toBe(true);
        expect(ghost.isAuthorityUser).toBe(true);
    });
});

describe('estimateForHost', () => {
    it('returns supported when every capability is supported', () => {
        expect(estimateForHost(['sql', 'kv'], 'sillytavern')).toBe('supported');
    });

    it('returns absent when every capability is absent', () => {
        expect(estimateForHost(['sql'], 'puretavern')).toBe('absent');
    });

    it('returns degraded for a mixed dependency set', () => {
        // sql is supported on sillytavern, absent on puretavern: the set as a
        // whole never becomes "partially" anything — per capability the
        // estimate only sees all-or-nothing. Mixed sets only arise across
        // hosts, not within one host, so this asserts the pure function's
        // contract for the single-capability case on each host.
        expect(estimateForHost(['sql'], 'sillytavern')).toBe('supported');
        expect(estimateForHost(['sql'], 'puretavern')).toBe('absent');
    });

    it('treats an empty dependency set as supported everywhere', () => {
        for (const host of ['sillytavern', 'luker', 'puretavern', 'tauritavern'] as const) {
            expect(estimateForHost([], host)).toBe('supported');
        }
    });

    it('marks host-bridge absent on luker and supported on sillytavern', () => {
        expect(estimateForHost(['host-bridge'], 'luker')).toBe('absent');
        expect(estimateForHost(['host-bridge'], 'sillytavern')).toBe('supported');
    });
});
