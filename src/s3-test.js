import {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    HeadBucketCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";

// Run as: node --env-file=.env src/s3-test.js

const s3Client = new S3Client({
    region: process.env.S3Region,
    endpoint: process.env.S3Endpoint,
    credentials: {
        accessKeyId: process.env.S3AccessKeyId,
        secretAccessKey: process.env.S3SecretAccessKey,
    },
    forcePathStyle: true,
});

const bucketName = "test-bucket";

try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
} catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    } else {
        throw error;
    }
}

await s3Client.send(
    new PutObjectCommand({
        Bucket: bucketName,
        Key: "my-first-object.txt",
        Body: "Hello JavaScript SDK!",
    }),
);

const { Body } = await s3Client.send(
    new GetObjectCommand({
        Bucket: bucketName,
        Key: "my-first-object.txt",
    }),
);

console.log(await Body.transformToString());