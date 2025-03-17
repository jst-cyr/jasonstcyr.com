import { createClient } from 'next-sanity';
import axios from 'axios';
// import { postType } from '../schemaTypes/postType';  // Commenting out since we don't need it for testing

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset =  process.env.NEXT_PUBLIC_SANITY_DATASET!;
const token = process.env.SANITY_API_TOKEN!;

// Sanity client configuration
const sanityClient = createClient({
  projectId,
  dataset,
  token,
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
  link: string;
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
  jetpack_featured_media_url: string;
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
    console.log('Fetching WordPress posts...');
    const response = await axios.get(`${WORDPRESS_API_URL}/posts?per_page=1`);
    console.log(`Found ${response.data.length} posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    throw error;
  }
}

async function fetchWordPressTags() {
  try {
    console.log('Fetching WordPress tags...');
    const response = await axios.get(`${WORDPRESS_API_URL}/tags`);
    console.log(`Found ${response.data.length} tags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress tags:', error);
    throw error;
  }
}

async function fetchWordPressCategories() {
  try {
    console.log('Fetching WordPress categories...');
    const response = await axios.get(`${WORDPRESS_API_URL}/categories`);
    console.log(`Found ${response.data.length} categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    throw error;
  }
}

// Add a helper function to extract the full path from the WordPress link
function extractFullSlugFromLink(link: string): string {
  try {
    const url = new URL(link);
    // Remove leading and trailing slashes and return the path
    return url.pathname.replace(/^\/|\/$/g, '');
  } catch (error) {
    console.error('Error parsing URL:', error);
    return '';
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
    // const existingPosts = await sanityClient.fetch(`*[_type == "post"]{ "wordpressId": _id }`);
    // const existingIds = new Set(existingPosts.map((post: any) => post.wordpressId));

    console.log('\nProcessing posts...');
    console.log('===================');

    // Process each post
    for (const post of posts) {
      // if (existingIds.has(post.id.toString())) {
      //   console.log(`Post ${post.id} already exists, skipping...`);
      //   continue;
      // }
      //console.log(post);
      //return;

      console.log(`\nProcessing post: ${post.title.rendered}`);
      console.log(`ID: ${post.id}`);
      console.log(`Slug: ${post.slug}`);
      console.log(`Date: ${post.date}`);
      console.log(`Tags: ${post.tags.length}`);
      console.log(`Categories: ${post.categories.length}`);

      // Use jetpack_featured_media_url directly
      let imageUrl = post.jetpack_featured_media_url || null;
      if (imageUrl) {
        console.log(`Featured image URL: ${imageUrl}`);
      }

      // Get post tags and categories
      const postTags = post.tags
        .map((tagId: number) => tags.find((t: any) => t.id === tagId)?.name)
        .filter(Boolean);

      const postCategories = post.categories
        .map((catId: number) => categories.find((c: any) => c.id === catId)?.name)
        .filter(Boolean);

      console.log('Tags:', postTags);
      console.log('Categories:', postCategories);

      // Create the post in Sanity
      const sanityPost: SanityPost = {
        _type: 'post',
        title: post.title.rendered,
        slug: {
          _type: 'slug',
          current: extractFullSlugFromLink(post.link),
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
      // await sanityClient.create(sanityPost);
      
      // Log the prepared Sanity post data
      console.log('\nPrepared Sanity post data:');
      console.log(sanityPost.title);
      console.log(sanityPost.slug);
      console.log(sanityPost.publishedAt);
      console.log(sanityPost.tags);
      console.log(sanityPost.categories);
      console.log(sanityPost.image);
      console.log('===================');
    }

    console.log('\nImport test completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importPosts();