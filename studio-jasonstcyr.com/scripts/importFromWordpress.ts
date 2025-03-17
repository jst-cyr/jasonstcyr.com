import { createClient } from '@sanity/client';
import axios from 'axios';
import { postType } from '../schemaTypes/postType';

// Sanity client configuration
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!, // You'll need to create this in your Sanity project
  apiVersion: '2024-03-19',
  useCdn: false,
});

// WordPress API endpoint
const WORDPRESS_API_URL = 'https://public-api.wordpress.com/wp/v2/sites/jasonstcyr.com';

interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  date: string;
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  tags: number[];
  categories: number[];
  featured_media: number;
}

interface SanityImage {
  _type: 'image';
  asset: {
    _type: 'reference';
    _ref: string;
  };
}

interface SanityPost {
  _type: 'post';
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  publishedAt: string;
  body: {
    _type: 'block';
    children: {
      _type: 'span';
      text: string;
    }[];
    markDefs: never[];
    style: 'normal';
  }[];
  tags: string[];
  categories: string[];
  image?: SanityImage;
}

async function fetchWordPressPosts() {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}/posts?per_page=100`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    throw error;
  }
}

async function fetchWordPressMedia(mediaId: number) {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}/media/${mediaId}`);
    return response.data.source_url;
  } catch (error) {
    console.error(`Error fetching media ${mediaId}:`, error);
    return null;
  }
}

async function fetchWordPressTags() {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}/tags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress tags:', error);
    throw error;
  }
}

async function fetchWordPressCategories() {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    throw error;
  }
}

async function importPosts() {
  try {
    // Fetch all necessary data
    const [posts, tags, categories] = await Promise.all([
      fetchWordPressPosts(),
      fetchWordPressTags(),
      fetchWordPressCategories(),
    ]);

    // Create a map of WordPress IDs to Sanity document IDs
    const existingPosts = await sanityClient.fetch(`*[_type == "post"]{ "wordpressId": _id }`);
    const existingIds = new Set(existingPosts.map((post: any) => post.wordpressId));

    // Process each post
    for (const post of posts) {
      if (existingIds.has(post.id.toString())) {
        console.log(`Post ${post.id} already exists, skipping...`);
        continue;
      }

      // Fetch featured image if exists
      let imageUrl = null;
      if (post.featured_media) {
        imageUrl = await fetchWordPressMedia(post.featured_media);
      }

      // Get post tags and categories
      const postTags = post.tags
        .map((tagId: number) => tags.find((t: any) => t.id === tagId)?.name)
        .filter(Boolean);

      const postCategories = post.categories
        .map((catId: number) => categories.find((c: any) => c.id === catId)?.name)
        .filter(Boolean);

      // Create the post in Sanity
      const sanityPost: SanityPost = {
        _type: 'post',
        title: post.title.rendered,
        slug: {
          _type: 'slug',
          current: post.slug,
        },
        publishedAt: post.date,
        body: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: post.content.rendered,
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
        tags: postTags,
        categories: postCategories,
      };

      // Add image if exists
      if (imageUrl) {
        sanityPost.image = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageUrl,
          },
        };
      }

      // Create the document in Sanity
      await sanityClient.create(sanityPost);
      console.log(`Imported post: ${post.title.rendered}`);
    }

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importPosts(); 