import { getBorderCharacters, table, TableUserConfig } from 'table';
import chalk from 'chalk';
import * as fs from 'fs';
import { renderMarkdown } from '../../cli/commands/help/markdown-renderer';

export function createDisplayTable(data: string[][], heading = ''): string {
  const leftTablePadding = 0;

  let tableConfig: TableUserConfig;

  if (!heading) {
    tableConfig = {
      columnDefault: {
        paddingLeft: leftTablePadding,
        alignment: 'left',
      },
      border: getBorderCharacters('void'),
    };
  } else {
    tableConfig = {
      columnDefault: {
        paddingLeft: leftTablePadding,
        alignment: 'left',
      },
      header: {
        content: heading,
        paddingLeft: leftTablePadding,
        alignment: 'left',
      },
      border: getBorderCharacters('void'),
    };
  }

  return table(data, tableConfig as any);
}

export function createDisplayErrTable(
  errMessage: string,
  heading: string,
  data: string[][],
): string {
  return `${chalk.redBright(errMessage)}\n\n${createDisplayTable(
    data,
    heading,
  )}`;
}

export function createDisplayInfoTable(
  msg: string,
  data: string[][],
  heading = '',
): string {
  return `${chalk.greenBright(msg)}\n\n${createDisplayTable(data, heading)}`;
}

export function readAppsHelpMarkdown(filename: string): string {
  const file = fs.readFileSync(filename, 'utf8');
  return renderMarkdown(file);
}
