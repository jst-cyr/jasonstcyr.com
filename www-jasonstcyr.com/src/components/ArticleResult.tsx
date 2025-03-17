import Link from "next/link";
import Image from "next/image";

interface ArticleResultProps {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  image: {
    asset: {
      url: string;
    };
  };
}

const ArticleResult: React.FC<ArticleResultProps> = ({ id, slug, title, summary, publishedAt, image }) => {
  return (
        <div className="p-4 border rounded-lg shadow-md" key={id}>
          <Link href={`/${slug}`} className="flex gap-6">
            <div className="w-1/4 flex-shrink-0">
              {image?.asset && (
                <Image
                  src={image.asset.url}
                  alt={title}
                  width={200}
                  height={150}
                  className="rounded-md object-cover w-full h-32"
                />
              )}
            </div>
            <div className="w-3/4">
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="text-gray-400">{new Date(publishedAt).toLocaleDateString()}</p>
              {summary && (
                <p className="text-gray-400">{summary.slice(0, 200)}...</p>
              )}
              <p className="mt-2 text-sm">Read more</p>
            </div>
          </Link>
        </div>
  );
};

export default ArticleResult;
