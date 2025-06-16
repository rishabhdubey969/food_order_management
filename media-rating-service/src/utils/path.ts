export const buildS3Key = (service: string, type: string, id: string, fileName: string) =>
  `media/${service}/${type}/${id}/${fileName}`;
