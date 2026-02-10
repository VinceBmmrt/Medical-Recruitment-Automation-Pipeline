// uploadDrive_complete.js
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';

export async function uploadToDrive(cvsFolder) {

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = './token.json';
const CVS_FOLDER = './cvs';



async function main() {
  try {
    console.log('📤 Google Drive Upload\n');
    
    // 1. Charger credentials
    const content = fs.readFileSync('./credentials.json', 'utf8');
    const credentials = JSON.parse(content);
    
    // 2. Configurer OAuth
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const redirectUri = 'http://localhost:3000/callback';
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    );
    
    // 3. Vérifier token existant
    if (!fs.existsSync(TOKEN_PATH)) {
      console.log('❌ Token non trouvé, authentification nécessaire...');
      await authenticate(oAuth2Client);
    }
    
    // Charger token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    
    // 4. Créer instance Drive
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    
    console.log('✅ Authentifié sur Google Drive\n');
    
    // 5. Créer dossier dans Drive
    console.log('📁 Création du dossier...');
    const parentFolderId = '1VtKpeeKf9pP1BB6hHNtIJeIZjKwvWaA0'; // Ridma
    const folderName = `CVs_AideSoignantes_${new Date().toISOString().split('T')[0]}`;
    const folderId = await createFolder(drive, folderName, parentFolderId);
    console.log(`✅ Dossier créé: "${folderName}"\n`);
    
    // 6. Lister tous les fichiers CV
    if (!fs.existsSync(CVS_FOLDER)) {
      console.log('❌ Dossier "cvs" non trouvé');
      return;
    }
    
    const files = fs.readdirSync(CVS_FOLDER)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file,
        path: path.join(CVS_FOLDER, file)
      }));
    
    console.log(`📄 ${files.length} fichiers PDF trouvés\n`);
    
    if (files.length === 0) {
      console.log('❌ Aucun fichier PDF à uploader');
      return;
    }
    
    // 7. Uploader chaque fichier
    let successCount = 0;
    for (const file of files) {
      try {
        console.log(`⬆️  Upload: ${file.name}`);
        
        const fileId = await uploadFile(drive, file, folderId);
        
        if (fileId) {
          successCount++;
          console.log(`   ✅ Succès (ID: ${fileId})`);
        }
        
        // Petite pause pour éviter les rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }
      // 🔹 Vider le dossier local cvs après upload
try {
  const filesInFolder = fs.readdirSync(CVS_FOLDER);
  for (const file of filesInFolder) {
    const filePath = path.join(CVS_FOLDER, file);
    fs.unlinkSync(filePath); // supprime le fichier
  }
  console.log(`🗑️ Dossier ${CVS_FOLDER} vidé`);
} catch (err) {
  console.log(`⚠️ Erreur lors de la suppression des fichiers locaux : ${err.message}`);
}
    
    // 8. Résuméf
    console.log('\n' + '='.repeat(40));
    console.log(`🎉 UPLOAD TERMINÉ !`);
    console.log(`📊 ${successCount}/${files.length} fichiers uploadés`);
    console.log(`📁 Dossier: ${folderName}`);
    console.log(`🔗 Lien: https://drive.google.com/drive/folders/${folderId}`);
    
  } catch (error) {
    console.error('❌ ERREUR PRINCIPALE:', error.message);
  }

}

// Fonctions auxiliaires
async function authenticate(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    
    console.log('\n👉 Ouvre ce lien dans Chrome :');
    console.log(authUrl);
    console.log('\n🔄 En attente de l\'autorisation...\n');
    
    const server = http.createServer(async (req, res) => {
      const query = url.parse(req.url, true).query;
      
      if (query.code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body>
            <h1>✅ Authentification réussie !</h1>
            <p>Tu peux fermer cette fenêtre.</p>
          </body></html>
        `);
        
        server.close();
        
        try {
          const { tokens } = await oAuth2Client.getToken(query.code);
          oAuth2Client.setCredentials(tokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('✅ Token sauvegardé');
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    });
    
    server.listen(3000, () => {
      console.log('Serveur en attente sur http://localhost:3000');
    });
    
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout après 2 minutes'));
    }, 120000);
  });
}

async function createFolder(drive, folderName, parentFolderId) {
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  
  return response.data.id;
}

async function uploadFile(drive, file, folderId) {
  const fileMetadata = {
    name: file.name,
    parents: [folderId],
  };
  
  const media = {
    mimeType: 'application/pdf',
    body: fs.createReadStream(file.path),
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  
  return response.data.id;
}

// Lancer le script
main();}