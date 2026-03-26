import { Client } from 'minio';

const s3 = new Client({
  endPoint: '108.181.166.127',
  port: 9000,
  useSSL: false,
  accessKey: 'minio',
  secretKey: 'minio123'
});

const BUCKET = 'yalotengo';

async function test() {
  try {
    console.log("Checking if bucket exists...");
    const exists = await s3.bucketExists(BUCKET);
    console.log("Exists?", exists);
    
    if (!exists) {
      console.log("Attempting to create bucket...");
      await s3.makeBucket(BUCKET, 'us-east-1');
      console.log("Bucket created successfully.");
      
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Principal: "*",
            Resource: [`arn:aws:s3:::${BUCKET}/*`]
          }
        ]
      };
      await s3.setBucketPolicy(BUCKET, JSON.stringify(policy));
      console.log("Policy applied successfully.");
    }
  } catch (err) {
    console.error("MINIO ERROR:", err);
  }
}

test();
