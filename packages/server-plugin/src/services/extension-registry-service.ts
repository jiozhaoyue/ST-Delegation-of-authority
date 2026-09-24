import fs from 'node:fs';
import path from 'node:path';
import type {
    AuthorityCapability,
    AuthorityModuleRecord,
    DeclaredPermissions,
    DependencySource,
    ExtensionDependencyEntry,
    ExtensionRegistryRecord,
    HostAvailabilityView,
    RegistryConflict,
    RegistryDiagnostic,
    RegistryHost,
    RegistryListResponse,
} from '@stdo/shared-types';
import { AUTHORITY_MODULE_PROTOCOL_VERSION } from '../constants.js';
import { estimateForHost, REGISTRY_HOSTS } from './host-capability-matrix.js';

/**
 * Authority extension registry service (L12).
 *
 * Read-only inventory layer that aggregates:
 *  1. the full list of installed third-party SillyTavern extensions (from
 *     the extensions directory on disk),
 *  2. per-user extension registrations with declared permissions (from the
 *     control DB via {@link ExtensionService}),
 *  3. companion module discovery records (from {@link ModuleHostService}),
 *  4. audit-observed capability usage (read-only aggregation over existing
 *     audit logs, no new instrumentation).
 *
 * Scanning discipline mirrors {@link ModuleDiscoveryService}: this service
 * never executes extension code, never follows symlinks, never recurses into
 * nested directories, and skips `node_modules` / `dist` / `.git` / `target`.
 * A single failing extension becomes a diagnostic, never a scan abort.
 *
 * Results are cached in process memory. The cache has no TTL; the only
 * invalidation entry point is {@link refresh} (admin-gated route). The first
 * {@link list} call lazily triggers a scan, and concurrent calls share the
 * in-flight scan promise (single-flight merge).
 */

const SKIP_DIRECTORY_NAMES = new Set([
    'node_modules',
    'dist',
    '.git',
    'target',
]);

/** PermissionResource prefix -> registry capability. */
const RESOURCE_PREFIX_TO_CAPABILITY: ReadonlyMap<string, AuthorityCapability> = new Map([
    ['storage.kv', 'kv'],
    ['storage.blob', 'blob'],
    ['fs.private', 'fs'],
    ['sql.private', 'sql'],
    ['trivium.private', 'trivium'],
    ['http.fetch', 'http'],
    ['jobs.background', 'jobs'],
    ['events.stream', 'events'],
    ['module.execute', 'trivium'],
    ['agent.run', 'agent'],
    ['agent.browser', 'agent'],
]);

/** Audit usage message keyword -> capability (loose textual match). */
const AUDIT_KEYWORD_TO_CAPABILITY: ReadonlyMap<string, AuthorityCapability> = new Map([
    ['sql', 'sql'],
    ['kv', 'kv'],
    ['blob', 'blob'],
    ['fs', 'fs'],
    ['http', 'http'],
    ['jobs', 'jobs'],
    ['event', 'events'],
    ['trivium', 'trivium'],
    ['agent', 'agent'],
    ['host-bridge', 'host-bridge'],
]);

type Logger = Pick<Console, 'info' | 'warn' | 'error'>;

export interface ExtensionRegistryDependencies {
    /** Resolves the SillyTavern root that hosts the extensions directory. */
    resolveSillyTavernRoot: () => string | null;
    /** Registered extension entries with declared permissions, keyed by extension id. */
    getRegisteredExtensions: () => Promise<Map<string, { declaredPermissions: DeclaredPermissions | null }>>;
    /** Module discovery records (all statuses). */
    getModuleRecords: () => AuthorityModuleRecord[];
    /** Audit usage messages per extension id for observed-capability aggregation. */
    getObservedUsage: () => Promise<Map<string, string[]>>;
    logger?: Logger;
}

export class ExtensionRegistryService {
    private cache: RegistryListResponse | null = null;
    private scanning: Promise<RegistryListResponse> | null = null;

