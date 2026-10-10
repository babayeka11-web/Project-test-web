// How a job runs: the four real steps from content.ts, numbered because they are a sequence.
import { Section } from '@/components/ui';
import { PROCESS } from '@/lib/domain/content';

export function ProcessSection() {
  return (
    <Section
      id="process"
      eyebrow="ขั้นตอนการทำงาน"
      title="จากเลือกบริการ ถึงส่งมอบงาน 4 ขั้นตอน"
      lead="ราคาที่ต้องประเมินหน้างาน ทีมแจ้งให้ยืนยันก่อนเริ่มงานทุกครั้ง"
    >
      <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {PROCESS.map((step, i) => (
          <li key={step.th} className="relative flex gap-5 lg:flex-col lg:gap-5">
            {/* connector: down on phones, across on desktop */}
            {i < PROCESS.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[1.5rem] top-14 -bottom-6 w-px bg-line-strong/40 md:hidden lg:left-16 lg:right-[-1.5rem] lg:top-6 lg:bottom-auto lg:block lg:h-px lg:w-auto"
              />
            )}
            <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-bold text-on-brand shadow-card">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-h3">{step.th}</h3>
              <p className="text-small text-ink-2">{step.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
