import { liteClient as algoliasearch } from 'algoliasearch/lite';
import PostList from "./PostList";
import ArticleCarousel from './ArticleCarousel';
import { SearchResponse } from '@algolia/client-search';
import { PostData } from "@/types/post";

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

interface TagPostListProps {
  tag: string;
  title?: string;
  displayMode?: "list" | "carousel";
}

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

export default async function TagPostList({ tag, title, displayMode = "list" }: TagPostListProps) {
  try {
    const searchResults = await searchClient.search<AlgoliaPost>([
      {
        indexName,
        params: {
          filters: `tags:${tag}`,
          hitsPerPage: 100
        }
      }
    ]);

    const algoliaHits = (searchResults.results[0] as SearchResponse<AlgoliaPost>).hits;

    if (!algoliaHits || algoliaHits.length === 0) {
        return (
            <div>
                {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
                <span>Unable to find any posts for tag &ldquo;{tag}&rdquo;</span>
            </div>
        );
    }

    const posts: PostData[] = algoliaHits.map(hit => ({
      id: hit.objectID,
      slug: hit.slug,
      title: hit.title,
      summary: hit.body,
      publishedAt: hit.publishedAt,
      imageUrl: hit.image
    }));

    return (
      <div>
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        {displayMode === "carousel" ? (
            <ArticleCarousel posts={posts} />
        ) : (
            <PostList posts={posts} containerId={`tag_${tag}`} />
        )}
      </div>
    );
  } catch (error) {
    console.error(`Error fetching posts for tag "${tag}":`, error);
    return (
        <div>
            {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
            <span>Unable to retrieve posts for tag &ldquo;{tag}&rdquo;</span>
        </div>
    );
  }
} 