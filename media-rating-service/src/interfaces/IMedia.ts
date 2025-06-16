// export interface PresignRequest {
//   service: string;
//   resourceType: string;
//   resourceId: string;
//   fileExtension: string;
//   contentType: string;
// }

export interface FileMeta {
  fileExtension: string;
  contentType: string;
}

export interface PresignRequest {
  service: string;
  resourceType: string;
  resourceId: string;
  files: FileMeta[]; // Support multiple files
}


export interface ConfirmRequest {
  key: string;
  service: string;
  resourceId: string;
}
