import { chromium } from 'playwright';
import 'dotenv/config';
import fs from 'fs';

export async function scrapeCVs() {
  const { STAFF_EMAIL: email, STAFF_PASSWORD: password } = process.env;

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Créer le dossier cvs s'il n'existe pas
  const cvsFolder = './cvs';
  if (!fs.existsSync(cvsFolder)) fs.mkdirSync(cvsFolder);

  // 1. Connexion
  await page.goto('https://clients.agencestaff.fr/');
  await page.fill('#publisher_email', email);
  await page.fill('#publisher_password', password);
  await page.click('input[name="commit"]');

  await page.waitForSelector('a.link_card_nav_recruiter');
  console.log('✅ Connecté');

  // 2. Cliquer sur le lien recruiter
  await page.click('a.link_card_nav_recruiter');
  await page.waitForTimeout(1000);

  // 3. Base de CV
  await page.click('li#profiles > a');
  await page.waitForTimeout(1000);

  // 4. Consulter base cv
  await page.click('a.btn_style[href*="/profiles"]');
  await page.waitForTimeout(100);

  // 5. Recherche aide soignant
  const inputJob = page.locator('#token-input-');
  await inputJob.type('Aide soignant', { delay: 100 });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');

  // 6. Recherche île de france
  const inputLocation = page.locator('input[data-autocomplete-url*="/locations/autocomplete"]');
  await inputLocation.type('Île-de-France', { delay: 100 });
  await page.waitForTimeout(500);
  await page.click('.ui-autocomplete li:first-child');
  await page.waitForTimeout(500);

  // 7. Filtre date 12 mois et rechercher
  await page.selectOption('#last_update', { label: '12 mois' });
  await page.click('input.submit_button[value="Rechercher"]');
  await page.waitForTimeout(2000);

  console.log('🔍 Recherche lancée, début du scraping...');

  // BOUCLE SUR TOUTES LES PAGES (max 9)
  let pageNum = 1;
  const maxPages = 9;

  while (pageNum <= maxPages) {
    console.log(`\n====== PAGE ${pageNum} ======`);

    const voirCvButtons = await page.locator('a:has-text("Voir le CV")').all();
    console.log(`📄 ${voirCvButtons.length} CVs sur cette page`);

    if (voirCvButtons.length === 0) {
      console.log('❌ Aucun CV trouvé, arrêt.');
      break;
    }

    for (let i = 0; i < voirCvButtons.length; i++) {
      console.log(`📥 CV ${i + 1}/${voirCvButtons.length}`);

      try {
        const buttons = await page.locator('a:has-text("Voir le CV")').all();
        await buttons[i].click();
        await page.waitForTimeout(300);

        // Récupérer le nom
        let nom = `cv_p${pageNum}_${i + 1}`;
        const nomElement = page.locator('#profile_title');
        if (await nomElement.count() > 0) {
          nom = (await nomElement.textContent()).trim();
          console.log(`👤 Nom: ${nom}`);
        }

        // Nettoyer le nom pour le fichier
        const nomFichier = nom
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/__+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 100) + `_p${pageNum}.pdf`;

        // Télécharger le PDF
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.click('a.download[href*=".pdf"]')
        ]);

        await download.saveAs(`${cvsFolder}/${nomFichier}`);
        console.log(`✅ ${nomFichier}`);
      } catch (error) {
        console.log(`❌ Erreur CV ${i + 1}:`, error.message);
        await page.screenshot({ path: `${cvsFolder}/erreur_p${pageNum}_cv${i + 1}.png` });
      }

      // Retour à la liste
      await page.goBack();
      await page.waitForTimeout(300);
    }

    // Page suivante
    if (pageNum < maxPages) {
      const nextPageBtn = page.locator('a.next_page:has-text("Suivante")');
      if (await nextPageBtn.count() > 0) {
        console.log(`\n➡️ Aller à la page ${pageNum + 1}...`);
        await nextPageBtn.click();
        await page.waitForTimeout(800);
        pageNum++;
      } else {
        console.log('\n⏹️ Pas de page suivante trouvée');
        break;
      }
    } else {
      console.log('\n🎯 Dernière page atteinte');
      break;
    }
  }

  console.log(`\n🎉 SCRAPING TERMINÉ ! ${pageNum} pages traitées.`);

  await browser.close();
  console.log(`📁 Les CVs sont dans le dossier ${cvsFolder}`);
  return cvsFolder; 
}
