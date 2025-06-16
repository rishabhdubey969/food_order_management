import { v4 as uuidv4 } from 'uuid';

export const generateFileName = (ext: string) => `${uuidv4()}.${ext}`;
