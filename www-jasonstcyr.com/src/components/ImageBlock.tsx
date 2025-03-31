import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { urlFor } from "@/utils/urlUtils"; // Import the urlFor function

interface ImageBlockProps {
  value: {
    asset: {
      _ref: string;
    };
    alt: string;
  };
}

const CustomImage: React.FC<ImageBlockProps> = ({ value }) => {
  const imageUrl = urlFor(value.asset)?.url() || ""; // Assuming you have a urlFor function to get the image URL

  return (
    <Image
      src={imageUrl}
      alt={value.alt}
      width={600} // Set appropriate width
      height={400} // Set appropriate height
      className="responsive cover rounded-xl" // Add any additional classes
    />
  );
};

export default CustomImage;
