import type {
    AuthorityCapability,
    DependencySource,
    ExtensionRegistryRecord,
    RegistryConflict,
    RegistryConflictKind,
    RegistryDiagnostic,
    RegistryHost,
    HostCapabilityLevel,
    RegistryListResponse,
} from '@stdo/shared-types';
import { escapeHtml } from '../dom.js';
import type { RegistryViewState } from './types.js';

const HOST_LABELS: Record<RegistryHost, string> = {
    sillytavern: 'SillyTavern',
    luker: 'Luker',
    puretavern: 'PureTavern',
    tauritavern: 'TauriTavern',
};

const HOST_ORDER: readonly RegistryHost[] = ['sillytavern', 'luker', 'puretavern', 'tauritavern'];

const CAPABILITY_LABELS: Record<AuthorityCapability, string> = {
    sql: 'SQL 数据库',
    kv: '键值数据',
    blob: '文件存储',
    fs: '私有文件',
    http: 'HTTP 访问',
    jobs: '后台任务',
    events: '事件流',
    trivium: 'Trivium 记忆库',
    agent: 'Agent 运行',
    'host-bridge': 'Host Bridge',
};

const SOURCE_LABELS: Record<DependencySource, string> = {
    manifest: '模块清单',
    session: '会话声明',
    observed: '审计观测',
};

const CONFLICT_KIND_LABELS: Record<RegistryConflictKind, string> = {
    duplicate_module_id: '模块 ID 冲突',
    duplicate_transaction: '事务重名',
    protocol_mismatch: '协议版本不匹配',
    unsupported_capability_on_host: '宿主能力缺失',
};

export function getRegistryHostLabel(host: RegistryHost): string {
    return HOST_LABELS[host];
}

export function getRegistryCapabilityLabel(capability: AuthorityCapability): string {
    return CAPABILITY_LABELS[capability];
}

export function getRegistryHostLevelLabel(level: HostCapabilityLevel): string {
    switch (level) {
        case 'supported': return '可用';
        case 'degraded': return '降级';
        case 'absent': return '不可用';
        default: return '未知';
    }
}

export function getRegistrySourceLabel(source: DependencySource): string {
    return SOURCE_LABELS[source];
}

export function getRegistryConflictKindLabel(kind: RegistryConflictKind): string {
    return CONFLICT_KIND_LABELS[kind];
}

/** 插件注册表版块（L12 只读发现层）。清单 → 冲突 → 详情三视图，
 * 全部由主入口的 `data-action="registry-*"` / `data-tab="registry"` 交互驱动。
 */
export function renderRegistryWorkbench(state: RegistryViewState, options: { isAdmin: boolean } = { isAdmin: false }): string {
    if (state.error) {
        return `
            <div class="authority-governance-page">
                <header class="authority-governance-page__header">
                    <div>
                        <h2>插件注册表</h2>
                        <p>读取失败：${escapeHtml(state.error)}</p>
                    </div>
                </header>
                <div class="authority-empty">可以稍后重试，或联系管理员执行一次重新扫描。</div>
            </div>
        `;
    }

    if (state.loading || !state.snapshot) {
        return `
            <div class="authority-governance-page">
                <header class="authority-governance-page__header">
                    <div>
                        <h2>插件注册表</h2>
                        <p>正在读取当前实例的扩展清单、依赖矩阵与冲突检测结果。</p>
                    </div>
                </header>
                <div class="authority-empty">加载中…</div>
            </div>
        `;
    }

    if (state.selectedExtensionId) {
        const record = state.snapshot.records.find(item => item.extensionId === state.selectedExtensionId);
        if (record) {
            return renderRegistryRecordView(record, state);
        }
    }

    return renderRegistryListView(state.snapshot, options.isAdmin, state.refreshing);
}

