import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { POSTS_QUERY } from '../queries/posts';
import PostList from "@/components/PostList";
import { PostData } from "@/types/post";
import TagPostList from "@/components/TagPostList";

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const sanityPosts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  // Get data from Sanity for full listing
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
      <h1 className="text-4xl font-bold mb-8">Jason St-Cyr</h1>
      <h2 className="text-2xl font-bold mb-4 mt-8">Sitecore</h2>
      <TagPostList tag="sitecore" displayMode="carousel" />
      <h2 className="text-2xl font-bold mb-4 mt-8">Lani</h2>
      <TagPostList tag="lani" displayMode="carousel" />
      <h2 className="text-2xl font-bold mb-4 mt-8">Recent Posts</h2>
      <PostList posts={posts} containerId="recent-posts" />
    </main>
  );
}