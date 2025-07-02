import fs from 'fs';
import fsPromises from 'fs/promises';

const ensureDirectoryExists = async (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    await fsPromises.mkdir(filePath);
  }
};

export default ensureDirectoryExists;
