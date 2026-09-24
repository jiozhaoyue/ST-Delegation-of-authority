import type { AuthorityCapability, HostCapabilityLevel, RegistryHost } from '@stdo/shared-types';

/**
 * Static cross-host capability matrix.
 *
 * Versioned data shipped with the code — never probed at runtime. Derived
 * from docs/server/capabilities-and-isolation.md and the four-host
 * verification recorded in research/07 (ST 1.18.0 full / Luker 2.7.0 core
 * available but Host Bridge gated off / PureTavern 0.1.12 and TauriTavern
 * 2.2.0 have no server-plugin infrastructure, front-end only).
 *
 * ST/Luker run the full server-plugin stack; PT/TT only load the browser
 * SDK in degraded, front-end-only mode, so no server capability is available
 * there. Host Bridge is additionally version-gated on SillyTavern
 * (supportedPackageVersions) and rejected on Luker (console.warn only, does
 * not block loading).
 */

const CORE_CAPABILITIES: AuthorityCapability[] = [
    'sql',
    'kv',
    'blob',
    'fs',
    'http',
    'jobs',
    'events',
    'trivium',
    'agent',
];

const HOST_MATRIX: Record<RegistryHost, Partial<Record<AuthorityCapability, HostCapabilityLevel>>> = {
    sillytavern: Object.fromEntries([
        ...CORE_CAPABILITIES.map((capability) => [capability, 'supported'] as const),
        ['host-bridge', 'supported'],
    ]),
    luker: Object.fromEntries([
        ...CORE_CAPABILITIES.map((capability) => [capability, 'supported'] as const),
        ['host-bridge', 'absent'],
    ]),
    puretavern: Object.fromEntries(CORE_CAPABILITIES.map((capability) => [capability, 'absent'] as const)),
    tauritavern: Object.fromEntries(CORE_CAPABILITIES.map((capability) => [capability, 'absent'] as const)),
};

/** All hosts covered by the matrix. */
export const REGISTRY_HOSTS: RegistryHost[] = ['sillytavern', 'luker', 'puretavern', 'tauritavern'];

/** Look up one capability's static support level on one host. */
export function capabilityLevel(host: RegistryHost, capability: AuthorityCapability): HostCapabilityLevel {
    return HOST_MATRIX[host]?.[capability] ?? 'absent';
}

/**
 * Estimate an extension's availability on one host from its dependency set:
 * `supported` only when every dependency is supported, `absent` only when
 * every dependency is absent, otherwise `degraded`.
 */
export function estimateForHost(capabilities: AuthorityCapability[], host: RegistryHost): HostCapabilityLevel {
    if (capabilities.length === 0) {
        return 'supported';
    }
    let sawSupported = false;
    let sawAbsent = false;
    for (const capability of capabilities) {
        const level = capabilityLevel(host, capability);
        if (level === 'supported') {
            sawSupported = true;
        } else if (level === 'absent') {
            sawAbsent = true;
        } else {
            sawSupported = true;
        }
    }
    if (sawAbsent && sawSupported) {
        return 'degraded';
    }
    if (sawAbsent) {
        return 'absent';
    }
    return 'supported';
}

/** Test-only access to the full matrix rows. */
export function matrixRowFor(host: RegistryHost): Partial<Record<AuthorityCapability, HostCapabilityLevel>> {
    return { ...HOST_MATRIX[host] };
}
