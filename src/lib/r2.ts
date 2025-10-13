
'use server';
import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
    // This check will run on the server, but it's better to have it
    // to ensure credentials are set up. In a real-world scenario,
    // this might be handled during build or deployment checks.
    console.error('Cloudflare R2 credentials are not configured in .env');
    // We don't throw here on the client-side to avoid crashing the app.
    // The functions using R2 will fail gracefully if it's not configured.
}

// The S3Client should only be instantiated on the server.
// The 'use server' directive at the top ensures this whole module
// is server-only.
export const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});