function renderRegistryListView(snapshot: RegistryListResponse, isAdmin: boolean, refreshing: boolean): string {
    const conflicts = snapshot.conflicts;
    const errorCount = conflicts.filter(conflict => conflict.severity === 'error').length;
    const warningCount = conflicts.filter(conflict => conflict.severity === 'warning').length;
    const authorityUserCount = snapshot.records.filter(record => record.isAuthorityUser).length;

    return `
        <div class="authority-governance-page">
            <header class="authority-governance-page__header">
                <div>
                    <h2>插件注册表</h2>
                    <p>只读发现层：扫描已装扩展目录与 Authority 各服务记录，聚合依赖矩阵与静态冲突检测结果。</p>
                </div>
                <div class="authority-page-actions">
                    <span class="authority-inline-stat"><strong>${snapshot.count}</strong> 个扩展</span>
                    <span class="authority-inline-stat"><strong>${authorityUserCount}</strong> 个使用 Authority</span>
                    ${isAdmin
        ? `<button type="button" class="authority-action-button" data-action="registry-refresh"${refreshing ? ' disabled' : ''}>${refreshing ? '正在重扫…' : '重新扫描'}</button>`
        : ''}
                </div>
            </header>

            <div class="authority-governance-glance" aria-label="注册表摘要">
                <span><small>扩展总数</small><strong>${snapshot.count}</strong></span>
                <span><small>Authority 用户</small><strong>${authorityUserCount}</strong></span>
                <span class="${errorCount > 0 ? 'authority-governance-glance--warning' : ''}"><small>错误级冲突</small><strong>${errorCount}</strong></span>
                <span class="${warningCount > 0 ? 'authority-governance-glance--warning' : ''}"><small>警告级冲突</small><strong>${warningCount}</strong></span>
            </div>

            <main class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>扩展清单</h3>
                        <div class="authority-muted">点击行查看依赖矩阵与跨宿主可用性</div>
                    </div>
                </div>
                ${renderRegistryRecordTable(snapshot.records, conflicts)}
            </main>

            <section class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>冲突检测结果</h3>
                        <div class="authority-muted">静态规则推算，注册表不执行任何扩展代码，也不提供启停仲裁</div>
                    </div>
                </div>
                ${renderRegistryConflictGroups(conflicts)}
            </section>
        </div>
    `;
}

