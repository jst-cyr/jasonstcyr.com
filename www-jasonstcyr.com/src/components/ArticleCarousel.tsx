"use client";

import { PostData } from "@/types/post"; // Import the PostData type
import { useRef } from "react";
import Link from "next/link";

interface ArticleCarouselProps {
  posts: PostData[];
  containerId: string;
}

const ArticleCarousel: React.FC<ArticleCarouselProps> = ({ posts, containerId }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (carouselRef.current) {
      // Get the scroll position before scrolling
      const currentScroll = carouselRef.current.scrollLeft;
      
      // Standard scroll amount (full item width)
      const itemWidth = carouselRef.current.querySelector('.carousel-item')?.clientWidth || 0;
      
      // If we're at the beginning, scroll to the end
      if (currentScroll <= 10) {
        carouselRef.current.scrollLeft = carouselRef.current.scrollWidth;
      } else {
        // Otherwise scroll one item width
        carouselRef.current.scrollBy({
          left: -itemWidth,
          behavior: "smooth",
        });
      }
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      // Get the total scrollable width
      const scrollableWidth = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      
      // Get the current scroll position
      const currentScroll = carouselRef.current.scrollLeft;
      
      // Standard scroll amount (full item width)
      const itemWidth = carouselRef.current.querySelector('.carousel-item')?.clientWidth || 0;
      
      // If we're near the end, scroll back to the beginning
      if (currentScroll >= scrollableWidth - 10) {
        carouselRef.current.scrollLeft = 0;
      } else {
        // Otherwise scroll one item width
        carouselRef.current.scrollBy({
          left: itemWidth,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="relative">
      <div className="carousel rounded-box" ref={carouselRef}>
        {posts.map((post) => (
          <Link 
            href={`/${post.slug}`} 
            key={`${containerId}_${post.id}`}
            className="carousel-item relative block hover:opacity-90 transition-opacity"
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-48 object-cover rounded-md"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <h2 className="text-white text-lg font-semibold">{post.title}</h2>
              <p className="text-gray-300 text-sm">{
                new Date(post.publishedAt).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                })
              }</p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button 
          onClick={scrollPrev}
          className="btn btn-circle btn-sm bg-base-200/70 border-none hover:bg-base-300 ml-2 z-10"
        >
          ❮
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button 
          onClick={scrollNext}
          className="btn btn-circle btn-sm bg-base-200/70 border-none hover:bg-base-300 mr-2 z-10"
        >
          ❯
        </button>
      </div>
    </div>
  );
};

export default ArticleCarousel;