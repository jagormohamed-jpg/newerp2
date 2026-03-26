import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CompanyInfo } from '../types/company';
import { defaultCompanyInfo } from '../types/company';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { toast } from 'sonner';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ef957755`;

interface CompanyContextType {
  company: CompanyInfo;
  updateCompany: (updates: Partial<CompanyInfo>) => void;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  formatCurrency: (amount: number) => string;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/company/state`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            setCompany({ ...defaultCompanyInfo, ...result.data });
          }
        }
      } catch (e) {
        console.error('CompanyContext: failed to load', e);
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Save on change (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await fetch(`${API_BASE}/company/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ state: company }),
        });
        setLastSaved(new Date());
      } catch (e) {
        console.error('CompanyContext: failed to save', e);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [company, isLoaded]);

  const updateCompany = (updates: Partial<CompanyInfo>) => {
    setCompany(prev => ({ ...prev, ...updates, updated_at: new Date().toISOString() }));
  };

  const formatCurrency = (amount: number) => {
    const currencies: Record<string, string> = {
      EGP: 'EGP', SAR: 'SAR', AED: 'AED', USD: 'USD', EUR: 'EUR',
      KWD: 'KWD', QAR: 'QAR', BHD: 'BHD', OMR: 'OMR', JOD: 'JOD',
      LYD: 'LYD', TND: 'TND', MAD: 'MAD', DZD: 'DZD', SDG: 'SDG',
    };
    try {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: currencies[company.currency] || 'EGP',
        minimumFractionDigits: company.decimal_places,
        maximumFractionDigits: company.decimal_places,
      }).format(amount);
    } catch {
      return `${amount.toFixed(company.decimal_places)} ${company.currency}`;
    }
  };

  return (
    <CompanyContext.Provider value={{ company, updateCompany, isLoading, isSaving, lastSaved, formatCurrency }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
