import chalk from 'chalk';
import { createDisplayErrTable } from './utils';

export const SNYK_APP_NAME = 'snykAppName';
export const SNYK_APP_REDIRECT_URIS = 'snykAppRedirectUris';
export const SNYK_APP_SCOPES = 'snykAppScopes';
export const SNYK_APP_CLIENT_ID = 'snykAppClientId';
export const SNYK_APP_ORG_ID = 'snykAppOrgId';
export const SNYK_APP_DEBUG = 'snyk:apps';

export enum EValidSubCommands {
  CREATE = 'create',
}

export enum EAppsURL {
  CREATE_APP,
}

export const validAppsSubCommands = Object.values<string>(EValidSubCommands);

const tableData = {
  appSubCommand: [['create', 'example: snyk apps create']],
  createOptions: [
    ['Option', 'Required', 'Description'],
    [
      '--org',
      'true',
      'The Snyk Organization id under which the Snyk App should be created',
    ],
    [
      '--name',
      'true',
      'The Snyk App name displayed to users when installing the Snyk App',
    ],
    [
      '--redirect-uris (comma-separated)',
      'true',
      'The redirect URIs for your Snyk App',
    ],
    [
      '--scopes (comma-separated)',
      'true',
      'The permission scopes for your Snyk App',
    ],
  ],
  useExperimental: [[`Usage: $snyk apps <sub-command> --experimental`]],
};

export const AppsErrorMessages = {
  orgRequired: createDisplayErrTable(
    `Option '--org' is required! For interactive mode, please use '--interactive' or '-i' flag.`,
    `Other required options for this command are`,
    tableData.createOptions,
  ),
  nameRequired: createDisplayErrTable(
    `Option '--name' is required! For interactive mode, please use '--interactive' or '-i' flag.`,
    `Other required options for this command are`,
    tableData.createOptions,
  ),
  redirectUrisRequired: createDisplayErrTable(
    `Option '--redirect-uris' is required! For interactive mode, please use '--interactive' or '-i' flag.`,
    `Other required options for this command are`,
    tableData.createOptions,
  ),
  scopesRequired: createDisplayErrTable(
    `Option '--scopes' is required! For interactive mode, please use '--interactive' or '-i' flag.`,
    `Other required options for this command are`,
    tableData.createOptions,
  ),
  useExperimental: `\n${chalk.redBright(
    "All 'apps' commands are only accessible behind the '--experimental' flag.",
  )}\n 
The behaviour can change at any time, without prior notice. 
You are kindly advised to use all the commands with caution.
  
${chalk.bold('Usage')}
  ${chalk.italic('snyk apps <COMMAND> --experimental')}\n`,
};

export const CreateAppPromptData = {
  SNYK_APP_NAME: {
    name: SNYK_APP_NAME,
    message: `Name of the Snyk App (visible to users when they install the Snyk App)?`,
  },
  SNYK_APP_REDIRECT_URIS: {
    name: SNYK_APP_REDIRECT_URIS,
    message: `Your Snyk App's redirect URIs (comma seprated list. ${chalk.yellowBright(
      ' Ex: https://example1.com,https://example2.com',
    )})?: `,
  },
  SNYK_APP_SCOPES: {
    name: SNYK_APP_SCOPES,
    message: `Your Snyk App's permission scopes (comma separated list. ${chalk.yellowBright(
      ' Ex: apps:beta',
    )})?: `,
  },
  SNYK_APP_ORG_ID: {
    name: SNYK_APP_ORG_ID,
    message:
      'Please provide the org id under which you want to create your Snyk App: ',
  },
};
