import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { POSTS_QUERY } from '../queries/posts';
import PostList from "@/components/PostList";
import { PostData } from "@/types/post";

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const sanityPosts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  const posts: PostData[] = sanityPosts.map(post => ({
    id: post._id,
    slug: post.slug.current,
    title: post.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
    imageUrl: post.image.asset.url
  }));

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <PostList posts={posts} />
    </main>
  );
}