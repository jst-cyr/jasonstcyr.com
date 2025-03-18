import ArticleResult from "./ArticleResult";
import { PostData } from "@/types/post";

interface PostListProps {
  posts: PostData[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  return (
    <div className="grid grid-cols-1 gap-y-6">
      {posts.map((post) => (
        <ArticleResult 
          key={post.id}
          id={post.id}
          slug={post.slug}
          title={post.title}
          summary={post.summary}
          publishedAt={post.publishedAt}
          imageUrl={post.imageUrl}
        />
      ))}
    </div>
  );
};

export default PostList;
