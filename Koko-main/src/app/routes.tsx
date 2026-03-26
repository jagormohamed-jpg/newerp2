import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/layout/RootLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/auth/AuthGuard';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { ContactsPage } from './pages/ContactsPage';
import { WarehouseModulePage } from './pages/WarehouseModulePage';
import { TreasuryModulePage } from './pages/TreasuryModulePage';
import { InvoiceModulePage } from './pages/InvoiceModulePage';
import { ReportsModulePage } from './pages/ReportsModulePage';
import { SalesInvoicePage } from './pages/SalesInvoicePage';
import { PurchaseInvoicePage } from './pages/PurchaseInvoicePage';
import { PayrollDashboardPage } from './pages/payroll/PayrollDashboardPage';
import { DepartmentsPage } from './pages/payroll/DepartmentsPage';
import { EmployeesPage } from './pages/payroll/EmployeesPage';
import { ProductionInvoicesPage } from './pages/payroll/ProductionInvoicesPage';
import { WorkHoursPage } from './pages/payroll/WorkHoursPage';
import { AttendancePage } from './pages/payroll/AttendancePage';
import { TransactionsPage } from './pages/payroll/TransactionsPage';
import { PayrollProcessingPage } from './pages/payroll/PayrollProcessingPage';
import { PayrollReportsPage } from './pages/payroll/PayrollReportsPage';
import { EmployeeStatementPage } from './pages/payroll/EmployeeStatementPage';
import { PayrollSettingsPage } from './pages/payroll/PayrollSettingsPage';
import { UsersModulePage } from './pages/users/UsersModulePage';
import { ManufacturingDashboard } from './pages/manufacturing/ManufacturingDashboard';
import { ManufacturingProductsPage } from './pages/manufacturing/ManufacturingProductsPage';
import { ProductionStagesPage } from './pages/manufacturing/ProductionStagesPage';
import { ManufacturingInvoicePage } from './pages/manufacturing/ManufacturingInvoicePage';
import { StageWarehousesPage } from './pages/manufacturing/StageWarehousesPage';
import { CostingPage } from './pages/manufacturing/CostingPage';
import { ManufacturingReportsPage } from './pages/manufacturing/ManufacturingReportsPage';
import { ManufacturingSettingsPage } from './pages/manufacturing/ManufacturingSettingsPage';
import { SystemReferencePage } from './pages/SystemReferencePage';
import { BalanceSheetPage } from './pages/BalanceSheetPage';
import { AgingReportPage } from './pages/AgingReportPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { FiscalClosingPage } from './pages/FiscalClosingPage';
import { InventoryAdjustmentPage } from './pages/InventoryAdjustmentPage';
import { BranchManagementPage } from './pages/BranchManagementPage';

// Module Dashboards
import { AccountsDashboard } from './pages/dashboards/AccountsDashboard';
import { ContactsDashboard } from './pages/dashboards/ContactsDashboard';
import { InventoryDashboard } from './pages/dashboards/InventoryDashboard';
import { TreasuryDashboard } from './pages/dashboards/TreasuryDashboard';
import { InvoicesDashboard } from './pages/dashboards/InvoicesDashboard';
import { ReportsDashboard } from './pages/dashboards/ReportsDashboard';
import { UsersDashboard } from './pages/dashboards/UsersDashboard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { SetupOrgPage } from './pages/auth/SetupOrgPage';

// Landing Page
import { LandingPage } from './pages/landing/LandingPage';

// Protected App Shell
import React from 'react';

function ProtectedApp() {
  return (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // ============ Landing / Public Routes ============
      { index: true, Component: LandingPage },

      // ============ Auth Routes (public) ============
      { path: 'auth/login', Component: LoginPage },
      { path: 'auth/register', Component: RegisterPage },
      { path: 'auth/forgot-password', Component: ForgotPasswordPage },
      { path: 'auth/setup', Component: SetupOrgPage },

      // ============ App Routes (protected) ============
      {
        path: 'app',
        Component: ProtectedApp,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'dashboard', Component: DashboardPage },

          // الحسابات
          { path: 'accounts', Component: AccountsDashboard },
          { path: 'accounts/tree', Component: AccountsPage },

          // جهات الاتصال
          { path: 'contacts', Component: ContactsDashboard },
          { path: 'contacts/list', Component: ContactsPage },

          // المخازن والأصناف
          { path: 'inventory', Component: InventoryDashboard },
          { path: 'inventory/manage', Component: WarehouseModulePage },
          { path: 'inventory/adjustment', Component: InventoryAdjustmentPage },

          // الخزينة والبنوك
          { path: 'treasury', Component: TreasuryDashboard },
          { path: 'treasury/manage', Component: TreasuryModulePage },

          // الفواتير
          { path: 'invoices', Component: InvoicesDashboard },
          { path: 'invoices/manage', Component: InvoiceModulePage },
          { path: 'invoices/:type', Component: InvoiceModulePage },

          // التقارير المالية
          { path: 'reports', Component: ReportsDashboard },
          { path: 'reports/journal', Component: ReportsModulePage },
          { path: 'reports/balance-sheet', Component: BalanceSheetPage },
          { path: 'reports/aging', Component: AgingReportPage },
          { path: 'reports/cash-flow', Component: CashFlowPage },
          { path: 'reports/fiscal-closing', Component: FiscalClosingPage },

          // الرواتب
          { path: 'payroll', Component: PayrollDashboardPage },
          { path: 'payroll/departments', Component: DepartmentsPage },
          { path: 'payroll/employees', Component: EmployeesPage },
          { path: 'payroll/production-invoices', Component: ProductionInvoicesPage },
          { path: 'payroll/work-hours', Component: WorkHoursPage },
          { path: 'payroll/attendance', Component: AttendancePage },
          { path: 'payroll/transactions', Component: TransactionsPage },
          { path: 'payroll/processing', Component: PayrollProcessingPage },
          { path: 'payroll/reports', Component: PayrollReportsPage },
          { path: 'payroll/employee-statement', Component: EmployeeStatementPage },
          { path: 'payroll/settings', Component: PayrollSettingsPage },

          // المستخدمون
          { path: 'users', Component: UsersDashboard },
          { path: 'users/manage', Component: UsersModulePage },

          // التصنيع
          { path: 'manufacturing', Component: ManufacturingDashboard },
          { path: 'manufacturing/products', Component: ManufacturingProductsPage },
          { path: 'manufacturing/stages', Component: ProductionStagesPage },
          { path: 'manufacturing/invoice', Component: ManufacturingInvoicePage },
          { path: 'manufacturing/warehouses', Component: StageWarehousesPage },
          { path: 'manufacturing/costing', Component: CostingPage },
          { path: 'manufacturing/reports', Component: ManufacturingReportsPage },
          { path: 'manufacturing/settings', Component: ManufacturingSettingsPage },

          // أخرى
          { path: 'sales', Component: SalesInvoicePage },
          { path: 'purchases', Component: PurchaseInvoicePage },
          { path: 'system-reference', Component: SystemReferencePage },
          { path: 'branches', Component: BranchManagementPage },
          { path: '*', Component: DashboardPage },
        ],
      },
    ],
  },
]);
