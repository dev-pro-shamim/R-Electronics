import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dugkfcakf",
  api_key: process.env.CLOUDINARY_API_KEY || "345867127966977",
  api_secret: process.env.CLOUDINARY_API_SECRET || "c65ZqS2iJXg8q5n5_jAXJkvJbWI",
  secure: true,
});

export default cloudinary;
