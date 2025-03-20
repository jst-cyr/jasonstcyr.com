import 'dotenv/config';
import { createClient } from 'next-sanity';
import OpenAI from 'openai';

// Sanity client configuration
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const token = process.env.SANITY_API_TOKEN!;

const sanityClient = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-03-19',
    useCdn: false,
});

// OpenAI client configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to add this to your .env file
});

// Function to extract text content from Sanity portable text blocks
function extractTextFromBlocks(blocks: any[]): string {
    if (!blocks || !Array.isArray(blocks)) return '';
    
    return blocks.map(block => {
        // Handle different block types
        if (block._type === 'block' && block.children) {
            return block.children.map((child: any) => child.text || '').join(' ');
        }
        return '';
    }).join('\n\n');
}

async function suggestTags(title: string, content: string): Promise<string[]> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant that specializes in content analysis and tag generation for blog posts. Your task is to suggest relevant tags for the provided article content. Suggest between 3-7 tags that are concise, relevant, and would be good for SEO and content categorization."
                },
                {
                    role: "user",
                    content: `Please suggest tags for the following article:\n\nTitle: ${title}\n\nContent: ${content}\n\nProvide only the tags in a comma-separated list with no additional text or explanation.`
                }
            ],
            temperature: 0.3, // Lower temperature for more focused responses
            max_tokens: 100,
        });

        // Extract tags from the response
        const tagSuggestion = response.choices[0]?.message.content?.trim() || '';
        // Split by commas and trim whitespace
        return tagSuggestion.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
        console.error('Error getting tag suggestions from OpenAI:', error);
        return [];
    }
}

async function main() {
    try {
        console.log('Starting auto-tagging process...');
        
        // Fetch all posts from Sanity
        const query = `*[_type == "post"] {
            _id,
            title,
            body,
            tags
        }`;
        
        const posts = await sanityClient.fetch(query);
        
        if (!posts || posts.length === 0) {
            console.log('No posts found in the Sanity dataset.');
            return;
        }
        
        for (const post of posts) {
            console.log(`Processing post: "${post.title}"`);
            console.log('Existing tags:', post.tags || 'None');
            
            // Extract text content from portable text blocks
            const textContent = extractTextFromBlocks(post.body);
            
            // Send to OpenAI for tag suggestions
            console.log('Sending to OpenAI for tag suggestions...');
            const suggestedTags = await suggestTags(post.title, textContent);
            
            console.log('\nSuggested tags from OpenAI:');
            console.log(suggestedTags);
            
            // Compare with existing tags
            if (post.tags && Array.isArray(post.tags)) {
                const newTags = suggestedTags.filter(tag => !post.tags.includes(tag));
                
                console.log('\nNew tags that could be added:');
                console.log(newTags.length > 0 ? newTags : 'No new tags to add');
            }
        }
        
        console.log('\nAuto-tagging process completed successfully!');
    } catch (error) {
        console.error('Error in auto-tagging process:', error);
    }
}

// Run the script
main();



