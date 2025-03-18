import { liteClient as algoliasearch } from 'algoliasearch/lite';
import PostList from "@/components/PostList";
import { notFound } from "next/navigation";
import { PostData } from "@/types/post";
import { SearchResponse } from '@algolia/client-search';

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

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

interface TagListingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TagListingPage({ params }: TagListingPageProps) {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams.slug);
  
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
      console.log(searchResults);
    }

    const posts: PostData[] = algoliaHits.map(hit => ({
      id: hit._id,
      slug: hit.slug,
      title: hit.title,
      summary: hit.body,
      publishedAt: hit.publishedAt,
      imageUrl: hit.image
    }));

    return (
      <main className="container mx-auto min-h-screen max-w-4xl p-8">
        <h1 className="text-4xl font-bold mb-8">Posts tagged with &ldquo;{tag}&rdquo;</h1>
        <PostList posts={posts} />
      </main>
    );
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    notFound();
  }
}