function renderRegistryRecordTable(records: ExtensionRegistryRecord[], conflicts: RegistryConflict[]): string {
    if (records.length === 0) {
        return '<div class="authority-empty">当前没有发现任何扩展目录。</div>';
    }

    const conflictCountByExtension = new Map<string, number>();
    for (const conflict of conflicts) {
        for (const extensionId of conflict.extensionIds) {
            conflictCountByExtension.set(extensionId, (conflictCountByExtension.get(extensionId) ?? 0) + 1);
        }
    }

    return `
        <div class="authority-table-wrap">
            <table class="authority-data-table">
                <thead>
                    <tr>
                        <th>扩展</th>
                        <th>版本</th>
                        <th>Authority</th>
                        <th>能力依赖</th>
                        <th>冲突</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => {
        const conflictCount = conflictCountByExtension.get(record.extensionId) ?? 0;
        return `
                        <tr>
                            <td>
                                <button type="button" class="authority-registry-record-link" data-action="registry-select-record" data-extension-id="${escapeHtml(record.extensionId)}">
                                    <strong>${escapeHtml(record.displayName)}</strong>
                                    <code>${escapeHtml(record.extensionId)}</code>
                                </button>
                            </td>
                            <td>${record.version === null ? '<span class="authority-muted">未知</span>' : escapeHtml(record.version)}</td>
                            <td>${record.isAuthorityUser ? '<span class="authority-pill authority-pill--success">在用</span>' : '<span class="authority-pill authority-pill--muted">未接入</span>'}</td>
                            <td>${record.dependencies.length > 0 ? `${record.dependencies.length} 项` : '<span class="authority-muted">无</span>'}</td>
                            <td>${conflictCount > 0
            ? `<span class="authority-pill authority-pill--error">${conflictCount} 条</span>`
            : '<span class="authority-muted">—</span>'}</td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRegistryRecordView(record: ExtensionRegistryRecord, state: RegistryViewState): string {
    const conflicts = state.snapshot?.conflicts.filter(conflict => conflict.extensionIds.includes(record.extensionId)) ?? [];

    return `
        <div class="authority-governance-page">
            <header class="authority-governance-page__header">
                <div>
                    <h2>${escapeHtml(record.displayName)}</h2>
                    <p><code>${escapeHtml(record.extensionId)}</code>${record.version === null ? '' : ` · v${escapeHtml(record.version)}`}</p>
                </div>
                <div class="authority-page-actions">
                    <button type="button" class="authority-action-button" data-action="registry-back">返回清单</button>
                </div>
            </header>

            <div class="authority-governance-glance" aria-label="扩展摘要">
                <span><small>Authority 用户</small><strong>${record.isAuthorityUser ? '是' : '否'}</strong></span>
                <span><small>能力依赖</small><strong>${record.dependencies.length}</strong></span>
                <span><small>模块 ID</small><strong>${record.moduleIds.length}</strong></span>
                <span><small>相关冲突</small><strong>${conflicts.length}</strong></span>
            </div>

            <main class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>能力依赖矩阵</h3>
                        <div class="authority-muted">来源按 模块清单 > 会话声明 > 审计观测 去重合并</div>
                    </div>
                </div>
                ${renderRegistryDependencyMatrix(record.dependencies)}
                ${record.moduleIds.length > 0 ? `
                <div class="authority-section-heading">
                    <div>
                        <h3>Companion 模块</h3>
                    </div>
                </div>
                <div class="authority-chip-row">${record.moduleIds.map(moduleId => `<span class="authority-pill authority-pill--prompt">${escapeHtml(moduleId)}</span>`).join('')}</div>
                ` : ''}
            </main>

            <section class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>跨宿主可用性</h3>
                        <div class="authority-muted">依赖集 × 静态能力矩阵的推算结果，非运行时探测</div>
                    </div>
                </div>
                ${renderRegistryCrossHostGrid(record)}
            </section>

            ${conflicts.length > 0 ? `
            <section class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>涉及该扩展的冲突</h3>
                    </div>
                </div>
                ${renderRegistryConflictGroups(conflicts)}
            </section>
            ` : ''}

            <section class="authority-pane-section">
                <div class="authority-section-heading">
                    <div>
                        <h3>扫描诊断</h3>
                        <div class="authority-muted">最近一次扫描产出的提示，不影响其他扩展记录</div>
                    </div>
                </div>
                ${renderRegistryDiagnostics(record.diagnostics)}
            </section>
        </div>
    `;
}

function renderRegistryDependencyMatrix(dependencies: ExtensionRegistryRecord['dependencies']): string {
    if (dependencies.length === 0) {
        return '<div class="authority-empty">该扩展没有声明或观测到任何 Authority 能力依赖。</div>';
    }

    return `
        <div class="authority-table-wrap">
            <table class="authority-data-table">
                <thead>
                    <tr>
                        <th>能力</th>
                        <th>依赖来源</th>
                    </tr>
                </thead>
                <tbody>
                    ${dependencies.map(entry => `
                        <tr>
                            <td><strong>${escapeHtml(getRegistryCapabilityLabel(entry.capability))}</strong><div class="authority-muted">${escapeHtml(entry.capability)}</div></td>
                            <td><div class="authority-chip-row">${entry.sources.map(source => `<span class="authority-pill authority-pill--usage">${escapeHtml(getRegistrySourceLabel(source))}</span>`).join('')}</div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRegistryCrossHostGrid(record: ExtensionRegistryRecord): string {
    return `
        <div class="authority-registry-host-grid">
            ${HOST_ORDER.map(host => {
        const level = record.crossHost.estimates[host] ?? (record.dependencies.length === 0 ? 'supported' : 'absent');
        return `
                <div class="authority-registry-host-cell authority-registry-host-cell--${level}">
                    <strong>${escapeHtml(getRegistryHostLabel(host))}</strong>
                    <span>${escapeHtml(getRegistryHostLevelLabel(level))}</span>
                </div>
            `;
    }).join('')}
        </div>
    `;
}

function renderRegistryConflictGroups(conflicts: RegistryConflict[]): string {
    if (conflicts.length === 0) {
        return '<div class="authority-empty">没有检测到冲突。</div>';
    }

    const errors = conflicts.filter(conflict => conflict.severity === 'error');
    const warnings = conflicts.filter(conflict => conflict.severity === 'warning');
    const infos = conflicts.filter(conflict => conflict.severity === 'info');

    return `
        <div class="authority-stack">
            ${[
        ...errors.map(item => renderRegistryConflictRow(item, 'error')),
        ...warnings.map(item => renderRegistryConflictRow(item, 'warning')),
        ...infos.map(item => renderRegistryConflictRow(item, 'info')),
    ].join('')}
        </div>
    `;
}

function renderRegistryConflictRow(conflict: RegistryConflict, severity: 'error' | 'warning' | 'info'): string {
    return `
        <div class="authority-list-card">
            <div>
                <strong>${escapeHtml(getRegistryConflictKindLabel(conflict.kind))}</strong>
                <div class="authority-muted">${conflict.extensionIds.map(id => `<code>${escapeHtml(id)}</code>`).join(' · ')}</div>
                <div>${escapeHtml(conflict.detail)}</div>
            </div>
            <div class="authority-list-card__actions">
                <span class="authority-pill authority-pill--${severity}">${severity === 'error' ? '错误' : severity === 'warning' ? '警告' : '提示'}</span>
            </div>
        </div>
    `;
}

function renderRegistryDiagnostics(diagnostics: RegistryDiagnostic[]): string {
    if (diagnostics.length === 0) {
        return '<div class="authority-empty">该扩展没有扫描诊断。</div>';
    }

    return `
        <div class="authority-stack">
            ${diagnostics.map(diagnostic => `
                <div class="authority-list-card">
                    <div>
                        <strong>${escapeHtml(diagnostic.message)}</strong>
                        <div class="authority-muted"><code>${escapeHtml(diagnostic.code)}</code></div>
                    </div>
                    <div class="authority-list-card__actions">
                        <span class="authority-pill authority-pill--${diagnostic.severity}">${diagnostic.severity === 'error' ? '错误' : diagnostic.severity === 'warning' ? '警告' : '提示'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
