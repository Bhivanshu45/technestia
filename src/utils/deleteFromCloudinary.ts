import cloudinary from "@/lib/cloudinary";

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<boolean> => {
  if (!publicId) {
    throw new Error("No publicId provided for Cloudinary deletion.");
  }
  try {
    const { result: deletionResult } = await cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType }
    );

    if (deletionResult !== "ok" && deletionResult !== "not found") {
      throw new Error(`Cloudinary deletion failed: ${deletionResult}`);
    }

    return true;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
    throw new Error("Cloudinary deletion failed");
  }
};