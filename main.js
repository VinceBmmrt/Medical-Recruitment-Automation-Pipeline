import { scrapeCVs } from './scrapeCVs.js'
import { uploadToDrive } from './uploadToDrive.js';

(async () => {
  console.log('🚀 Démarrage...');
  
  // 1. Scraper
   const cvsFolder = await scrapeCVs();

  
  // 2. Uploader
  await uploadToDrive(cvsFolder || './cvs');
  
  console.log('✅ Upload terminé !');
})();