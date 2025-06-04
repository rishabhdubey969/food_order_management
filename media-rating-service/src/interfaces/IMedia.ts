/**
 * Interface for a file uploaded to S3.
 */
export interface IUploadedFile {
    url: string;
    key: string;
    bucket: string;
    mimetype: string;
    size: number;
}

/**
 * Interface for a file URL with its S3 key.
 */
export interface IFileUrl {
    url: string;
    key: string;
}

/**
 * Interface for the request body when generating a pre-signed upload URL.
 */
export interface IGeneratePresignedUrlBody {
    filename: string;
    filetype: string;
    folder?: string; // Optional folder for organization
}

/**
 * Interface for the request body when deleting an image.
 */
export interface IDeleteImageBody {
    key: string; // S3 object key
}

/**
 * Interface for the request query when listing files.
 */
export interface IListFilesQuery {
    folder?: string; // Optional folder to list from
}

/**
 * Interface for the request query when getting a single file URL.
 */
export interface IGetSingleFileQuery {
    key: string; // S3 object key
}