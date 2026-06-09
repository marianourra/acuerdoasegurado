const STORAGE_KEY = 'aa_remember_login';

export type RememberedLogin = {
  email: string;
  password: string;
  remember: boolean;
};

export function loadRememberedLogin(): RememberedLogin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedLogin;
    if (!parsed.remember || !parsed.email) return null;
    return {
      email: parsed.email,
      password: parsed.password ?? '',
      remember: true,
    };
  } catch {
    return null;
  }
}

export function saveRememberedLogin(email: string, password: string): void {
  try {
    const payload: RememberedLogin = {
      email: email.trim(),
      password,
      remember: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage no disponible
  }
}

export function clearRememberedLogin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
