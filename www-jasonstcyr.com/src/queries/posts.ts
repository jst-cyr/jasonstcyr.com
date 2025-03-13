import groq from 'groq';
import {defineQuery} from 'next-sanity';
import { SanityDocument } from "next-sanity";

export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

export type Post = SanityDocument & {
  title: string;
  body: any; // Adjust according to your schema
  publishedAt: string;
  image: any; // Adjust according to your schema
}; 