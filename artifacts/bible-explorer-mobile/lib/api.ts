const DEFAULT_DOMAIN = "bibleverseinsights.com";

function baseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN || DEFAULT_DOMAIN;
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  meta_description: string | null;
  category: string | null;
  topic_name: string | null;
  author_name: string | null;
  created_at: string;
}

export interface ArticleDetail extends ArticleSummary {
  html_content: string;
  meta_title: string | null;
}

export interface ArticleListResponse {
  articles: ArticleSummary[];
  hasMore: boolean;
}

export async function fetchArticles(params: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<ArticleListResponse> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  qs.set("limit", String(params.limit ?? 30));
  qs.set("offset", String(params.offset ?? 0));

  const res = await fetch(`${baseUrl()}/api/public/articles?${qs.toString()}`);
  if (!res.ok) throw new Error(`Failed to load articles (${res.status})`);
  return res.json();
}

export async function fetchArticle(slug: string): Promise<ArticleDetail> {
  const res = await fetch(
    `${baseUrl()}/api/public/articles/${encodeURIComponent(slug)}`,
  );
  if (res.status === 404) throw new Error("Article not found");
  if (!res.ok) throw new Error(`Failed to load article (${res.status})`);
  return res.json();
}

export function canonicalUrl(category: string | null, slug: string): string {
  if (!category) return `${baseUrl()}/${slug}/`;
  return `${baseUrl()}/${category}/${slug}/`;
}
