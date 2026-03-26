import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

/**
 * AuthGuard: يحمي الصفحات ويتأكد من تسجيل الدخول ووجود منظمة
 * - إذا لم يسجل دخول → يوجه لصفحة الدخول
 * - إذا سجل دخول بدون منظمة → يوجه لصفحة إنشاء المنظمة
 */
export function AuthGuard({ children, requireOrg = true }: AuthGuardProps) {
  const { isAuthenticated, hasOrganization, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireOrg && !hasOrganization) {
    return <Navigate to="/auth/setup" replace />;
  }

  return <>{children}</>;
}
