import { describe, expect, it } from 'vitest';

import { COMPANY_INFO, getCopyrightText, getYearsOfExperience } from '@/lib/company-info';

describe('company-info helpers', () => {
  it('computes years of experience from the founding year', () => {
    expect(getYearsOfExperience()).toBe(new Date().getFullYear() - COMPANY_INFO.foundedYear);
  });

  it('builds the copyright text from the legal name and current year', () => {
    expect(getCopyrightText()).toContain(String(new Date().getFullYear()));
    expect(getCopyrightText()).toContain(COMPANY_INFO.legalName);
  });
});
