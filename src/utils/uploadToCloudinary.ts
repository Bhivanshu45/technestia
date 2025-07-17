import cloudinary from "@/lib/cloudinary";

export const uploadToCloudinary = async (
  buffer: Buffer,
  resourceType: "image" | "video" = "image",
  folder: string = process.env.FOLDER_NAME as string
): Promise<{ secureUrl: string; publicId: string }> => {
  if (!buffer) {
    throw new Error("No file buffer provided for Cloudinary upload.");
  }

  try {
    const uploadPromise = new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else if (result)
            resolve(result as { secure_url: string; public_id: string });
        }
      );
      stream.end(buffer);
    });

    const result = await uploadPromise;

    if (!result?.secure_url || !result?.public_id) {
      throw new Error(
        "Cloudinary upload failed: No URL or public_id returned."
      );
    }

    return { secureUrl: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Cloudinary upload failed");
  }
};
