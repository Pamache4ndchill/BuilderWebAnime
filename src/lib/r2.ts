import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Endpoint = import.meta.env.VITE_R2_ENDPOINT;
const r2AccessKey = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const r2SecretKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const r2BucketName = import.meta.env.VITE_R2_BUCKET_NAME;
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

const r2Client = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKey || '',
    secretAccessKey: r2SecretKey || '',
  },
});

export const uploadToR2 = async (base64: string, path: string = 'news'): Promise<string> => {
  if (!base64 || !base64.includes('base64,')) return base64; // already a URL or empty

  const [metadata, data] = base64.split(';base64,');
  const contentType = metadata.split(':')[1];
  const binaryData = atob(data);
  const bytes = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }

  const fileName = `${path}/${crypto.randomUUID()}.${contentType.split('/')[1]}`;

  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: fileName,
    Body: bytes,
    ContentType: contentType,
  });

  try {
    await r2Client.send(command);
    return `${r2PublicUrl}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
};
