// Home — sells cleaning first and routes everyone else quickly. Server component: every price comes from the Pricebook
// through src/lib/domain; the only client code is the lazy 3D hero picture (HeroVisual) and the quick booking tool.
import type { Metadata } from 'next';
import { QuickBookingSection } from '@/components/booking/QuickBookingSection';
import { AreaTeaser } from '@/components/home/AreaTeaser';
import { BusinessTeaser } from '@/components/home/BusinessTeaser';
import { FaqTeaser } from '@/components/home/FaqTeaser';
import { Hero } from '@/components/home/Hero';
import { ProcessSection } from '@/components/home/ProcessSection';
import { ProductsTeaser } from '@/components/home/ProductsTeaser';
import { ServicesSection } from '@/components/home/ServicesSection';
import { WhySection } from '@/components/home/WhySection';
import { Button, CtaBand } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { baht } from '@/lib/domain/format';
import { cleanFrom, getFaq, getServices, getSkuCount, serviceFrom } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  // the layout's title template does not apply to the page in its own segment, so the brand is written out here
  title: { absolute: 'ล้างแอร์ ติดตั้ง ซ่อม กรุงเทพฯ · SBP AirCare' },
  description: `ล้างแอร์ ติดตั้ง ซ่อม และขายแอร์ในกรุงเทพฯ และปริมณฑล โดยทีมช่างของ ${COMPANY.th} ล้างแอร์เริ่ม ${baht(cleanFrom())} ต่อเครื่อง ราคามาตรฐานก่อน VAT ดูยอดรวมก่อนจอง`,
  alternates: { canonical: './' },
};

export default function HomePage() {
  const from = serviceFrom();
  const skuCount = getSkuCount();
  return (
    <>
      <Hero from={cleanFrom()} skuCount={skuCount} />
      <QuickBookingSection id="book" />
      <ServicesSection services={getServices()} from={from} skuCount={skuCount} />
      <WhySection />
      <ProcessSection />
      <BusinessTeaser />
      <ProductsTeaser />
      <AreaTeaser />
      <FaqTeaser items={getFaq()} />
      <CtaBand
        id="contact-cta"
        title="พร้อมล้างแอร์แล้ว จองได้เลย"
        lead="หรือโทรคุยกับทีมก่อนก็ได้ ทีมตอบในเวลาทำการ"
        actions={
          <>
            <Button data-page-cta href="#book" size="lg" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href={COMPANY.telHref} size="lg" variant="secondary" icon="phone">
              โทร {COMPANY.tel}
            </Button>
          </>
        }
        aside={
          <div className="flex flex-col gap-3">
            <Button href={COMPANY.lineUrl} variant="ghost" icon="chat">
              แชท LINE {COMPANY.line}
            </Button>
            <p className="text-small">{COMPANY.hours}</p>
          </div>
        }
      />
    </>
  );
}
