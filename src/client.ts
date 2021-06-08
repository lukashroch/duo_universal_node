import axios, { AxiosError, AxiosInstance } from 'axios';
import jwt from 'jsonwebtoken';
import { URL, URLSearchParams } from 'url';
import * as constants from './constants';
import { DuoException } from './duo-exception';
import { ClientPayload, HealthCheckRequest, HealthCheckResponse } from './http';
import { generateRandomString, getTimeInSeconds } from './util';

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

  private axios: AxiosInstance;

  constructor(options: ClientOptions) {
    this.validateInitialConfig(options);

    const { clientId, clientSecret, apiHost, redirectUrl, useDuoCodeAttribute } = options;

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiHost = apiHost;
    this.baseURL = `https://${this.apiHost}`;
    this.redirectUrl = redirectUrl;
    this.useDuoCodeAttribute = useDuoCodeAttribute ?? true;

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: { 'user-agent': constants.USER_AGENT },
    });
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
   * Retrieves exception message for DuoException from HTTPS result message.
   *
   * @private
   * @param {*} result
   * @returns {string}
   * @memberof Client
   */
  private getExceptionFromResult(result: any): string {
    const { message, message_detail, error, error_description } = result;

    if (message && message_detail) return `${message}: ${message_detail}`;

    if (error && error_description) return `${error}: ${error_description}`;

    return constants.MALFORMED_RESPONSE;
  }

  /**
   * Create client JWT payload
   *
   * @private
   * @param {string} audience
   * @returns {string}
   * @memberof Client
   */
  private createJwtPayload(audience: string): string {
    const timeInSecs = getTimeInSeconds();

    const payload: ClientPayload = {
      iss: this.clientId,
      sub: this.clientId,
      aud: audience,
      jti: generateRandomString(constants.JTI_LENGTH),
      iat: timeInSecs,
      exp: timeInSecs + constants.JWT_EXPIRATION,
    };

    return jwt.sign(payload, this.clientSecret, { algorithm: constants.SIG_ALGORITHM });
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

  /**
   * Makes a call to HEALTH_CHECK_ENDPOINT to see if Duo is available.
   *
   * @returns {Promise<HealthCheckResponse>}
   * @memberof Client
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const audience = `${this.baseURL}${this.HEALTH_CHECK_ENDPOINT}`;
    const jwtPayload = this.createJwtPayload(audience);
    const request: HealthCheckRequest = {
      client_id: this.clientId,
      client_assertion: jwtPayload,
    };

    try {
      const { data } = await this.axios.post<HealthCheckResponse>(
        this.HEALTH_CHECK_ENDPOINT,
        new URLSearchParams(request)
      );
      const { stat } = data;

      if (!stat || stat !== 'OK') throw new DuoException(this.getExceptionFromResult(data));

      return data;
    } catch (err) {
      const error = err as DuoException | AxiosError;
      if (error instanceof DuoException) throw error;

      const data = error.response?.data;
      throw new DuoException(data ? this.getExceptionFromResult(data) : error.message);
    }
  }
}
