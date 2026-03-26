import { Outlet } from 'react-router';
import { AuthProvider } from '../../context/AuthContext';
import { AccountingProvider } from '../../context/AccountingContext';
import { PayrollProvider } from '../../context/PayrollContext';
import { UsersProvider } from '../../context/UsersContext';
import { ManufacturingProvider } from '../../context/ManufacturingContext';

export function RootLayout() {
  return (
    <AuthProvider>
      <AccountingProvider>
        <PayrollProvider>
          <UsersProvider>
            <ManufacturingProvider>
              <Outlet />
            </ManufacturingProvider>
          </UsersProvider>
        </PayrollProvider>
      </AccountingProvider>
    </AuthProvider>
  );
}