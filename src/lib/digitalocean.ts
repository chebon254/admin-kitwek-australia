import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

if (!process.env.NEXT_PUBLIC_SPACES_ENDPOINT || 
    !process.env.NEXT_PUBLIC_SPACES_KEY || 
    !process.env.NEXT_PUBLIC_SPACES_SECRET || 
    !process.env.NEXT_PUBLIC_SPACES_BUCKET) {
  throw new Error('Missing required Digital Ocean configuration');
}

const s3Client = new S3Client({
  endpoint: `https://${process.env.NEXT_PUBLIC_SPACES_ENDPOINT}`,
  region: "blr1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_SPACES_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_SPACES_SECRET
  }
});

export const uploadImage = async (file: File, folder: string): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_SPACES_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read'
    });

    await s3Client.send(command);

    return `https://${process.env.NEXT_PUBLIC_SPACES_BUCKET}.${process.env.NEXT_PUBLIC_SPACES_ENDPOINT}/${fileName}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
};