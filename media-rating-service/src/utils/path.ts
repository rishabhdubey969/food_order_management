// Description: Utility functions for building S3 keys for media files.
export const buildS3Key = (service: string, type: string, id: string, fileName: string) =>
  `media/${service}/${type}/${id}/${fileName}`;
