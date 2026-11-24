import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES = 20;
export const uploadsDir = path.join(config.dataDir, 'uploads');
export const ensureUploads = () => fs.mkdir(uploadsDir, { recursive: true });
