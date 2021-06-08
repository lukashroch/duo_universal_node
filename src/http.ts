export type ClientPayload = {
  iss: string;
  sub: string;
  aud: string;
  jti: string;
  exp: number;
  iat: number;
};

export type ErrorResponse = {
  error?: string;
  error_description?: string;
};

export type HealthCheckRequest = {
  client_id: string;
  client_assertion: string;
};

export type HealthCheckResponse = {
  stat: string;
  response: { timestamp: number };
  code?: number;
  timestamp?: number;
  message?: string;
  message_detail?: string;
};

export type AuthorizationRequest = {
  response_type: string;
  client_id: string;
  request: string;
  redirect_uri?: string;
  scope?: string;
  nonce?: string;
  state?: string;
};

export type AuthorizationRequestPayload = {
  response_type: string;
  scope: string;
  exp: number;
  client_id: string;
  redirect_uri: string;
  state: string;
  duo_uname: string;
  iss?: string;
  aud?: string;
  nonce?: string;
  use_duo_code_attribute?: boolean;
};

export type AuthorizationResponse = {
  code: string;
  state: string;
};
