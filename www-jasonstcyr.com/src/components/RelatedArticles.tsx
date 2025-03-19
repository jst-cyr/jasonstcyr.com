import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { SearchResponse } from '@algolia/client-search';
import { PostData } from "@/types/post";
import ArticleCarousel from "./ArticleCarousel";

interface AlgoliaPost {
  _id: string;
  slug: string;
  title: string;
  body: string;
  publishedAt: string;
  image: string;
  tags: string[];
  categories: string[];
}

interface RelatedArticlesProps {
  currentSlug: string; // The slug of the current article
  title?: string; // Optional title for the related articles section
}

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

export default async function RelatedArticles({ currentSlug, title }: RelatedArticlesProps) {
  try {
    const searchResults = await searchClient.search<AlgoliaPost>([
      {
        indexName,
        params: {
          filters: `tags:${'Lani'}`, // Adjust this filter to find related articles
          hitsPerPage: 5, // Limit the number of related articles
        },
      },
    ]);

    const algoliaHits = (searchResults.results[0] as SearchResponse<AlgoliaPost>).hits;

    if (!algoliaHits || algoliaHits.length === 0) {
      return (
        <div>
          {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
          <span>No related articles found.</span>
        </div>
      );
    }

    const posts: PostData[] = algoliaHits.map(hit => ({
      id: hit.objectID,
      slug: hit.slug,
      title: hit.title,
      summary: hit.body,
      publishedAt: hit.publishedAt,
      imageUrl: hit.image,
    }));

    return (
      <div>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <ArticleCarousel posts={posts} containerId={`related_${currentSlug}`} />
      </div>
    );
  } catch (error) {
    console.error(`Error fetching related articles for slug "${currentSlug}":`, error);
    return (
      <div>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <span>Unable to retrieve related articles.</span>
      </div>
    );
  }
}