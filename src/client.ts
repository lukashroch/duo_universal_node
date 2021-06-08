import { URL } from 'url';
import * as constants from './constants';
import { DuoException } from './duo-exception';
import { generateRandomString } from './util';

export type ClientOptions = {
  clientId: string;
  clientSecret: string;
  apiHost: string;
  redirectUrl: string;
  useDuoCodeAttribute?: boolean;
};

export class Client {
  readonly HEALTH_CHECK_ENDPOINT = '/oauth/v1/health_check';

  readonly AUTHORIZE_ENDPOINT = '/oauth/v1/authorize';

  readonly TOKEN_ENDPOINT = '/oauth/v1/token';

  private clientId: string;

  private clientSecret: string;

  private apiHost: string;

  private baseURL: string;

  private redirectUrl: string;

  private useDuoCodeAttribute: boolean;

  constructor(options: ClientOptions) {
    this.validateInitialConfig(options);

    const { clientId, clientSecret, apiHost, redirectUrl, useDuoCodeAttribute } = options;

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiHost = apiHost;
    this.baseURL = `https://${this.apiHost}`;
    this.redirectUrl = redirectUrl;
    this.useDuoCodeAttribute = useDuoCodeAttribute ?? true;
  }

  /**
   * Validate that the clientId and clientSecret are the proper length.
   *
   * @private
   * @param {ClientOptions} options
   * @memberof Client
   */
  private validateInitialConfig(options: ClientOptions): void {
    const { clientId, clientSecret, apiHost, redirectUrl } = options;

    if (clientId.length !== constants.CLIENT_ID_LENGTH)
      throw new DuoException(constants.INVALID_CLIENT_ID_ERROR);

    if (clientSecret.length !== constants.CLIENT_SECRET_LENGTH)
      throw new DuoException(constants.INVALID_CLIENT_SECRET_ERROR);

    if (!/api-[a-zA-Z0-9]+\.duo(security)?\.com/.test(apiHost))
      throw new DuoException(constants.PARSING_CONFIG_ERROR);

    try {
      new URL(redirectUrl);
    } catch (err) {
      throw new DuoException(constants.PARSING_CONFIG_ERROR);
    }
  }

  /**
   * Generate a random hex string with a length of DEFAULT_STATE_LENGTH.
   *
   * @returns {string}
   * @memberof Client
   */
  generateState(): string {
    return generateRandomString(constants.DEFAULT_STATE_LENGTH);
  }
}
