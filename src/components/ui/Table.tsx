// Data table in its own scroll box: never makes the page scroll sideways, keyboard-scrollable (tabIndex=0),
// header sticks while the box scrolls (give it maxHeight), soft edge shadows show there is more to the side.
import { useId, type ReactNode } from 'react';
import { cn } from './cn';

export type TableColumn = {
  key: string;
  label: ReactNode;
  align?: 'start' | 'center' | 'end';
  /** Tabular figures, no wrapping (prices, BTU). */
  numeric?: boolean;
  /** Render the cells of this column as row headers (<th scope="row">). */
  rowHeader?: boolean;
  className?: string;
};

export type TableRow = { id?: string | number } & Record<string, ReactNode>;

export type TableProps = {
  /** What the table lists — read by screen readers and used as the scroll box label. */
  caption: string;
  /** Show the caption above the table (otherwise screen-reader only). */
  showCaption?: boolean;
  columns: TableColumn[];
  rows: TableRow[];
  /** e.g. '28rem' — the box scrolls vertically and the header sticks. */
  maxHeight?: string;
  /** Keep the first column visible while scrolling sideways. */
  stickyFirstColumn?: boolean;
  /** Minimum table width before it scrolls sideways (default 36rem). */
  minWidth?: string;
  className?: string;
  /** Shown under the table (source, VAT note). */
  footnote?: ReactNode;
};

export function Table({
  caption,
  showCaption,
  columns,
  rows,
  maxHeight,
  stickyFirstColumn,
  minWidth = '36rem',
  className,
  footnote,
}: TableProps) {
  const id = useId();
  return (
    <figure className={cn('grid gap-3', className)}>
      {showCaption && (
        <figcaption id={`${id}-cap`} className="font-semibold text-ink">
          {caption}
        </figcaption>
      )}
      <TableShell label={showCaption ? undefined : caption} labelledBy={showCaption ? `${id}-cap` : undefined} maxHeight={maxHeight}>
        <table className="ui-table" style={{ minWidth }} data-sticky-first={stickyFirstColumn || undefined}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" data-align={c.align} className={c.className}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                {columns.map((c) => {
                  const Cell = c.rowHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={c.key}
                      scope={c.rowHeader ? 'row' : undefined}
                      data-align={c.align}
                      data-numeric={c.numeric || undefined}
                      className={c.className}
                    >
                      {r[c.key]}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
      {footnote && <p className="text-meta text-ink-3">{footnote}</p>}
    </figure>
  );
}

export type TableShellProps = {
  children: ReactNode;
  label?: string;
  labelledBy?: string;
  maxHeight?: string;
  className?: string;
};

/** The scroll box alone, for hand-written <table className="ui-table"> markup. */
export function TableShell({ children, label, labelledBy, maxHeight, className }: TableShellProps) {
  return (
    <div
      role="region"
      aria-label={label}
      aria-labelledby={labelledBy}
      tabIndex={0}
      style={maxHeight ? { maxHeight } : undefined}
      className={cn(
        'scroll-shadow-x overflow-auto overscroll-x-contain rounded-control border border-line shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
