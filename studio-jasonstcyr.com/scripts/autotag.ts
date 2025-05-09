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
const model20lite = "gemini-2.0-flash-lite";
const model20flash = "gemini-2.0-flash";
const model15pro = "gemini-1.5-pro";
const model15flash = "gemini-1.5-flash";
const modelUnavailable = "model-unavailable";
let selectedModel = model20lite;

function getNextModelId(model: string): string {
    switch (model) {
        case model20lite:
            return model20flash;
        case model20flash:
            return model15flash;
        case model15flash:
            return model15pro;
        default:
            return modelUnavailable;
    }
}

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
                    content: "You are a helpful AI assistant that specializes in content analysis. Your task is to determine which of the specified tags are applicable to the provided article content. If none are applicable, return an empty array. Do not force tags that are not applicable."
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
async function checkApplicableTags_Gemini(title: string | null, content: string | null, targetTags: string[], modelId: string): Promise<string[]> {
    if (modelId === modelUnavailable) {
        console.error('No more models available. Cannot tag product.');
        throw new Error('No more models available');
    }

    try {
        const model = gemini.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100,
            },
            systemInstruction: "You are a helpful AI assistant that specializes in content analysis. Your task is to determine which of the specified tags are applicable to the provided article content. If none are applicable, return an empty array. Do not force tags that are not applicable."
        });

        // Use a default value for title if it is null
        const safeTitle = title || "Untitled Article"; // Default value

        const prompt = `Given the following article:\n\nTitle: ${safeTitle}\n\nContent: ${content}\n\nPlease analyze the content and determine which of the following tags are applicable: ${targetTags.join(', ')}. Provide only the applicable tags in a comma-separated list with no additional text or explanation.`;
        const result = await model.generateContent(prompt);

        // Extract applicable tags from the response
        const applicableTags = result.response.text() || '';

        return applicableTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
        // If we're above the daily quota for this model, try another model
        if (error instanceof Error && error.message.includes('GenerateRequestsPerDayPerProjectPerModel-FreeTier')) {
            const nextModelId = getNextModelId(modelId);
            selectedModel = nextModelId;
            console.log(`Quota exceeded for model ${modelId}. Switching to model ${nextModelId}...`);
            return await checkApplicableTags_Gemini(title, content, targetTags, nextModelId);
        }
        // If we're going above the rate limit for this model, sleep for 2 seconds and try again
        if (error instanceof Error && error.message.includes('GenerateRequestsPerMinutePerProjectPerModel-FreeTier')) {
            console.log('Rate limit exceeded for current model. Sleeping for 2 seconds and trying again...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await checkApplicableTags_Gemini(title, content, targetTags, modelId);
        }
        // If the model is unavailable, try another model
        if (error instanceof Error && error.message.includes('404')) {
            const nextModelId = getNextModelId(modelId);
            selectedModel = nextModelId;
            console.log(`Model ${modelId} is unavailable. Switching to model ${nextModelId}...`);
            return await checkApplicableTags_Gemini(title, content, targetTags, nextModelId);
        }


        console.error('Error checking applicable tags from Gemini:', error);
        return [];
    }
}

// Update the main function to accept an llm parameter
async function main(llm: 'openai' | 'gemini') {
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

            let applicableTags: string[];
            if (llm === "openai") {
                console.log('Sending to OpenAI for applicable tag suggestions...');
                applicableTags = await checkApplicableTags_OpenAI(post.title, textContent, selectedTags);
            } else if (llm === "gemini") {
                console.log('Sending to Gemini for applicable tag suggestions...');
                applicableTags = await checkApplicableTags_Gemini(post.title, textContent, selectedTags, selectedModel);

                // Sleep this function for 2 seconds before another request to try to avoid quota issues with the free Gemini tier
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log('No LLM selected. Skipping applicable tag suggestions.');
                applicableTags = [];
            }

            // Combine existing tags with new applicable tags, ensuring uniqueness
            const updatedTags = Array.from(new Set([...post.tags || [], ...applicableTags]));

            // Save the updated tags back to the Sanity document
            if (updatedTags.length > 0) {
                console.log(`Saving updated tags for "${post.title}" to Sanity...`);
                await sanityClient.patch(post._id) // Document ID
                    .set({ tags: updatedTags }) // Update the tags field
                    .commit() // Commit the changes
                    .then(() => {
                        console.log(`Successfully updated tags for "${post.title}".`);
                    })
                    .catch((error) => {
                        console.error(`Error updating tags for "${post.title}":`, error);
                    });
            }

            console.log(`\nApplicable tags for "${post.title}":`, applicableTags.length > 0 ? applicableTags : 'None');
        }

        console.log('\nAuto-tagging process completed successfully!');
    } catch (error) {
        if (error instanceof Error && error.message === 'No more models available') {
            console.log('Stopping processing due to model unavailability.');
            return; // Stop processing further products
        }
        console.error('Error in auto-tagging process:', error);
    }
}

// Run the script with the desired LLM
const llm = "gemini"; // Change this to "openai" to use the OpenAI API
main(llm);



