import 'dotenv/config';
import { createClient } from 'next-sanity';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Gemini client configuration
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// New function to check applicable tags using OpenAI
async function checkApplicableTags_OpenAI(title: string, content: string, targetTags: string[]): Promise<string[]> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant that specializes in content analysis. Your task is to determine which of the specified tags are applicable to the provided article content."
                },
                {
                    role: "user",
                    content: `Given the following article:\n\nTitle: ${title}\n\nContent: ${content}\n\nPlease analyze the content and determine which of the following tags are applicable: ${targetTags.join(', ')}. Provide only the applicable tags in a comma-separated list with no additional text or explanation.`
                }
            ],
            temperature: 0.3,
            max_tokens: 100,
        });

        // Extract applicable tags from the response
        const applicableTags = response.choices[0]?.message.content?.trim() || '';
        return applicableTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
        console.error('Error checking applicable tags from OpenAI:', error);
        return [];
    }
}

// New function to check applicable tags using Gemini
async function checkApplicableTags_Gemini(title: string, content: string, targetTags: string[]): Promise<string[]> {
    try {
        const model = gemini.getGenerativeModel({
            model:"gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100,
            },
            systemInstruction: "You are a helpful AI assistant that specializes in content analysis. Your task is to determine which of the specified tags are applicable to the provided article content."
        } );

        const prompt = `Given the following article:\n\nTitle: ${title}\n\nContent: ${content}\n\nPlease analyze the content and determine which of the following tags are applicable: ${targetTags.join(', ')}. Provide only the applicable tags in a comma-separated list with no additional text or explanation.`;
        const result = await model.generateContent(prompt);

        // Extract applicable tags from the response
        const applicableTags = result.response.text() || '';

        return applicableTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
        console.error('Error checking applicable tags from Gemini:', error);
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
        
        // Define the set of tags to check
        const selectedTags = ["fiction", "fantasy", "developer", "tutorial", "video", "event"];
        
        for (const post of posts) {
            console.log(`Processing post: "${post.title}"`);
            console.log('Existing tags:', post.tags || 'None');
            
            // Extract text content from portable text blocks
            const textContent = extractTextFromBlocks(post.body);
            console.log('Text content:', textContent);
            
            // Determine which LLM to use (OpenAI or Gemini)
            const llm = "gemini"; // Change this to "gemini" to use the Gemini API
            
            let applicableTags: string[];
            if (llm === "openai") {
                console.log('Sending to OpenAI for applicable tag suggestions...');
                applicableTags = await checkApplicableTags_OpenAI(post.title, textContent, selectedTags);
            } else if(llm === "gemini") {
                console.log('Sending to Gemini for applicable tag suggestions...');
                applicableTags = await checkApplicableTags_Gemini(post.title, textContent, selectedTags);
            }
            else {
                console.log('No LLM selected. Skipping applicable tag suggestions.');
                applicableTags = [];
            }
            
            console.log(`\nApplicable tags for "${post.title}":`, applicableTags.length > 0 ? applicableTags : 'None');
        }
        
        console.log('\nAuto-tagging process completed successfully!');
    } catch (error) {
        console.error('Error in auto-tagging process:', error);
    }
}

// Run the script
main();



