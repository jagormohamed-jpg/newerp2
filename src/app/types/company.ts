// ============ Business / Company Types ============

export type BusinessActivity =
  | 'trading'           // تجارة (شراء وبيع)
  | 'manufacturing'     // تصنيع
  | 'services'          // خدمات
  | 'contracting'       // مقاولات
  | 'retail'            // تجزئة
  | 'wholesale'         // جملة
  | 'food_beverage'     // مطاعم وأغذية
  | 'real_estate'       // عقارات
  | 'medical'           // طبي / صحي
  | 'education'         // تعليم
  | 'mixed';            // متعدد

export type CurrencyCode = 'EGP' | 'SAR' | 'AED' | 'USD' | 'EUR' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'JOD' | 'LYD' | 'TND' | 'MAD' | 'DZD' | 'SDG';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  arabicName: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  name_en: string;
  logo_url: string;
  business_activity: BusinessActivity;
  tax_number: string;
  commercial_register: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phone2: string;
  fax: string;
  email: string;
  website: string;
  currency: CurrencyCode;
  fiscal_year_start: string; // MM-DD format e.g. "01-01"
  timezone: string;
  language: 'ar' | 'en';
  decimal_places: 0 | 2 | 3;
  invoice_footer: string;
  invoice_header_notes: string;
  // Feature Flags
  enable_inventory: boolean;
  enable_manufacturing: boolean;
  enable_payroll: boolean;
  enable_multi_warehouse: boolean;
  enable_multi_currency: boolean;
  enable_vat: boolean;
  vat_rate: number;
  enable_discount: boolean;
  enable_costing: boolean;
  created_at: string;
  updated_at: string;
}

export const BUSINESS_ACTIVITIES: Record<BusinessActivity, { label: string; description: string; icon: string; enabledModules: string[] }> = {
  trading: {
    label: 'تجارة عامة',
    description: 'شراء وبيع البضائع والسلع',
    icon: '🏪',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'reports'],
  },
  manufacturing: {
    label: 'تصنيع',
    description: 'تصنيع المنتجات وإدارة الإنتاج',
    icon: '🏭',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'manufacturing', 'payroll', 'reports'],
  },
  services: {
    label: 'خدمات',
    description: 'تقديم الخدمات والاستشارات',
    icon: '🎯',
    enabledModules: ['accounts', 'contacts', 'treasury', 'invoices', 'payroll', 'reports'],
  },
  contracting: {
    label: 'مقاولات',
    description: 'مشاريع البناء والمقاولات',
    icon: '🏗️',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'payroll', 'reports'],
  },
  retail: {
    label: 'تجزئة',
    description: 'البيع بالتجزئة للمستهلكين',
    icon: '🛒',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'reports'],
  },
  wholesale: {
    label: 'جملة',
    description: 'البيع بالجملة للموزعين',
    icon: '📦',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'reports'],
  },
  food_beverage: {
    label: 'مطاعم وأغذية',
    description: 'مطاعم وكافيهات وصناعة أغذية',
    icon: '🍽️',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'manufacturing', 'payroll', 'reports'],
  },
  real_estate: {
    label: 'عقارات',
    description: 'بيع وتأجير العقارات',
    icon: '🏢',
    enabledModules: ['accounts', 'contacts', 'treasury', 'invoices', 'reports'],
  },
  medical: {
    label: 'طبي / صحي',
    description: 'عيادات ومراكز طبية وصيدليات',
    icon: '🏥',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'payroll', 'reports'],
  },
  education: {
    label: 'تعليم',
    description: 'مدارس ومراكز تدريب وتعليم',
    icon: '🎓',
    enabledModules: ['accounts', 'contacts', 'treasury', 'invoices', 'payroll', 'reports'],
  },
  mixed: {
    label: 'متعدد الأنشطة',
    description: 'أكثر من نشاط تجاري',
    icon: '⚡',
    enabledModules: ['accounts', 'contacts', 'inventory', 'treasury', 'invoices', 'manufacturing', 'payroll', 'reports'],
  },
};

export const CURRENCIES: Currency[] = [
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', arabicName: 'جنيه مصري' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', arabicName: 'ريال سعودي' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', arabicName: 'درهم إماراتي' },
  { code: 'USD', name: 'US Dollar', symbol: '$', arabicName: 'دولار أمريكي' },
  { code: 'EUR', name: 'Euro', symbol: '€', arabicName: 'يورو' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', arabicName: 'دينار كويتي' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', arabicName: 'ريال قطري' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', arabicName: 'دينار بحريني' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', arabicName: 'ريال عُماني' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', arabicName: 'دينار أردني' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'د.ل', arabicName: 'دينار ليبي' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', arabicName: 'دينار تونسي' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م', arabicName: 'درهم مغربي' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', arabicName: 'دينار جزائري' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س', arabicName: 'جنيه سوداني' },
];

export const defaultCompanyInfo: CompanyInfo = {
  id: 'company-1',
  name: 'شركتي للتجارة',
  name_en: 'My Trading Company',
  logo_url: '',
  business_activity: 'trading',
  tax_number: '',
  commercial_register: '',
  address: '',
  city: 'القاهرة',
  country: 'مصر',
  phone: '',
  phone2: '',
  fax: '',
  email: '',
  website: '',
  currency: 'EGP',
  fiscal_year_start: '01-01',
  timezone: 'Africa/Cairo',
  language: 'ar',
  decimal_places: 2,
  invoice_footer: 'شكراً لتعاملكم معنا',
  invoice_header_notes: '',
  enable_inventory: true,
  enable_manufacturing: false,
  enable_payroll: true,
  enable_multi_warehouse: true,
  enable_multi_currency: false,
  enable_vat: false,
  vat_rate: 14,
  enable_discount: true,
  enable_costing: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
