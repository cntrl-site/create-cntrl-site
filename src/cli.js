const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const os = require('os');
const projectName = process.argv[2];
const prompts = require('prompts');
const packageJson = require('../package.json');

function init() {
  checkIfProjectNameDefined();
  cloneRepository();
  installDeps();
  promptApiUrl()
    .then(apiUrl => createEnvFile(apiUrl, () => {
      const generateLayoutsCommand = `cd ${projectName} && npm run generate-layouts`;
      const generatingLayouts = runCommand(generateLayoutsCommand);
      if (!generatingLayouts) process.exit(1);
      console.log('Project generated. Please write "npm run dev" command start it locally');
    }));
}

function checkIfProjectNameDefined() {
  if (typeof projectName === 'undefined') {
    console.error('Please specify the project directory:');
    console.log(
      `  ${chalk.cyan(packageJson.name)} ${chalk.green('<project-directory>')}`
    );
    console.log();
    console.log('For example:');
    console.log(
      `  ${chalk.cyan(packageJson.name)} ${chalk.green('my-cntrl-site')}`
    );
    process.exit(1);
  }
}

function cloneRepository() {
  const gitCheckoutCommand = `git clone --depth 1 https://github.com/cntrl-site/nextjs-template ${projectName}`;
  // create temp dir
  const tempDirPath = path.join(os.tmpdir(), 'cntrl-');
  fs.ensureDirSync(tempDirPath);
  try {
    execSync(gitCheckoutCommand, {
      stdio: [0, 1, 2], // we need this so node will print the command output
      cwd: tempDirPath,
    })
  } catch (e) {
    console.error(`Failed to execute ${gitCheckoutCommand}`, e);
    process.exit(1);
  }
  fs.removeSync(path.join(tempDirPath, '.git'));
  fs.copySync(tempDirPath, path.join(process.cwd()));
  fs.removeSync(tempDirPath);
}

function installDeps() {
  const gitInstallDepsCommand = `cd ${projectName} && npm ci`;
  console.log(`Installing dependencies for ${projectName}`);
  const installedDeps = runCommand(gitInstallDepsCommand);
  if (!installedDeps) process.exit(1);
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

async function createEnvFile(apiUrl, onFileCreate) {
  const content = generateFileContent(apiUrl);
  const filePath = path.resolve(process.cwd(), `${projectName}/.env.local`);
  return fs.appendFile(filePath, content, (err) => {
    if (err) throw err;
    onFileCreate();
  });
}

function generateFileContent(apiUrl) {
  return `CNTRL_API_URL=${apiUrl}`
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

module.exports = init;
