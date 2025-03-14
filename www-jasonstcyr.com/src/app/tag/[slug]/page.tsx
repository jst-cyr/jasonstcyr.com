import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/client";
import { POSTS_BY_TAG_QUERY } from '../../../queries/posts';
import PostList from "@/components/PostList";
import { notFound } from "next/navigation";

const options = { next: { revalidate: 30 } };

interface TagListingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TagListingPage({ params }: TagListingPageProps) {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams.slug);
  const posts = await client.fetch<SanityDocument[]>(
    POSTS_BY_TAG_QUERY,
    { tag } as Record<string, string>,
    options
  );

  if (!posts || posts.length === 0) {
    notFound();
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts tagged with &ldquo;{tag}&rdquo;</h1>
      <PostList posts={posts} />
    </main>
  );
}