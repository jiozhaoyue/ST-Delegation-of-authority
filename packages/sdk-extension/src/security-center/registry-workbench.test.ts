import { describe, expect, it } from 'vitest';
import { renderRegistryWorkbench } from './registry-workbench.js';
import type { RegistryViewState } from './types.js';
import type { ExtensionRegistryRecord, RegistryListResponse } from '@stdo/shared-types';

describe('Registry workbench rendering', () => {
    it('shows the loading state before the first snapshot arrives', () => {
        const html = renderRegistryWorkbench(registryState({ loading: true, snapshot: null }), { isAdmin: false });
        expect(html).toContain('加载中');
    });

    it('shows the error state with a retry hint instead of an empty table', () => {
        const html = renderRegistryWorkbench(registryState({ error: 'core_unavailable' }), { isAdmin: false });
        expect(html).toContain('读取失败');
        expect(html).toContain('core_unavailable');
    });

    it('renders the inventory list with per-extension conflict badges and escapes identity', () => {
        const snapshot = registrySnapshot([
            registryRecord({
                extensionId: 'third-party/<unsafe>-mem',
                displayName: '<unsafe> Memory',
                isAuthorityUser: true,
                dependencies: [{ capability: 'kv', sources: ['manifest', 'session'] }],
            }),
            registryRecord({ extensionId: 'third-party/plain-tool', displayName: 'Plain Tool' }),
        ], [
            {
                severity: 'warning',
                kind: 'unsupported_capability_on_host',
                extensionIds: ['third-party/<unsafe>-mem'],
                detail: 'PureTavern 不支持私有文件',
            },
        ]);

        const html = renderRegistryWorkbench(registryState({ snapshot }), { isAdmin: false });

        expect(html).toContain('authority-governance-glance');
        // displayName 经 escapeHtml 转义后输出，原始尖括号不得直出
        expect(html).toContain('&lt;unsafe&gt; Memory');
        expect(html).not.toContain('<unsafe>');
        expect(html).toContain('1 项');
        expect(html).toContain('authority-pill--error');
        expect(html).toContain('宿主能力缺失');
        expect(html).toContain('PureTavern 不支持私有文件');
        // 非管理员不出现重扫按钮
        expect(html).not.toContain('data-action="registry-refresh"');
    });

    it('offers the admin rescan action and disables it while refreshing', () => {
        const snapshot = registrySnapshot([], []);

        const idle = renderRegistryWorkbench(registryState({ snapshot }), { isAdmin: true });
        expect(idle).toContain('data-action="registry-refresh"');
        expect(idle).not.toContain('disabled');

        const busy = renderRegistryWorkbench(registryState({ snapshot, refreshing: true }), { isAdmin: true });
        expect(busy).toContain('disabled');
        expect(busy).toContain('正在重扫');
    });

    it('renders the record detail view with dependency provenance, cross-host grid, and diagnostics', () => {
        const record = registryRecord({
            extensionId: 'third-party/bionic-memory',
            displayName: 'Bionic Memory',
            dependencies: [{ capability: 'fs', sources: ['session', 'observed'] }],
            moduleIds: ['bionic.memory.core'],
            crossHost: { estimates: { sillytavern: 'supported', luker: 'supported', puretavern: 'absent', tauritavern: 'absent' } },
            diagnostics: [{ severity: 'warning', code: 'manifest_unreadable', message: 'manifest.json 无法解析' }],
        });
        const snapshot = registrySnapshot([record], []);

        const html = renderRegistryWorkbench(
            registryState({ snapshot, selectedExtensionId: 'third-party/bionic-memory' }),
            { isAdmin: false },
        );

        expect(html).toContain('data-action="registry-back"');
        expect(html).toContain('能力依赖矩阵');
        expect(html).toContain('会话声明');
        expect(html).toContain('审计观测');
        expect(html).toContain('bionic.memory.core');
        expect(html).toContain('authority-registry-host-cell--supported');
        expect(html).toContain('authority-registry-host-cell--absent');
        expect(html).toContain('PureTavern');
        expect(html).toContain('manifest.json 无法解析');
        expect(html).not.toContain('data-action="registry-refresh"');
    });

    it('falls back to the list view when the selected record disappears after a rescan', () => {
        const snapshot = registrySnapshot([registryRecord({ extensionId: 'third-party/plain-tool' })], []);

        const html = renderRegistryWorkbench(
            registryState({ snapshot, selectedExtensionId: 'third-party/gone' }),
            { isAdmin: false },
        );

        expect(html).toContain('插件注册表');
        expect(html).toContain('扩展清单');
        expect(html).not.toContain('data-action="registry-back"');
    });
});

function registryState(overrides: Partial<RegistryViewState> = {}): RegistryViewState {
    return {
        loading: false,
        error: null,
        snapshot: null,
        selectedExtensionId: null,
        refreshing: false,
        ...overrides,
    };
}

function registrySnapshot(records: ExtensionRegistryRecord[], conflicts: RegistryListResponse['conflicts']): RegistryListResponse {
    return {
        records,
        count: records.length,
        generatedAt: '2026-09-24T00:00:00.000Z',
        conflicts,
    };
}

function registryRecord(overrides: Partial<ExtensionRegistryRecord> = {}): ExtensionRegistryRecord {
    return {
        extensionId: 'third-party/example',
        displayName: 'Example',
        version: '1.0.0',
        isAuthorityUser: false,
        dependencies: [],
        moduleIds: [],
        crossHost: { estimates: {} },
        diagnostics: [],
        ...overrides,
    };
}
