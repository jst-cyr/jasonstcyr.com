import { SanityDocument } from "next-sanity";

export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

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
  body: any; // Adjust according to your schema
  publishedAt: string;
  image: any; // Adjust according to your schema
}; 