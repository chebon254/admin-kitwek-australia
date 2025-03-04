import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

if (
  !process.env.NEXT_PUBLIC_SPACES_ENDPOINT ||
  !process.env.NEXT_PUBLIC_SPACES_KEY ||
  !process.env.NEXT_PUBLIC_SPACES_SECRET ||
  !process.env.NEXT_PUBLIC_SPACES_BUCKET
) {
  throw new Error("Missing required Digital Ocean configuration");
}

// Create S3 client with improved timeout and retry configuration
const s3Client = new S3Client({
  endpoint: `https://${process.env.NEXT_PUBLIC_SPACES_ENDPOINT}`,
  region: "blr1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_SPACES_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_SPACES_SECRET,
  },
  // Increase timeout to 300 seconds
  requestHandler: {
    timeout: 300000, // 5 minutes timeout
  },
  // Add retry configuration with exponential backoff
  maxAttempts: 1,
});

export const uploadImage = async (
  file: File,
  folder: string
): Promise<string> => {
  try {
    // Set file size limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Add random string to filename to prevent collisions
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}/${Date.now()}-${randomString}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      ""
    )}`;

    console.log(
      `Uploading file: ${fileName}, size: ${file.size} bytes, type: ${file.type}`
    );

    // Try multiple times with increasing delays
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      try {
        console.log(`Upload attempt ${attempt} of ${maxAttempts}`);
        
        const command = new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_SPACES_BUCKET,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          ACL: "public-read",
        });

        await s3Client.send(command);
        console.log(`Successfully uploaded file: ${fileName}`);
        
        // Success - return the URL
        return `https://${process.env.NEXT_PUBLIC_SPACES_BUCKET}.${process.env.NEXT_PUBLIC_SPACES_ENDPOINT}/${fileName}`;
      } catch (error: any) {
        console.error(`S3 upload error on attempt ${attempt}:`, error);
        
        if (attempt >= maxAttempts) {
          if (error.name === "TimeoutError") {
            throw new Error(
              "Upload timed out after multiple attempts. Please check your network connection and Digital Ocean Spaces configuration."
            );
          }
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error("Failed to upload after multiple attempts");
  } catch (error: any) {
    console.error("Upload error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload image"
    );
  }
};