    constructor(private readonly deps: ExtensionRegistryDependencies) {}

    async list(): Promise<RegistryListResponse> {
        if (this.cache) {
            return this.cache;
        }
        if (this.scanning) {
            return this.scanning;
        }
        this.scanning = this.scan().finally(() => {
            this.scanning = null;
        });
        return this.scanning;
    }

    async get(extensionId: string): Promise<{ record: ExtensionRegistryRecord | null; conflicts: RegistryConflict[] }> {
        const snapshot = await this.list();
        const record = snapshot.records.find((entry) => entry.extensionId === extensionId) ?? null;
        const conflicts = snapshot.conflicts.filter((conflict) => conflict.extensionIds.includes(extensionId));
        return { record, conflicts };
    }

    async refresh(): Promise<RegistryListResponse> {
        this.cache = null;
        return this.list();
    }

    private async scan(): Promise<RegistryListResponse> {
        const sillyTavernRoot = this.deps.resolveSillyTavernRoot();
        const records: ExtensionRegistryRecord[] = [];
        const conflicts: RegistryConflict[] = [];

        const [registered, moduleRecords, observedUsage] = await Promise.all([
            this.deps.getRegisteredExtensions().catch(() => new Map<string, { declaredPermissions: DeclaredPermissions | null }>()),
            Promise.resolve(this.deps.getModuleRecords()),
            this.deps.getObservedUsage().catch(() => new Map<string, string[]>()),
        ]);

        if (sillyTavernRoot) {
            const thirdPartyRoot = path.join(sillyTavernRoot, 'public', 'scripts', 'extensions', 'third-party');
            let entries: fs.Dirent[] = [];
            try {
                entries = fs.readdirSync(thirdPartyRoot, { withFileTypes: true });
            } catch {
                entries = [];
            }
            for (const entry of entries) {
                if (!entry.isDirectory() || entry.isSymbolicLink() || SKIP_DIRECTORY_NAMES.has(entry.name)) {
                    continue;
                }
                const extensionId = `third-party/${entry.name}`;
                records.push(
                    this.buildRecord(extensionId, entry.name, path.join(thirdPartyRoot, entry.name), {
                        registered,
                        moduleRecords,
                        observedUsage,
                    }),
                );
            }
        }

        // Extensions registered in the control DB but no longer present on
        // disk (uninstalled while registered) still surface as records so the
        // inventory answers "what does Authority still know about".
        const seenIds = new Set(records.map((record) => record.extensionId));
        for (const extensionId of registered.keys()) {
            if (!seenIds.has(extensionId)) {
                records.push(
                    this.buildRecord(extensionId, extensionId, null, {
                        registered,
                        moduleRecords,
                        observedUsage,
                    }),
                );
            }
        }

        this.detectConflicts(records, moduleRecords, conflicts);

        records.sort((a, b) => a.extensionId.localeCompare(b.extensionId));
        const snapshot: RegistryListResponse = {
            records,
            count: records.length,
            generatedAt: new Date().toISOString(),
            conflicts,
        };
        this.cache = snapshot;
        return snapshot;
    }

