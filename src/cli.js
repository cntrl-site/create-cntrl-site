const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const projectName = process.argv[2];
const prompts = require('prompts');
const folderName = projectName ?? 'cntrl-site';
const gitCheckoutCommand = `git clone --depth 1 https://github.com/cntrl-site/nextjs-template ${folderName}`;
const gitInstallDepsCommand = `cd ${folderName} && npm ci`;
const generateLayoutsCommand = `cd ${folderName} && npm run generate-layouts`;

function installDeps() {
  console.log(`Installing dependencies for ${folderName}`);
  const installedDeps = runCommand(gitInstallDepsCommand);
  if (!installedDeps) process.exit(-1);
}

function cloneRepository() {
  console.log(`Cloning the repository with name ${folderName}`);
  const checkedOut = runCommand(gitCheckoutCommand);
  if (!checkedOut) process.exit(-1);
}

async function promptApiUrl () {
  const response = await prompts({
    type: 'text',
    name: 'apiUrl',
    message: 'Please enter API url from development tab in editor:'
  });
  const apiUrl = response.apiUrl;
  return apiUrl;
}

function runCommand(command) {
  try {
    execSync(`${command}`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to execute ${command}`, e);
    return false;
  }
  return true;
}

async function createEnvFile(apiUrl) {
  const content = generateFileContent(apiUrl);
  const filePath = path.resolve(process.cwd(), `${folderName}/.env.local`);
  await fs.appendFile(filePath, content, (err) => {
    if (err) throw err;
    const generatingLayouts = runCommand(generateLayoutsCommand);
    if (!generatingLayouts) process.exit(-1);
    console.log('Project generated. Please write "npm run dev" command start it locally')
  });
}

function generateFileContent(apiUrl) {
  return `CNTRL_API_URL=${apiUrl}`
}

function init() {
  cloneRepository();
  installDeps();
  promptApiUrl().then(apiUrl => createEnvFile(apiUrl));
}

module.exports = init;
