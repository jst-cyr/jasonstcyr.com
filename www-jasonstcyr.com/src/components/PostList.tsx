import Link from "next/link";
import Image from "next/image";
import { type SanityDocument } from "next-sanity";

interface PostListProps {
  posts: SanityDocument[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  return (
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
              <p className="text-gray-400">{new Date(post.publishedAt).toLocaleDateString()}</p>
              {post.summary && (
                <p className="text-gray-400">{post.summary.slice(0, 200)}...</p>
              )}
              <p className="mt-2 text-sm">Read more</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default PostList;
