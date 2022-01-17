import config from '../config';
import { makeRequest } from '../request';
import { getAuthHeader } from '../api-token';
import { FormattedResult } from '../../cli/commands/test/iac-local-execution/types';
import { convertIacResultsToScanResult } from './utils';

export function sendReport(results: FormattedResult[]) {
  results.forEach((result) => {
    makeRequest({
      method: 'PUT',
      url: `${config.API}/monitor-dependencies`,
      json: true,
      headers: {
        authorization: getAuthHeader(),
      },
      body: { scanResult: convertIacResultsToScanResult(result) },
    });
  });
}
