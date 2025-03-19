import { algoliasearch } from 'algoliasearch';
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
    postId: string; // The post ID for the current article
    currentSlug: string; // The slug of the current article
    title?: string; // Optional title for the related articles section
}

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const recommendClient = algoliasearch(algoliaAppId, algoliaApiKey).initRecommend();

export default async function RelatedArticles({ postId, title }: RelatedArticlesProps) {
    try {
        // Now use the Recommend API to get related articles using the postId
        const recommendResults = await recommendClient.getRecommendations({
            requests: [
                {
                    indexName,
                    objectID: postId, // Use postId directly for the recommendation
                    model: 'related-products',  // This is the model for related content
                    threshold: 0,  // Minimum similarity score (0-100)
                    maxRecommendations: 5
                },
            ]
        });

        if (!recommendResults.results || 
            recommendResults.results.length === 0 || 
            !recommendResults.results[0].hits || 
            recommendResults.results[0].hits.length === 0) {
            return (
                <div>
                    {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
                    <span>No related articles found.</span>
                </div>
            );
        }

        const relatedPosts = recommendResults.results[0].hits;

        const posts: PostData[] = relatedPosts.map((hit: any) => ({
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
                <ArticleCarousel posts={posts} containerId={`related_${postId}`} />
            </div>
        );
    } catch (error) {
        console.error(`Error fetching related articles for postId "${postId}":`, error);
        return (
            <div>
                {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
                <span>Unable to retrieve related articles.</span>
            </div>
        );
    }
}