import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Local-first AuthGuard for ColtIDE.
 * Allows unrestricted local desktop access without requiring cloud login.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}
