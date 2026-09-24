/**
 * Extension registry DTOs.
 *
 * The extension registry is Authority's read-only plugin inventory layer
 * (L12): it aggregates the full list of installed SillyTavern extensions,
 * each extension's Authority capability dependencies (from companion module
 * manifests, session permission declarations, and audit-observed usage), the
 * static cross-host capability matrix, and statically detected conflicts.
 *
 * The registry never executes extension code and never arbitrates: it is a
 * pure observer over data other services already own. All types are
 * JSON-serializable so routes can return them directly.
 */

/** Capability support level on a given host, from the static matrix. */
export type HostCapabilityLevel = 'supported' | 'degraded' | 'absent';

/** Host identity used by the static capability matrix. */
export type RegistryHost = 'sillytavern' | 'luker' | 'puretavern' | 'tauritavern';

/**
 * Authority capability surface entries tracked by the dependency matrix.
 * Mirrors the permission resource families without the per-target detail.
 */
export type AuthorityCapability =
    | 'sql'
    | 'kv'
    | 'blob'
    | 'fs'
    | 'http'
    | 'jobs'
    | 'events'
    | 'trivium'
    | 'agent'
    | 'host-bridge';

/** Where a dependency entry was derived from. */
export type DependencySource = 'manifest' | 'session' | 'observed';

/** One capability dependency of an extension, with provenance. */
export interface ExtensionDependencyEntry {
    capability: AuthorityCapability;
    /** De-duplicated, de-duplicated order: manifest > session > observed. */
    sources: DependencySource[];
}

/** Non-fatal registry diagnostics attached to a single extension record. */
export interface RegistryDiagnostic {
    severity: 'error' | 'warning' | 'info';
    /** Stable machine code, e.g. `manifest_unreadable`. */
    code: string;
    message: string;
}

/** Cross-host availability estimate for one extension. */
export interface HostAvailabilityView {
    /** Host -> estimated level, derived from the dependency set and the static matrix. */
    estimates: Partial<Record<RegistryHost, HostCapabilityLevel>>;
}

/** Conflict kinds produced by the static conflict rules. */
export type RegistryConflictKind =
    | 'duplicate_module_id'
    | 'duplicate_transaction'
    | 'protocol_mismatch'
    | 'unsupported_capability_on_host';

/** A statically detected cross-extension or cross-host conflict. */
export interface RegistryConflict {
    severity: 'error' | 'warning' | 'info';
    kind: RegistryConflictKind;
    /** Extension ids involved in the conflict. */
    extensionIds: string[];
    detail: string;
}

/**
 * One extension's registry record. Describes the current inventory state of
 * one installed extension directory; JSON-serializable for direct route
 * responses.
 */
export interface ExtensionRegistryRecord {
    /** Extension identity, e.g. `third-party/some-extension`. */
    extensionId: string;
    /** Display name from the extension's `manifest.json`, falling back to the directory name. */
    displayName: string;
    /** Version from `manifest.json`; `null` when unreadable (with a diagnostic). */
    version: string | null;
    /** True when the extension declares or has used any Authority capability. */
    isAuthorityUser: boolean;
    /** Aggregated capability dependencies with provenance. */
    dependencies: ExtensionDependencyEntry[];
    /** Companion module ids declared by this extension. */
    moduleIds: string[];
    /** Cross-host availability estimates. */
    crossHost: HostAvailabilityView;
    /** Per-extension diagnostics from the latest scan. */
    diagnostics: RegistryDiagnostic[];
}

/** Response payload for `GET /registry/extensions`. */
export interface RegistryListResponse {
    records: ExtensionRegistryRecord[];
    count: number;
    /** ISO timestamp of the scan that produced this snapshot. */
    generatedAt: string;
    /** Conflicts across the whole inventory. */
    conflicts: RegistryConflict[];
}

/** Response payload for `GET /registry/extensions/:extensionId`. */
export interface RegistryGetResponse {
    record: ExtensionRegistryRecord | null;
    /** Conflicts involving this extension. */
    conflicts: RegistryConflict[];
}

/** Response payload for `POST /registry/refresh` (admin only). */
export interface RegistryRefreshResponse {
    refreshed: true;
    generatedAt: string;
}
