import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isDatePath } from "../../utils/dateUtils";
import { POST_QUERY } from '../../queries/posts'; // Correct
import Image from "next/image"; // Import the Image component
import TagPostList from "@/components/TagPostList";
import RelatedArticles from "@/components/RelatedArticles"; // Import the new component

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
      <div className="text-center">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="text-sm">Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
      </div>
      <div className="flex flex-wrap gap-2">
      {postImageUrl && (
        <Image
          src={postImageUrl}
          alt={post.title}
          width={600} // Set the width
          height={400} // Set the height
          className="responsive cover rounded-xl" // Add any additional classes
        />
      )}
      </div>
      <div className="mb-8 text-center flex justify-center gap-4 text-sm">
        <div className="flex gap-2">
          {post.categories.map((category: string) => (
            <span key={category} className="bg-gray-900 px-2 py-1 rounded-full">
              {category}
            </span>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1">Tags:</span> 
          {post.tags.map((tag: string) => (
            <Link key={tag} href={`/tag/${tag.toLowerCase()}`} className="bg-gray-900 px-2 py-1 rounded-full">
              {tag}
            </Link>
          ))}
        </div>
      </div>
      <div className="prose prose-invert prose-lg max-w-none">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
      {post.seriesTag && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold">More From the &ldquo;{post.seriesTag}&rdquo; Series</h2>
          <TagPostList tag={post.seriesTag} displayMode="carousel" />
        </div>
      )}
      <RelatedArticles postId={post._id} title="Related Articles" /> {/* Add the RelatedArticles component */}
    </main>
  );
} 