    private buildRecord(
        extensionId: string,
        fallbackName: string,
        extensionDir: string | null,
        context: {
            registered: Map<string, { declaredPermissions: DeclaredPermissions | null }>;
            moduleRecords: AuthorityModuleRecord[];
            observedUsage: Map<string, string[]>;
        },
    ): ExtensionRegistryRecord {
        const diagnostics: RegistryDiagnostic[] = [];
        let displayName = fallbackName;
        let version: string | null = null;

        if (extensionDir) {
            const manifestPath = path.join(extensionDir, 'manifest.json');
            try {
                const raw = fs.readFileSync(manifestPath, 'utf8');
                const manifest = JSON.parse(raw) as { display_name?: unknown; version?: unknown };
                if (typeof manifest.display_name === 'string' && manifest.display_name.length > 0) {
                    displayName = manifest.display_name;
                }
                if (typeof manifest.version === 'string') {
                    version = manifest.version;
                }
            } catch (error) {
                diagnostics.push({
                    severity: 'warning',
                    code: 'manifest_unreadable',
                    message: `Unable to read extension manifest.json: ${(error as Error).message}`,
                });
            }
        } else {
            diagnostics.push({
                severity: 'info',
                code: 'extension_dir_missing',
                message: 'Extension is registered with Authority but not present in the extensions directory.',
            });
        }

        // Owner-extension identity comes back from discovery as
        // `third-party/<dir>`; module records map onto the same extension id.
        const moduleRecords = context.moduleRecords.filter(
            (record) => record.source.extensionId === extensionId,
        );
        const moduleIds = [...new Set(moduleRecords.map((record) => record.moduleId))];

        const dependencyMap = new Map<AuthorityCapability, Set<DependencySource>>();

        for (const moduleRecord of moduleRecords) {
            if (!moduleRecord.manifest) {
                continue;
            }
            for (const transaction of Object.values(moduleRecord.manifest.transactions)) {
                for (const required of transaction.requiredResources ?? []) {
                    const capability = RESOURCE_PREFIX_TO_CAPABILITY.get(required.resource);
                    if (capability) {
                        dependencyMap.get(capability)?.add('manifest') ?? dependencyMap.set(capability, new Set(['manifest']));
                    }
                }
            }
            if (moduleRecord.manifest.protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION) {
                // protocol_mismatch conflicts are detected below across
                // records; surfaced here as a record diagnostic too.
                diagnostics.push({
                    severity: 'warning',
                    code: 'protocol_mismatch',
                    message: `Companion module declares protocolVersion ${String(moduleRecord.manifest.protocolVersion)}, expected ${AUTHORITY_MODULE_PROTOCOL_VERSION}.`,
                });
            }
        }

        const declared = context.registered.get(extensionId)?.declaredPermissions ?? null;
        if (declared) {
            for (const capability of capabilitiesFromDeclaredPermissions(declared)) {
                dependencyMap.get(capability)?.add('session') ?? dependencyMap.set(capability, new Set(['session']));
            }
        }

        const observedMessages = context.observedUsage.get(extensionId);
        if (observedMessages) {
            for (const message of observedMessages) {
                const lowered = message.toLowerCase();
                for (const [keyword, capability] of AUDIT_KEYWORD_TO_CAPABILITY) {
                    if (lowered.includes(keyword)) {
                        dependencyMap.get(capability)?.add('observed') ?? dependencyMap.set(capability, new Set(['observed']));
                    }
                }
            }
        }

        const dependencies: ExtensionDependencyEntry[] = [...dependencyMap.entries()]
            .map(([capability, sources]) => ({
                capability,
                sources: orderSources(sources),
            }))
            .sort((a, b) => a.capability.localeCompare(b.capability));

        const isAuthorityUser = moduleIds.length > 0 || declared !== null || (observedMessages?.length ?? 0) > 0;
        const capabilitySet = dependencies.map((entry) => entry.capability);

        const crossHost: HostAvailabilityView = {
            estimates: Object.fromEntries(
                REGISTRY_HOSTS.map((host) => [host, estimateForHost(capabilitySet, host)]),
            ) as HostAvailabilityView['estimates'],
        };

        return {
            extensionId,
            displayName,
            version,
            isAuthorityUser,
            dependencies,
            moduleIds,
            crossHost,
            diagnostics,
        };
    }

