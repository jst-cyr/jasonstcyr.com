import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import Image from "next/image";

import { client } from "@/sanity/client";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id, 
  title, 
  slug, 
  publishedAt,
  image {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  }
}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <div className="grid grid-cols-1 gap-y-6">
        {posts.map((post) => (
          <div className="p-4 border rounded-lg shadow-md" key={post._id}>
            <Link href={`/${post.slug.current}`} className="flex gap-6">
              <div className="w-1/4 flex-shrink-0">
                {post.image?.asset && (
                  <Image
                    src={post.image.asset.url}
                    alt={post.title}
                    width={200}
                    height={150}
                    className="rounded-md object-cover w-full h-32"
                  />
                )}
              </div>
              <div className="w-3/4">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600">{new Date(post.publishedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}