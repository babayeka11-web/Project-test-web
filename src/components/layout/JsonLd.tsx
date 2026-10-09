// schema.org HVACBusiness for the whole site, built from COMPANY (the single source of company facts).
import { COMPANY } from '@/lib/domain/company';
import { SITE_URL } from '@/lib/site';

function businessJsonLd() {
  const postal = COMPANY.addr.match(/\d{5}\s*$/)?.[0].trim();
  const street = COMPANY.addr.replace(/\s*(แขวง|เขต|กรุงเทพ).*$/, '').trim();
  const district = COMPANY.addr.match(/แขวง\S+/)?.[0];
  const area = COMPANY.addr.match(/เขต\S+/)?.[0];
  const telDigits = COMPANY.telHref.replace(/^tel:0?/, '');
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const open = COMPANY.open.days.map((d) => days[d]);
  return {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    '@id': `${SITE_URL}/#business`,
    name: COMPANY.brand,
    legalName: COMPANY.th,
    alternateName: [COMPANY.en, COMPANY.service],
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/brand/sbp.png`,
    image: `${SITE_URL}/brand/sbp.png`,
    telephone: `+66-${telDigits.slice(0, 1)}-${telDigits.slice(1, 4)}-${telDigits.slice(4)}`,
    email: COMPANY.email,
    taxID: COMPANY.taxId,
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: [district, area].filter(Boolean).join(' '),
      addressRegion: 'กรุงเทพมหานคร',
      postalCode: postal,
      addressCountry: 'TH',
    },
    geo: { '@type': 'GeoCoordinates', latitude: COMPANY.hq.lat, longitude: COMPANY.hq.lon },
    openingHours: `${open[0]}-${open[open.length - 1]} ${COMPANY.open.from}-${COMPANY.open.to}`,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: COMPANY.open.days.map(
          (d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d],
        ),
        opens: COMPANY.open.from,
        closes: COMPANY.open.to,
      },
    ],
    areaServed: { '@type': 'AdministrativeArea', name: 'กรุงเทพมหานครและปริมณฑล' },
    currenciesAccepted: 'THB',
    sameAs: [COMPANY.lineUrl, COMPANY.fbUrl, COMPANY.webUrl],
  };
}

export function JsonLd() {
  const json = JSON.stringify(businessJsonLd()).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
