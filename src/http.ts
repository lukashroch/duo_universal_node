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
