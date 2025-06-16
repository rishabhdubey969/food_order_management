import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "../config/aws";
import { buildS3Key } from "../utils/path";
import { v4 as uuid } from "uuid";

export const handlers = {
  // GeneratePresignedUrl: async (call: { request: { service: string; resourceType: string; resourceId: string; fileExtension: string; contentType: string; }; }, callback: (arg0: { code: number; message: string; } | null, arg1: { presignedUrl: string; key: string; } | undefined) => void) => {

  //   const { service, resourceType, resourceId, fileExtension, contentType } = call.request;
  //   if (!['user','product','admin'].includes(service)) {
  //     return callback({ code: 7, message: 'Unauthorized service' }, undefined);
  //   }
  //   const fileName = `${uuid()}.${fileExtension}`;
  //   const fileKey = buildS3Key(service, resourceType, resourceId, fileName);

  //   const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: fileKey, ContentType: contentType });
  //   const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  //   callback(null, { presignedUrl: url, key:fileKey });
  // },

  GeneratePresignedUrl: async (
  call: {
    request: {
      service: string;
      resourceType: string;
      resourceId: string;
      files: Array<{ fileExtension: string; contentType: string }>;
    };
  },
  callback: (
    error: { code: number; message: string } | null,
    response?: { urls: Array<{ presignedUrl: string; key: string }> }
  ) => void
) => {
  const { service, resourceType, resourceId, files } = call.request;

  if (!["user", "product", "admin"].includes(service)) {
    return callback({ code: 7, message: "Unauthorized service" }, undefined);
  }

  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const fileName = `${uuid()}.${file.fileExtension}`;
        const fileKey = buildS3Key(service, resourceType, resourceId, fileName);

        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileKey,
          ContentType: file.contentType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 300 });

        return { presignedUrl: url, key: fileKey };
      })
    );

    callback(null, { urls });
  } catch (err) {
    console.error("Error generating presigned URLs:", err);
    callback({ code: 13, message: "Internal Server Error" }, undefined);
  }
},

ConfirmUpload: async (
  call: { request: { key: string; service: string; resourceId: string } },
  callback: (error: null, response: { success: boolean; message: string }) => void
) => {
  const { key } = call.request;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    callback(null, { success: true, message: "Upload confirmed" });
  } catch {
    callback(null, { success: false, message: "File not found" });
  }
},

};
