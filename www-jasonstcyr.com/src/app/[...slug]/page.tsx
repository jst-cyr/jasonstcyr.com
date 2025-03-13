import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isDatePath } from "../../utils/dateUtils";
import { POST_QUERY } from '../../queries/posts'; // Correct

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  
  // If it's not a valid date path, let Next.js try other routes
  if (!isDatePath(resolvedParams.slug)) {
    notFound();
  }

  // Get the full slug path instead of just the last segment
  const fullSlug = resolvedParams.slug.join('/');
  
  const post = await client.fetch<SanityDocument>(
    POST_QUERY,
    { slug: fullSlug },
    options
  );

  if (!post) {
    notFound();
  }

  const postImageUrl = post.image
    ? urlFor(post.image)?.url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>
      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.title}
          className="w-full h-auto object-cover rounded-xl"
        />
      )}
      <h1 className="text-4xl font-bold text-center">{post.title}</h1>
      <p className="text-center mb-8 text-sm">Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
      <div className="prose prose-invert prose-lg max-w-none">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
    </main>
  );
} 