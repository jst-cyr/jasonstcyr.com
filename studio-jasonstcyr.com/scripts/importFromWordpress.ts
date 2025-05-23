import 'dotenv/config';
import { createClient } from 'next-sanity';
import axios from 'axios';
import { htmlToBlocks } from '@portabletext/block-tools';
import { PortableTextBlock } from '@portabletext/types';
import { Block } from 'typescript';
import { ArraySchemaType } from 'sanity';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';

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
  alt: string;
}

interface SanityPost {
  _type: 'post';
  wordpressId: string;
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  publishedAt: string;
  body: PortableTextBlock[];
  tags: string[];
  categories: string[];
  seriesTag?: string;
  image?: SanityImage;
}

async function fetchWordPressPosts() {
  try {
    console.log('Fetching WordPress posts...');
    const response = await axios.get(`${WORDPRESS_API_URL}/posts?per_page=15`);
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
    let allTags: any[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100; // Maximum allowed by WordPress API

    while (hasMore) {
      const response = await axios.get(`${WORDPRESS_API_URL}/tags?per_page=${perPage}&page=${page}`);
      const tags = response.data;
      
      if (tags.length === 0) {
        hasMore = false;
      } else {
        allTags = [...allTags, ...tags];
        page++;
      }
    }

    console.log(`Found ${allTags.length} total tags`);
    return allTags;
  } catch (error) {
    console.error('Error fetching WordPress tags:', error);
    throw error;
  }
}

async function fetchWordPressCategories() {
  try {
    console.log('Fetching WordPress categories...');
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100; // Maximum allowed by WordPress API

    while (hasMore) {
      const response = await axios.get(`${WORDPRESS_API_URL}/categories?per_page=${perPage}&page=${page}`);
      const categories = response.data;
      
      if (categories.length === 0) {
        hasMore = false;
      } else {
        allCategories = [...allCategories, ...categories];
        page++;
      }
    }

    console.log(`Found ${allCategories.length} total categories`);
    return allCategories;
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

async function uploadImageToSanity(imageUrl: string, altText: string): Promise<SanityImage | null> {
  try {
    // Download the image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    
    // Upload to Sanity
    const asset = await sanityClient.assets.upload('image', imageBuffer);
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
      alt: altText
    };
  } catch (error) {
    console.error('Error uploading image to Sanity:', error);
    return null;
  }
}

// Add a helper function to clean HTML entities
function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'") // Handle the right single quotation mark
    .replace(/&#8211;/g, '–'); // Handle the em dash
}

function deserializeCodeBlock(el: any, next: any, block: any) {
  if (!el || !el.tagName || el.tagName.toLowerCase() !== 'pre') {
    return undefined;
  }

  // Extract the language from the class attribute
  const classList = el.className.split(';');
  const languageClass = classList.find((cls: string) => cls.trim().startsWith('brush:'));
  let language = languageClass ? languageClass.split(':')[1].trim() : 'text'; // Default to 'text' if not found

  // Handle the special case where the language is 'jcript'
  if (language === 'jscript') {
    language = 'javascript';
  }

  // Extract highlighted lines from the class attribute
  const highlightClass = classList.find((cls: string) => cls.trim().startsWith('highlight:'));
  const highlightedLines: number[] = highlightClass 
    ? highlightClass.split(':')[1].trim().split(',')
        .map((line: string) => Number(line.trim())) // Convert to numbers
        .filter((line: number) => Number.isFinite(line)) // Filter out invalid numbers
    : []; // Convert to array of numbers

  const code = el.children[0];
  let text = '';
  if (code) {
    const childNodes = code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes;
    childNodes.forEach((node: any) => {
      text += node.textContent || '';
    });
  } else {
    text = el.textContent || '';
  }

  if (!text) {  
    return undefined;
  }

  return block({
    children: [],
    _type: 'code',
    code: text,
    language: language,
    highlightedLines: highlightedLines,
  });
}

function deserializeImage(el: any, next: any, block: any) {
  if (!el || !el.tagName || el.tagName.toLowerCase() !== 'img') {
    return undefined;
  }

  // Get the image source
  const imageSrc = el.getAttribute('data-orig-file') || el.getAttribute('src');
  const altText = el.getAttribute('alt') || '';

  if (!imageSrc) {
    return undefined; // Return undefined if no source is found
  }

  // Return the block in the correct schema for a Sanity image
  return block({
    _type: 'image', // Ensure the type is set to 'image'
    asset: {
      _type: 'reference', // Set the asset type to reference
      _ref: imageSrc, // Use the image source as a reference (this should be updated later when uploaded)
    },
    alt: altText, // Set the alt text
  });
}

// Build a DOM parser with all the rules to be used in the htmlToBlocks function
function buildDOMParser(): { parseHtml: (html: string) => Document } {
  const domParser = { 
    parseHtml: (html: string) => new JSDOM(html).window.document,
    rules: [
      {
        deserialize: deserializeCodeBlock
      },
      {
        deserialize: deserializeImage
      }
    ] 
  };
  return domParser;
}

// Type guard to check if a block is an image block
function isImageBlock(block: PortableTextBlock): block is PortableTextBlock & { _type: 'image'; asset: { _type: 'reference'; _ref: string }; alt: string } {
  return block._type === 'image' && 
         (block as any).asset && // Use 'as any' to bypass TypeScript checks for this property
         (block as any).asset._type === 'reference' && 
         typeof (block as any).asset._ref === 'string' && 
         typeof (block as any).alt === 'string';
}

async function parseBody(body: string): Promise<PortableTextBlock[]> {
  // Remove any related articles carousels before continuing
  const tempDom = new JSDOM(body);
  const document = tempDom.window.document;

  // Find and remove the carousel
  const carousels = document.getElementsByClassName('wp-block-newspack-blocks-carousel');
  for (const carousel of Array.from(carousels)) {
    // Find the parent wp-block-group that contains this carousel
    let parent = carousel.parentElement;
    while (parent && !parent.classList.contains('wp-block-group')) {
      parent = parent.parentElement;
    }
    // Remove the entire group if found, otherwise just remove the carousel
    if (parent) {
      console.log("Removing parent: ", parent);
      parent.remove();
    } else {
      console.log("Removing carousel: ", carousel);
      carousel.remove();
    }
  }

  const cleanedBody = document.body.innerHTML;

  const postSchema = Schema.compile({
    name: 'myBlogPost',
    types: [{
      type: 'object',
      name: 'post',
      fields: [
        {
          name: 'body',
          type: 'array',
          of: [{ type: 'block' }],
        },
      ],
    }],
  });

  const blockContentType = postSchema.get('post').fields.find((field: any) => field.name === 'body')?.type as ArraySchemaType<Block>;
  if (!blockContentType) {
    throw new Error('Block content type not found');
  }

  const domParser = buildDOMParser();
  const blocks = htmlToBlocks(cleanedBody, blockContentType, domParser) as PortableTextBlock[];

  // Process each block and upload images if necessary
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (isImageBlock(block)) { // Use the type guard
      console.log("Found an image to upload: ", block);
      const uploadedImage = await uploadImageToSanity(block.asset._ref, block.alt);
      if (uploadedImage) {
        console.log("Uploaded image: ", uploadedImage.asset._ref);
        // Update the block to reference the uploaded image
        block.asset = uploadedImage.asset;
      }
    }
  }

  return blocks; // Return the updated blocks
}

// Extract the series tag from the post information
function extractSeriesTag(post: SanityPost): string | null {
  if (post.title.includes("Choose your Next.js host")) {
    post.tags.push("Choose Your Next.js Host");
    return "Choose Your Next.js Host";
  }
  else if (post.title.includes("Dark Invasion of Lani")) {
    return "Dark Invasion of Lani";
  }
  else if (post.title.includes("Corruption of Lani")) {
    return "Corruption of Lani";
  }
  else if (post.title.includes("Thora Silentblade")) {
    return "Thora";
  }
  
  return null;
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
    const existingPosts = await sanityClient.fetch(`*[_type == "post"]{ "wordpressId": wordpressId }`);
    const existingIds = new Set(existingPosts.map((post: any) => post.wordpressId));

    console.log('\nProcessing posts...');
    console.log('===================');

    // Process each post
    for (const post of posts) {
      if (existingIds.has(post.id.toString())) {
       console.log(`Post ${post.id} already exists, skipping...`);
       continue;
      }

      console.log(`\nProcessing post: ${post.title.rendered}`);
      console.log(`ID: ${post.id}`);
      
    
      // Clean the title before using it
      const cleanTitle = cleanHtmlEntities(post.title.rendered);

     // Get post tags and categories
      const postTags = post.tags
        .map((tagId: number) => {
          const tag = tags.find((t: any) => t.id === tagId);
          return tag ? cleanHtmlEntities(tag.name) : null;
        })
        .filter(Boolean);

      const postCategories = post.categories
        .map((catId: number) => {
          const category = categories.find((c: any) => c.id === catId);
          return category ? cleanHtmlEntities(category.name) : null;
        })
        .filter(Boolean);

      console.log('Tags:', postTags);
      console.log('Categories:', postCategories);

      // Parse the body
      const blocks = await parseBody(post.content.rendered);

      // Handle featured image
      let image: SanityImage | undefined;
      if (post.jetpack_featured_media_url) {
        console.log(`Processing featured image: ${post.jetpack_featured_media_url}`);
        const uploadedImage = await uploadImageToSanity(post.jetpack_featured_media_url, post.excerpt);
        if (uploadedImage) {
          image = uploadedImage;
        }
      }

      // Create the post in Sanity
      const sanityPost: SanityPost = {
        _type: 'post',
        wordpressId: post.id.toString(),
        title: cleanTitle,
        slug: {
          _type: 'slug',
          current: extractFullSlugFromLink(post.link),
        },
        publishedAt: post.date,
        body: blocks,
        tags: postTags,
        categories: postCategories,
        image, // Use the uploaded image reference
      };

      const seriesTag = extractSeriesTag(sanityPost);
      if (seriesTag) {
        sanityPost.seriesTag = seriesTag;
      }

      // Create the document in Sanity
      //console.log("SKIPPING CREATION FOR NOW"); // Uncommen if the sanityClient line is commented out for testing.
      await sanityClient.create(sanityPost);
      
      // Log the prepared Sanity post data
      console.log('\nPrepared Sanity post data:');
      console.log(sanityPost.title);
      console.log(sanityPost.slug);
      console.log(sanityPost.publishedAt);
      console.log(sanityPost.tags);
      console.log(sanityPost.categories);
      console.log(sanityPost.image);
      console.log(sanityPost.wordpressId);
      console.log(sanityPost.seriesTag);
      console.log('===================');
    }

    console.log('\nImport test completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importPosts();