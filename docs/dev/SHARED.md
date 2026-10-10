# Shared components (`src/components/shared/*`) — used by several pages

| Component | Use |
|---|---|
| `TypeArt` (`TypeArt.tsx`) | `<TypeArt type="wall" className="h-24 w-32 text-brand" />` — neutral line art of an AC type (wall / ceiling / cassette / floor / duct) wherever a product photo would go. Label it "ภาพประกอบ" nearby when it stands in for a product. |
| `AddToQuote` (`AddToQuote.tsx`, client) | `<AddToQuote lines={() => productLines({...})} />` — adds lines to the quote, toasts "เพิ่มในใบเสนอราคาแล้ว · ดูใบเสนอราคา", refuses VRV/VRF (points to /contact/?topic=vrf). Props: `lines` (array or builder), `label`, `variant` (default secondary), `size`, `fullWidth`, `disabled`, `onAdded`. |
| `HandoffBox` (`HandoffBox.tsx`, client) | Result of a request: `<HandoffBox kind="contact" result={sendResult} text={summary} onReset={…} />`. Pair with `src/lib/request.ts`: `const ref = makeRef(); const text = buildSummary(kind, ref, fields, extra); const result = await submitRequest(kind, ref, fields, text);`. Says "ส่งถึงทีมแล้ว" only on a real 2xx; otherwise offers LINE (text typed in) · copy · call · e-mail. |
| `AddressPicker` + `ZoneResult` (`AddressPicker.tsx`, client) | Job-site area: postal-style type-ahead on the lazy address book + "ใช้ตำแหน่งปัจจุบัน". By default (`syncCart`) the pick becomes the quote's area (`useCart().zone`), so booking, area check and quote share one answer. `showResult` renders `ZoneResult` (tier · km · travel fee). `syncCart={false}` + `value`/`onPick` for a standalone picker. |
