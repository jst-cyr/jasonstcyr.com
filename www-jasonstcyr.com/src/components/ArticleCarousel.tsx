import { PostData } from "@/types/post"; // Import the PostData type

interface ArticleCarouselProps {
  posts: PostData[];
}

const ArticleCarousel: React.FC<ArticleCarouselProps> = ({ posts }) => {
  return (
    <div className="carousel rounded-box">
      {posts.map((post) => (
        <div key={post.id} className="carousel-item">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover rounded-md"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
            <h2 className="text-white text-lg font-semibold">{post.title}</h2>
            <p className="text-gray-300">{new Date(post.publishedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArticleCarousel;