import { marginBadgeClass, marginBadgeLabel, marginPercent } from '../../utils/marginCalc'

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

function TableSkeleton() {
  return [...Array(8)].map((_, i) => (
    <tr key={i} className="border-b border-zinc-800/40">
      {[...Array(9)].map((__, j) => (
        <td key={j} className="px-3 py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-800/70" />
        </td>
      ))}
    </tr>
  ))
}

export function MarginTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAllVisible,
  sortKey,
  sortDir,
  onSort,
  loading,
  emptyState,
}) {
  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id))

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => onToggleAllVisible(rows)}
                  disabled={loading || rows.length === 0}
                  aria-label="Select all visible"
                  className="rounded border-zinc-600 disabled:opacity-40"
                />
              </th>
              <th className="px-3 py-3">
                <SortButton
                  label="Brand"
                  active={sortKey === 'brand'}
                  dir={sortDir}
                  onClick={() => onSort('brand')}
                  disabled={loading}
                />
              </th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">MSPN</th>
              <th className="px-3 py-3">LR</th>
              <th className="px-3 py-3">CTS</th>
              <th className="px-3 py-3">
                <SortButton
                  label="Retail"
                  active={sortKey === 'retail'}
                  dir={sortDir}
                  onClick={() => onSort('retail')}
                  disabled={loading}
                />
              </th>
              <th className="px-3 py-3">
                <SortButton
                  label="Margin %"
                  active={sortKey === 'margin'}
                  dir={sortDir}
                  onClick={() => onSort('margin')}
                  disabled={loading}
                />
              </th>
              <th className="px-3 py-3">Category</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-14 text-center text-sm leading-relaxed text-zinc-500"
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const m = marginPercent(row.retailPrice, row.cts)
                return (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/80 hover:bg-zinc-900/40"
                  >
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => onToggle(row.id)}
                        aria-label={`Select ${row.mspn}`}
                        className="rounded border-zinc-600"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-200">
                      {row.brand || '—'}
                    </td>
                    <td className="max-w-[220px] px-3 py-2 text-zinc-400">
                      {row.description || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                      {row.mspn || '—'}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{row.lr || '—'}</td>
                    <td className="px-3 py-2 text-zinc-300">
                      {formatMoney(row.cts)}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">
                      {formatMoney(row.retailPrice)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${marginBadgeClass(m)}`}
                      >
                        {m != null ? `${m.toFixed(1)}%` : '—'}{' '}
                        <span className="ml-1 opacity-80">
                          {marginBadgeLabel(m)}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {row.category || '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 px-1 text-center text-[11px] text-zinc-600 md:hidden">
        Scroll horizontally to see all columns.
      </p>
    </div>
  )
}

function SortButton({ label, active, dir, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
      {active ? (dir === 'asc' ? '↑' : '↓') : ''}
    </button>
  )
}
