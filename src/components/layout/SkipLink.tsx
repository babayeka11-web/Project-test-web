/** First focusable element on every page: jumps keyboard users past the header to <main id="main">. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed left-4 top-3 z-[100] -translate-y-[200%] rounded-full bg-brand px-5 py-3 font-semibold text-on-brand no-underline shadow-pop transition-transform duration-150 ease-air focus:translate-y-0"
    >
      ข้ามไปยังเนื้อหาหลัก
    </a>
  );
}
