// /search-index.json — the site search index, written once at build time (static export).
import { buildSearchIndex } from '@/lib/search-index';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildSearchIndex());
}
