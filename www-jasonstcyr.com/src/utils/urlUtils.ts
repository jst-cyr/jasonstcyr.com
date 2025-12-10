import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/client"; 

const { projectId, dataset } = client.config();

const builder = projectId && dataset 
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export const urlFor = (source: SanityImageSource) =>
  builder ? builder.image(source) : null;
