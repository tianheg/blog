import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parentDir = join(__dirname, '..');
const dirsPath = fs
  .readdirSync(parentDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && !['.git', '00TEMPLATE', 'node_modules', 'scripts'].includes(dirent.name))
  .map(dirent => dirent.name).sort((a, b) => a.localeCompare(b));

async function readHTML(filePath) {
  try {
    const html = await fs.promises.readFile(filePath, 'utf8');
    return html;
  } catch (error) {
    console.error(`Error reading the HTML file: ${error}`);
  }
}

async function getTitleAndDescription(html) {
  const $ = cheerio.load(html);

  const title = $('title').text();
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');

  return { title, description };
}

let dlContent = ''

for (const dir of dirsPath) {
  const indexPath = join(dir, 'index.html');
  const html = await readHTML(indexPath);
  const { title, description } = await getTitleAndDescription(html);

  dlContent += `\n<dt><a href="./${dir}/">${title}</a></dt>
  <dd>${description}</dd>\n`
}

const rootIndexPath = join(parentDir, 'index.html');

try {
  const data = await fs.promises.readFile(rootIndexPath, 'utf8');
  const newData = data.replace(/<dl>[\s\S]*<\/dl>/, `<dl>${dlContent}\n</dl>`);
  await fs.promises.writeFile(rootIndexPath, newData, 'utf8');
  console.log('index.html has been updated with the latest directory information!');
} catch (error) {
  console.error(`Error updating the root index.html file: ${error}`);
}