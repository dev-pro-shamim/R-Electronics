import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function inferExtension(file: File | Blob): string {
  const name = (file as File).name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
    return ext;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function isAllowedImage(file: File | Blob): boolean {
  if (file.type && ALLOWED_TYPES.has(file.type.toLowerCase())) return true;
  const name = ((file as File).name || "").toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

async function persistSingleFile(file: File | Blob, folder: string) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "") || "rango-electronics";
  const ext = inferExtension(file);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error("Empty image file.");
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Image exceeds 10MB size limit.");
  }

  const mime =
    file.type && ALLOWED_TYPES.has(file.type.toLowerCase())
      ? file.type
      : ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : "image/jpeg";

  if (
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    try {
      const base64 = `data:${mime};base64,${buffer.toString("base64")}`;
      const uploaded = await cloudinary.uploader.upload(base64, {
        folder: safeFolder,
        resource_type: "image",
      });
      return {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        name: (file as File).name || `image.${ext}`,
        storage: "cloudinary",
      };
    } catch (cloudErr) {
      console.warn("Cloudinary upload fallback to local disk:", cloudErr);
    }
  }

  // Deterministic local fallback inside public/uploads/
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
  const fullPath = path.join(uploadDir, filename);
  fs.writeFileSync(fullPath, buffer);

  return {
    url: `/uploads/${safeFolder}/${filename}`,
    publicId: `${safeFolder}/${filename}`,
    name: (file as File).name || filename,
    storage: "local",
  };
}

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const folder = String(formData.get("folder") || "rango-electronics");
    const single = formData.get("file");
    const multi = formData.getAll("files");

    const candidates: Blob[] = [];
    if (single && single instanceof Blob) candidates.push(single);
    for (const item of multi) {
      if (item instanceof Blob) candidates.push(item);
    }

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    for (const file of candidates) {
      if (!isAllowedImage(file)) {
        return NextResponse.json(
          { error: "Unsupported format. Allowed formats: JPG, JPEG, PNG, WebP." },
          { status: 400 }
        );
      }
    }

    const uploaded = [];
    for (const file of candidates) {
      const saved = await persistSingleFile(file, folder);
      uploaded.push(saved);
    }

    return NextResponse.json({
      url: uploaded[0].url,
      publicId: uploaded[0].publicId,
      urls: uploaded.map((u) => u.url),
      uploaded,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image upload failed." },
      { status: 500 }
    );
  }
}
