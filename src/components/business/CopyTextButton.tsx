'use client';
// Copies the text of another element (so the text is in the page once) and answers with a toast.
import { Button, toast } from '@/components/ui';

export function CopyTextButton({ targetId, label = 'คัดลอก', done = 'คัดลอกแล้ว' }: { targetId: string; label?: string; done?: string }) {
  const copy = async () => {
    const text = document.getElementById(targetId)?.textContent ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast(done, { tone: 'ok' });
    } catch {
      toast('คัดลอกไม่ได้ในเบราว์เซอร์นี้ เลือกข้อความแล้วคัดลอกเอง', { tone: 'warn' });
    }
  };
  return (
    <Button type="button" variant="ghost" icon="copy" onClick={copy}>
      {label}
    </Button>
  );
}
