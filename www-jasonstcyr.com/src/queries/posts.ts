import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { PortableTextBlock, SanityDocument } from "next-sanity";

export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

export const POSTS_BY_TAG_QUERY = `*[
  _type == "post"
  && defined(slug.current)
  && $tag in tags[]
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
  },
  "summary": body[0].children[0].text
}`;

export const POSTS_QUERY = `*[
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
  },
  // Extract text from the body blocks
  "summary": body[0].children[0].text // Get the first block of text
}`;

export type Post = SanityDocument & {
  title: string;
  body: PortableTextBlock[];
  publishedAt: string;
  image: SanityImageSource;
}; 