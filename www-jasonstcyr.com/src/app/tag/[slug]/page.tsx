import TagPostList from "@/components/TagPostList";
import { notFound } from "next/navigation";

interface TagListingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TagListingPage({ params }: TagListingPageProps) {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams.slug);
  
  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-8">Posts tagged with &ldquo;{tag}&rdquo;</h1>
      <TagPostList tag={tag} />
    </main>
  );
}