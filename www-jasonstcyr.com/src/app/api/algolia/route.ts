import { algoliasearch } from "algoliasearch";
import { client } from "@/sanity/client";
import { SanityDocument } from "next-sanity";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.ALGOLIA_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const webhookSecret = process.env.SANITY_WEBHOOK_SECRET!;

const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);

// Function to perform initial indexing
async function performInitialIndexing() {
  console.log("Starting initial indexing...");

  // Fetch all documents from Sanity
  const sanityData = await client.fetch(`*[_type == "post"]{
    _id,
    title,
    slug,
    "body": pt::text(content)[0..2000],
    _type,
    "coverImage": coverImage.asset->url,
    date,
    _createdAt,
    _updatedAt
  }`);

  const records = sanityData.map((doc: SanityDocument) => ({
    objectID: doc._id,
    title: doc.title,
    slug: doc.slug.current,
     /**
     *  Truncating the body if it's too long. 
     *  Another approach: defining multiple records:
     *  https://www.algolia.com/doc/guides/sending-and-managing-data/prepare-your-data/how-to/indexing-long-documents/
     */
    body: doc.body?.slice(0, 9500),
    image: doc.image,
    publishedAt: doc.publishedAt,
    _createdAt: doc._createdAt,
    _updatedAt: doc._updatedAt,
    tags: doc.tags,
    categories: doc.categories,
  }));

  // Save all records to Algolia
  await algoliaClient.saveObjects({
    indexName,
    objects: records,
  });

  console.log("Initial indexing completed.");
  return {
    message: "Successfully completed initial indexing!",
  };
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const initialIndex = searchParams.get("initialIndex") === "true";

    // Perform initial indexing
    if (initialIndex) {
      const response = await performInitialIndexing();
      return Response.json(response);
    }

    // Validate webhook signature
    const signature = request.headers.get(SIGNATURE_HEADER_NAME);
    if (!signature) {
        return Response.json(
        { success: false, message: "Missing signature header" },
        { status: 401 }
        );
    }

    // Get request body for signature validation
    const body = await request.text();
    const isValid = await isValidSignature(body, signature, webhookSecret);

    if (!isValid) {
        return Response.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
        );
    }

    // Incremental updates based on webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
      console.log("Parsed Payload:", JSON.stringify(payload));
    } catch (jsonError) {
      console.warn("No JSON payload provided." + jsonError);
      return Response.json({ error: "No payload provided" }, { status: 400 });
    }

    const { _id, operation, value } = payload;

    if (!operation || !_id || !value) {
      return Response.json(
        { error: "Invalid payload, missing required fields" },
        { status: 400 }
      );
    }

    if (operation === "delete") {
      // Handle delete operation
      await algoliaClient.deleteObject({
        indexName,
        objectID: _id,
      });
      console.log(`Deleted object with ID: ${_id}`);
      return Response.json({
        message: `Successfully deleted object with ID: ${_id}`,
      });
    } else {
      // Add or update the document in Algolia
      await algoliaClient.saveObject({
        indexName,
        body: {
          ...value,
          objectID: _id,
        },
      });

      console.log(`Indexed/Updated object with ID: ${_id}`);
      return Response.json({
        message: `Successfully processed document with ID: ${_id}!`,
      });
    }
  } catch (error) {
    console.error("Error indexing objects:", error instanceof Error ? error.message : String(error));
    return Response.json(
      { error: "Error indexing objects", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}