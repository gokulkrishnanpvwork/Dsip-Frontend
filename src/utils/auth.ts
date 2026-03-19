import { API_BASE_URL } from '../lib/api';

const GOOGLE_LOGIN_URL = `${API_BASE_URL}/oauth2/authorization/google`;

/** Redirects the current tab to Google OAuth (backend → accounts.google.com → back via redirect URL). */
export const redirectToGoogleLogin = (): void => {
  window.location.assign(GOOGLE_LOGIN_URL);
};
