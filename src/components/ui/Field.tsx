'use client';
// Form fields. <Field> renders the visible label, hint and error and wires them to the control inside it
// (id, aria-describedby, aria-invalid, required) through context — so <Field label="เบอร์โทร"><Input type="tel" /></Field>
// is fully labelled. Controls also work alone with their own props.
import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

type FieldCtx = { id: string; describedBy?: string; invalid: boolean; required?: boolean };
const FieldContext = createContext<FieldCtx | null>(null);

function useFieldProps<T extends { id?: string; required?: boolean; 'aria-describedby'?: string; 'aria-invalid'?: unknown }>(
  props: T,
) {
  const ctx = useContext(FieldContext);
  const describedBy = [ctx?.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  return {
    id: props.id ?? ctx?.id,
    required: props.required ?? ctx?.required,
    'aria-describedby': describedBy,
    'aria-invalid': (props['aria-invalid'] as boolean | undefined) ?? (ctx?.invalid || undefined),
  };
}

/* ── Field ─────────────────────────────────────────────────────────────────────────────────────── */

export type FieldProps = {
  label: ReactNode;
  children: ReactNode;
  /** Help under the label, always visible (format, why we ask). */
  hint?: ReactNode;
  /** Error under the control. Say what is wrong and how to fix it. */
  error?: ReactNode;
  /** Adds the red "*" and sets required on the control. */
  required?: boolean;
  /** Adds "(ไม่บังคับ)" — use on optional fields in forms where most fields are required. */
  optional?: boolean;
  /** Explicit id for the control (otherwise generated). */
  id?: string;
  className?: string;
};

export function Field({ label, children, hint, error, required, optional, id, className }: FieldProps) {
  const auto = useId();
  const controlId = id ?? `f${auto.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  return (
    <FieldContext.Provider
      value={{ id: controlId, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined, invalid: !!error, required }}
    >
      <div className={cn('flex flex-col gap-2', className)}>
        <label htmlFor={controlId} className="text-small font-semibold leading-snug text-ink">
          {label}
          {required && <RequiredMark />}
          {optional && <span className="ml-1.5 font-normal text-ink-3">(ไม่บังคับ)</span>}
        </label>
        {hint && (
          <p id={hintId} className="-mt-1 text-meta text-ink-3">
            {hint}
          </p>
        )}
        {children}
        <FieldError id={errorId}>{error}</FieldError>
      </div>
    </FieldContext.Provider>
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden className="ml-1 text-cta">
        *
      </span>
      <span className="sr-only"> (จำเป็น)</span>
    </>
  );
}

function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  // The live region is always present so a newly shown error is announced.
  return (
    <div aria-live="polite" className="empty:hidden">
      {children ? (
        <p id={id} className="flex items-start gap-1.5 text-small font-medium text-bad">
          <Icon name="alert" size={16} className="mt-[0.2em]" strokeWidth={2} />
          <span>{children}</span>
        </p>
      ) : null}
    </div>
  );
}

/* ── Fieldset (a group of radios/checkboxes) ───────────────────────────────────────────────────── */

export type FieldsetProps = {
  legend: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Hide the legend visually (it stays for screen readers). */
  hideLegend?: boolean;
  className?: string;
};

export function Fieldset({ legend, children, hint, error, required, hideLegend, className }: FieldsetProps) {
  const auto = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hintId = hint ? `fs${auto}-hint` : undefined;
  const errorId = error ? `fs${auto}-error` : undefined;
  return (
    <fieldset
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      <legend className={cn('mb-1 text-small font-semibold text-ink', hideLegend && 'sr-only')}>
        {legend}
        {required && <RequiredMark />}
      </legend>
      {hint && (
        <p id={hintId} className="-mt-2 text-meta text-ink-3">
          {hint}
        </p>
      )}
      {children}
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

/* ── Text controls ─────────────────────────────────────────────────────────────────────────────── */

const control = cn(
  'w-full min-w-0 rounded-control border border-line-strong bg-surface text-body text-ink',
  'placeholder:text-ink-3/80 transition-[border-color,box-shadow] duration-150 ease-air',
  'hover:border-ink-3 focus:border-focus focus:outline-hidden focus:ring-4 focus:ring-focus/20',
  'aria-[invalid=true]:border-bad aria-[invalid=true]:focus:ring-bad/20',
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70',
);

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Icon inside the field, on the left. */
  icon?: IconName;
  /** Short text inside the field, on the right (unit: "เครื่อง", "ตร.ม."). */
  suffix?: ReactNode;
  size?: 'md' | 'lg';
};

export function Input({ icon, suffix, size = 'md', className, ...props }: InputProps) {
  const wired = useFieldProps(props);
  const input = (
    <input
      {...props}
      {...wired}
      className={cn(
        control,
        size === 'lg' ? 'h-14 text-[1.0625rem]' : 'h-12',
        icon ? 'pl-11' : 'pl-4',
        suffix ? 'pr-16' : 'pr-4',
        !icon && !suffix && className,
      )}
    />
  );
  if (!icon && !suffix) return input;
  return (
    <div className={cn('relative', className)}>
      {icon && (
        <Icon name={icon} size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-small text-ink-3">{suffix}</span>
      )}
    </div>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  const wired = useFieldProps(props);
  return (
    <textarea rows={rows} {...props} {...wired} className={cn(control, 'min-h-28 resize-y px-4 py-3 leading-relaxed', className)} />
  );
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  /** Text of an empty first option ("เลือกประเภทแอร์"). */
  placeholder?: string;
  size?: 'md' | 'lg';
};

export function Select({ className, placeholder, children, size = 'md', ...props }: SelectProps) {
  const wired = useFieldProps(props);
  return (
    <div className={cn('relative', className)}>
      <select
        {...props}
        {...wired}
        className={cn(control, 'appearance-none pl-4 pr-11', size === 'lg' ? 'h-14 text-[1.0625rem]' : 'h-12')}
      >
        {placeholder && (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-2"
        strokeWidth={2}
      />
    </div>
  );
}

/* ── Checkbox and radio ────────────────────────────────────────────────────────────────────────── */

export type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label: ReactNode;
  /** Second line under the label. */
  description?: ReactNode;
  /** row = box + text · card = bordered option card (for 2–4 important choices). */
  variant?: 'row' | 'card';
  /** Right-hand content in card variant (e.g. a Price). */
  aside?: ReactNode;
};

function Choice({ type, label, description, variant = 'row', aside, className, ...props }: ChoiceProps & { type: 'checkbox' | 'radio' }) {
  const wired = useFieldProps(props);
  const autoId = useId();
  const id = wired.id ?? `c${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const descId = description ? `${id}-desc` : undefined;
  // Name = label (+ aside, e.g. its price); the description is only the description. Labelling by the whole <label>
  // read the description twice.
  const labelledBy = [`${id}-label`, aside ? `${id}-aside` : null].filter(Boolean).join(' ');
  const card = variant === 'card';
  return (
    <label
      htmlFor={id}
      className={cn(
        'group/choice relative flex min-h-11 cursor-pointer items-start gap-3',
        card &&
          'rounded-control border border-line bg-surface p-4 shadow-card transition-[border-color,background-color,box-shadow] duration-150 ease-air hover:border-sky/50 has-checked:border-brand has-checked:bg-sky-soft/40 has-checked:ring-1 has-checked:ring-brand has-focus-visible:ring-2 has-focus-visible:ring-focus has-disabled:cursor-not-allowed has-disabled:opacity-60',
        // transparent outline = invisible normally; Windows High Contrast paints it where the box-shadow ring is dropped
        card && 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-transparent',
        !card && 'py-1.5 has-disabled:cursor-not-allowed has-disabled:opacity-60',
        className,
      )}
    >
      <input
        {...props}
        id={id}
        type={type}
        aria-labelledby={props['aria-labelledby'] ?? (props['aria-label'] ? undefined : labelledBy)}
        aria-describedby={[descId, wired['aria-describedby']].filter(Boolean).join(' ') || undefined}
        aria-invalid={wired['aria-invalid']}
        required={wired.required}
        className={cn(
          'peer mt-0.5 size-[1.375rem] shrink-0 cursor-pointer appearance-none border-[1.5px] border-line-strong bg-surface transition-[background-color,border-color,box-shadow] duration-150 ease-air',
          type === 'checkbox' ? 'rounded-md' : 'rounded-full',
          'checked:border-brand checked:bg-brand hover:border-brand',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          card && 'focus-visible:outline-none',
          'aria-[invalid=true]:border-bad disabled:cursor-not-allowed',
          // Windows High Contrast: draw checked/unchecked with system colours instead of losing the fill
          'forced-colors:forced-color-adjust-none forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
          'forced-colors:checked:border-[SelectedItem] forced-colors:checked:bg-[SelectedItem]',
        )}
      />
      {/* Check mark / dot drawn over the native control. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute grid size-[1.375rem] place-items-center text-on-brand opacity-0 transition-opacity duration-150 peer-checked:opacity-100',
          'forced-colors:forced-color-adjust-none forced-colors:text-[SelectedItemText]',
          card ? 'left-4 top-[1.125rem]' : 'left-0 top-2',
        )}
      >
        {type === 'checkbox' ? (
          <Icon name="check" size={16} strokeWidth={2.5} />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={`${id}-label`} className="font-medium leading-snug text-ink">
          {label}
        </span>
        {description && (
          <span id={descId} className="text-small text-ink-2">
            {description}
          </span>
        )}
      </span>
      {aside && (
        <span id={`${id}-aside`} className="shrink-0 self-center">
          {aside}
        </span>
      )}
    </label>
  );
}

/** Checkbox with its label. */
export function Checkbox(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />;
}

/** One radio option. Group several with the same `name` inside a <Fieldset>. */
export function Radio(props: ChoiceProps) {
  return <Choice type="radio" {...props} />;
}
