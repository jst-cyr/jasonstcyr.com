import Link from "next/link";
import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import ArticleResult from "./ArticleResult";

interface PostListProps {
  posts: SanityDocument[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  return (
    <div className="grid grid-cols-1 gap-y-6">
      {posts.map((post) => (
        <ArticleResult 
          key={post._id}
          id={post._id}
          slug={post.slug.current}
          title={post.title}
          summary={post.summary}
          publishedAt={post.publishedAt}
          image={post.image}
        />
      ))}
    </div>
  );
};

export default PostList;
