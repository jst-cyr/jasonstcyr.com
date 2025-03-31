import Image from "next/image";
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
      width={600} 
      height={400}
      className="responsive cover rounded-xl"
    />
  );
};

export default CustomImage;