    private detectConflicts(
        records: ExtensionRegistryRecord[],
        moduleRecords: AuthorityModuleRecord[],
        conflicts: RegistryConflict[],
    ): void {
        const ownerIdByModuleId = new Map<string, string[]>();
        const transactionsByOwner = new Map<string, Set<string>>();

        for (const moduleRecord of moduleRecords) {
            const owners = ownerIdByModuleId.get(moduleRecord.moduleId) ?? [];
            owners.push(moduleRecord.source.extensionId);
            ownerIdByModuleId.set(moduleRecord.moduleId, owners);

            if (moduleRecord.manifest) {
                const names = transactionsByOwner.get(moduleRecord.source.extensionId) ?? new Set<string>();
                for (const transactionName of Object.keys(moduleRecord.manifest.transactions)) {
                    names.add(transactionName);
                }
                transactionsByOwner.set(moduleRecord.source.extensionId, names);

                if (moduleRecord.manifest.protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION) {
                    conflicts.push({
                        severity: 'warning',
                        kind: 'protocol_mismatch',
                        extensionIds: [moduleRecord.source.extensionId],
                        detail: `Module ${moduleRecord.moduleId} declares protocolVersion ${String(moduleRecord.manifest.protocolVersion)}, expected ${AUTHORITY_MODULE_PROTOCOL_VERSION}.`,
                    });
                }
            }
        }

        for (const [moduleId, owners] of ownerIdByModuleId) {
            const uniqueOwners = [...new Set(owners)];
            if (uniqueOwners.length > 1) {
                conflicts.push({
                    severity: 'error',
                    kind: 'duplicate_module_id',
                    extensionIds: uniqueOwners,
                    detail: `Module id ${moduleId} is declared by multiple extensions: ${uniqueOwners.join(', ')}.`,
                });
            }
        }

        const transactionOwners = new Map<string, string[]>();
        for (const [owner, names] of transactionsByOwner) {
            for (const name of names) {
                const owners = transactionOwners.get(name) ?? [];
                owners.push(owner);
                transactionOwners.set(name, owners);
            }
        }
        for (const [transactionName, owners] of transactionOwners) {
            const uniqueOwners = [...new Set(owners)];
            if (uniqueOwners.length > 1) {
                conflicts.push({
                    severity: 'error',
                    kind: 'duplicate_transaction',
                    extensionIds: uniqueOwners,
                    detail: `Transaction name ${transactionName} is declared by multiple modules: ${uniqueOwners.join(', ')}.`,
                });
            }
        }

        for (const record of records) {
            const reportedCapabilities = new Set<AuthorityCapability>();
            for (const dependency of record.dependencies) {
                if (reportedCapabilities.has(dependency.capability)) {
                    continue;
                }
                for (const host of REGISTRY_HOSTS) {
                    if (estimateForHost([dependency.capability], host) === 'absent') {
                        reportedCapabilities.add(dependency.capability);
                        conflicts.push({
                            severity: 'warning',
                            kind: 'unsupported_capability_on_host',
                            extensionIds: [record.extensionId],
                            detail: `Extension ${record.extensionId} depends on ${dependency.capability}, which is absent on ${host}.`,
                        });
                    }
                }
            }
        }
    }
}

function capabilitiesFromDeclaredPermissions(declared: DeclaredPermissions): AuthorityCapability[] {
    const capabilities: AuthorityCapability[] = [];
    if (declared.storage?.kv) {
        capabilities.push('kv');
    }
    if (declared.storage?.blob) {
        capabilities.push('blob');
    }
    if (declared.fs?.private) {
        capabilities.push('fs');
    }
    if (declared.sql?.private) {
        capabilities.push('sql');
    }
    if (declared.trivium?.private) {
        capabilities.push('trivium');
    }
    if (declared.http?.allow) {
        capabilities.push('http');
    }
    if (declared.jobs?.background) {
        capabilities.push('jobs');
    }
    if (declared.events?.channels) {
        capabilities.push('events');
    }
    if (declared.modules?.execute) {
        // module.execute maps to module hosting, not a registry capability
        // of its own; observed as trivium-agnostic and skipped.
    }
    if (declared.agent?.run || declared.agent?.browser) {
        capabilities.push('agent');
    }
    return capabilities;
}

function orderSources(sources: Set<DependencySource>): DependencySource[] {
    const order: DependencySource[] = ['manifest', 'session', 'observed'];
    return order.filter((source) => sources.has(source));
}
