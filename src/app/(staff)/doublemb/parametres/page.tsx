'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Bell,
  Lock,
  Mail,
  Globe,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  Upload,
  Palette,
  CreditCard,
  BarChart3,
  Shield,
  Loader2
} from 'lucide-react';
import { getSettings, updateSettings, type SiteSetting } from '@/lib/admin-api';

interface Tab {
  id: string;
  name: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'general', name: 'Général', icon: Settings },
  { id: 'branding', name: 'Branding', icon: Palette },
  { id: 'company', name: 'Entreprise', icon: Building2 },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'security', name: 'Sécurité', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'social', name: 'Réseaux Sociaux', icon: Globe },
  { id: 'payments', name: 'Paiements', icon: CreditCard },
  { id: 'appearance', name: 'Apparence', icon: Upload },
  { id: 'maintenance', name: 'Maintenance', icon: AlertTriangle },
  { id: 'backup', name: 'Sauvegarde', icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics Settings (loaded from API)
  const [analyticsSettings, setAnalyticsSettings] = useState({
    ga4_enabled: false,
    ga4_id: '',
    gtm_enabled: false,
    gtm_id: '',
    fb_pixel_enabled: false,
    fb_pixel_id: '',
  });

  // Security Settings (loaded from API)
  const [securitySettingsData, setSecuritySettingsData] = useState({
    recaptcha_enabled: false,
    recaptcha_site_key: '',
    recaptcha_secret_key: '',
    recaptcha_min_score: '0.5',
    recaptcha_forms: ['contact', 'login', 'register'] as string[],
  });

  // Hero & Appearance Settings (loaded from API)
  const [appearanceSettings, setAppearanceSettings] = useState({
    hero_title: 'Construire avec rigueur et vision durable',
    hero_subtitle: 'MBC accompagne vos projets de construction, de la livraison à la conception avec transparence et expertise terrain.',
    hero_image: '/engineer.png',
    hero_cta_text: 'Demander un devis',
    stats_years: '3',
    stats_projects: '15',
    stats_clients: '50',
    stats_students: '200',
  });

  // Maintenance Mode Settings
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    enabled: false,
    message: 'Le site est en maintenance. Veuillez réessayer plus tard.',
  });

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'MBC - Madiba Business Center',
    siteUrl: 'https://madibabc.com',
    timezone: 'Africa/Douala',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    currency: 'XAF',
  });

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Madiba Business Center SARL',
    address: 'Bonanjo, Douala, Cameroun',
    phone: '+237 699 000 000',
    email: 'contact@madibabc.com',
    registrationNumber: 'RC/DLA/2020/B/1234',
    taxId: 'M1234567890A',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewUser: true,
    emailNewProject: true,
    emailPayment: true,
    emailDailyReport: false,
    smsEnabled: false,
    smsNewProject: false,
    pushEnabled: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  });

  // Email Settings (loaded from API)
  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromName: '',
    fromEmail: '',
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enableOnlinePayment: true,
    providers: ['orange_money', 'mtn_mobile_money', 'carte_bancaire'],
    orangeMoneyEnabled: true,
    mtnMomoEnabled: true,
    cardEnabled: false,
    testMode: true,
    currency: 'XAF',
    monerooSecretKey: '',
  });

  // Social Links Settings
  const [socialSettings, setSocialSettings] = useState({
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    twitter_url: '',
    youtube_url: '',
    whatsapp_number: '',
  });

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getSettings();
        if (response.success && response.data) {
          const data = response.data;

          // Load analytics settings
          if (data.analytics) {
            const analyticsArray = Array.isArray(data.analytics) ? data.analytics : [];
            const analyticsMap = analyticsArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setAnalyticsSettings({
              ga4_enabled: analyticsMap.ga4_enabled === true || analyticsMap.ga4_enabled === '1',
              ga4_id: analyticsMap.ga4_id || '',
              gtm_enabled: analyticsMap.gtm_enabled === true || analyticsMap.gtm_enabled === '1',
              gtm_id: analyticsMap.gtm_id || '',
              fb_pixel_enabled: analyticsMap.fb_pixel_enabled === true || analyticsMap.fb_pixel_enabled === '1',
              fb_pixel_id: analyticsMap.fb_pixel_id || '',
            });
          }

          // Load security settings
          if (data.security) {
            const securityArray = Array.isArray(data.security) ? data.security : [];
            const securityMap = securityArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            let recaptchaForms = ['contact', 'login', 'register'];
            if (securityMap.recaptcha_forms) {
              try {
                recaptchaForms = typeof securityMap.recaptcha_forms === 'string'
                  ? JSON.parse(securityMap.recaptcha_forms)
                  : securityMap.recaptcha_forms;
              } catch { /* keep default */ }
            }

            setSecuritySettingsData({
              recaptcha_enabled: securityMap.recaptcha_enabled === true || securityMap.recaptcha_enabled === '1',
              recaptcha_site_key: securityMap.recaptcha_site_key || '',
              recaptcha_secret_key: securityMap.recaptcha_secret_key || '',
              recaptcha_min_score: securityMap.recaptcha_min_score || '0.5',
              recaptcha_forms: recaptchaForms,
            });
          }

          // Load appearance/hero settings
          if (data.general) {
            const generalArray = Array.isArray(data.general) ? data.general : [];
            const appearanceMap = generalArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setAppearanceSettings(prev => ({
              ...prev,
              hero_title: appearanceMap.hero_title || prev.hero_title,
              hero_subtitle: appearanceMap.hero_subtitle || prev.hero_subtitle,
              hero_image: appearanceMap.hero_image || prev.hero_image,
              hero_cta_text: appearanceMap.hero_cta_text || prev.hero_cta_text,
              stats_years: appearanceMap.stats_years || prev.stats_years,
              stats_projects: appearanceMap.stats_projects || prev.stats_projects,
              stats_clients: appearanceMap.stats_clients || prev.stats_clients,
              stats_students: appearanceMap.stats_students || prev.stats_students,
            }));
          }

          // Load general settings
          if (data.general) {
            const generalArray = Array.isArray(data.general) ? data.general : [];
            const generalMap = generalArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setGeneralSettings(prev => ({
              ...prev,
              siteName: generalMap.company_name || prev.siteName,
              siteUrl: generalMap.site_url || prev.siteUrl,
            }));
          }

          // Load company settings
          if (data.contact) {
            const contactArray = Array.isArray(data.contact) ? data.contact : [];
            const contactMap = contactArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setCompanySettings(prev => ({
              ...prev,
              phone: contactMap.phone || prev.phone,
              email: contactMap.email || prev.email,
              address: contactMap.address_full || prev.address,
            }));
          }

          // Load social settings
          if (data.social) {
            const socialArray = Array.isArray(data.social) ? data.social : [];
            const socialMap = socialArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setSocialSettings(prev => ({
              ...prev,
              facebook_url: socialMap.facebook_url || prev.facebook_url,
              instagram_url: socialMap.instagram_url || prev.instagram_url,
              linkedin_url: socialMap.linkedin_url || prev.linkedin_url,
              twitter_url: socialMap.twitter_url || prev.twitter_url,
              youtube_url: socialMap.youtube_url || prev.youtube_url,
              whatsapp_number: socialMap.whatsapp_number || prev.whatsapp_number,
            }));
          }

          // Load email/SMTP settings
          if (data.email) {
            const emailArray = Array.isArray(data.email) ? data.email : [];
            const emailMap = emailArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setEmailSettings(prev => ({
              ...prev,
              provider: emailMap.mail_mailer || prev.provider,
              smtpHost: emailMap.mail_host || prev.smtpHost,
              smtpPort: parseInt(emailMap.mail_port) || prev.smtpPort,
              smtpUser: emailMap.mail_username || prev.smtpUser,
              smtpPassword: emailMap.mail_password || prev.smtpPassword,
              smtpEncryption: emailMap.mail_encryption || prev.smtpEncryption,
              fromEmail: emailMap.mail_from_address || prev.fromEmail,
              fromName: emailMap.mail_from_name || prev.fromName,
            }));
          }

          // Load payment settings
          if (data.payment) {
            const paymentArray = Array.isArray(data.payment) ? data.payment : [];
            const paymentMap = paymentArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setPaymentSettings(prev => ({
              ...prev,
              enableOnlinePayment: paymentMap.payment_enabled === true || paymentMap.payment_enabled === '1',
              testMode: paymentMap.moneroo_test_mode === true || paymentMap.moneroo_test_mode === '1',
              currency: paymentMap.moneroo_currency || prev.currency,
              monerooSecretKey: paymentMap.moneroo_secret_key || '',
            }));
          }

          // Load maintenance settings
          if (data.general) {
            const generalArray = Array.isArray(data.general) ? data.general : [];
            const generalMap = generalArray.reduce((acc: Record<string, any>, item: SiteSetting) => {
              acc[item.key] = item.value;
              return acc;
            }, {});

            setMaintenanceSettings({
              enabled: generalMap.maintenance_mode === true || generalMap.maintenance_mode === '1',
              message: generalMap.maintenance_message || 'Le site est en maintenance. Veuillez réessayer plus tard.',
            });
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des paramètres');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Prepare settings to update
      const settingsToUpdate = [
        // Analytics
        { key: 'ga4_enabled', value: analyticsSettings.ga4_enabled },
        { key: 'ga4_id', value: analyticsSettings.ga4_id },
        { key: 'gtm_enabled', value: analyticsSettings.gtm_enabled },
        { key: 'gtm_id', value: analyticsSettings.gtm_id },
        { key: 'fb_pixel_enabled', value: analyticsSettings.fb_pixel_enabled },
        { key: 'fb_pixel_id', value: analyticsSettings.fb_pixel_id },
        // Security
        { key: 'recaptcha_enabled', value: securitySettingsData.recaptcha_enabled },
        { key: 'recaptcha_site_key', value: securitySettingsData.recaptcha_site_key },
        { key: 'recaptcha_secret_key', value: securitySettingsData.recaptcha_secret_key },
        { key: 'recaptcha_min_score', value: securitySettingsData.recaptcha_min_score },
        { key: 'recaptcha_forms', value: securitySettingsData.recaptcha_forms },
        // Appearance/Hero
        { key: 'hero_title', value: appearanceSettings.hero_title },
        { key: 'hero_subtitle', value: appearanceSettings.hero_subtitle },
        { key: 'hero_image', value: appearanceSettings.hero_image },
        { key: 'hero_cta_text', value: appearanceSettings.hero_cta_text },
        { key: 'stats_years', value: appearanceSettings.stats_years },
        { key: 'stats_projects', value: appearanceSettings.stats_projects },
        { key: 'stats_clients', value: appearanceSettings.stats_clients },
        { key: 'stats_students', value: appearanceSettings.stats_students },
        // Social Links
        { key: 'facebook_url', value: socialSettings.facebook_url },
        { key: 'instagram_url', value: socialSettings.instagram_url },
        { key: 'linkedin_url', value: socialSettings.linkedin_url },
        { key: 'twitter_url', value: socialSettings.twitter_url },
        { key: 'youtube_url', value: socialSettings.youtube_url },
        { key: 'whatsapp_number', value: socialSettings.whatsapp_number },
        // Email/SMTP Settings
        { key: 'mail_mailer', value: emailSettings.provider },
        { key: 'mail_host', value: emailSettings.smtpHost },
        { key: 'mail_port', value: emailSettings.smtpPort.toString() },
        { key: 'mail_username', value: emailSettings.smtpUser },
        { key: 'mail_password', value: emailSettings.smtpPassword },
        { key: 'mail_encryption', value: emailSettings.smtpEncryption },
        { key: 'mail_from_address', value: emailSettings.fromEmail },
        { key: 'mail_from_name', value: emailSettings.fromName },
        // Payments
        { key: 'payment_enabled', value: paymentSettings.enableOnlinePayment },
        { key: 'moneroo_test_mode', value: paymentSettings.testMode },
        { key: 'moneroo_currency', value: paymentSettings.currency },
        { key: 'moneroo_secret_key', value: paymentSettings.monerooSecretKey },
        // Maintenance
        { key: 'maintenance_mode', value: maintenanceSettings.enabled },
        { key: 'maintenance_message', value: maintenanceSettings.message },
      ];

      const response = await updateSettings(settingsToUpdate);

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde des paramètres');
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (key: string, file: File) => {
    if (!file) return;

    setUploadingImages(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/admin/settings/${key}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Update the appropriate state based on the key
        if (key === 'hero_image') {
          setAppearanceSettings(prev => ({ ...prev, hero_image: data.data.url }));
        } else if (key === 'company_logo') {
          // Update company logo
          setGeneralSettings(prev => ({ ...prev, siteName: prev.siteName }));
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(data.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (err) {
      setError('Erreur lors de l\'upload de l\'image');
      console.error('Upload error:', err);
    } finally {
      setUploadingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du site
                </label>
                <input
                  type="text"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL du site
                </label>
                <input
                  type="url"
                  value={generalSettings.siteUrl}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fuseau horaire
                </label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                  <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                  <option value="Europe/Paris">Europe/Paris (UTC+1/2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Langue par défaut
                </label>
                <select
                  value={generalSettings.language}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format de date
                </label>
                <select
                  value={generalSettings.dateFormat}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Devise
                </label>
                <select
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="XAF">FCFA (XAF)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar US (USD)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Gérez les paramètres de la section branding - logos, favicon, et images pour les réseaux sociaux.
              </p>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Favicon
                <span className="text-xs text-gray-500 ml-2">(Icône du site ICO ou PNG, 32x32px)</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/x-icon,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('favicon', file);
                  }}
                  className="hidden"
                  id="favicon_upload"
                />
                <label htmlFor="favicon_upload" className="cursor-pointer">
                  {uploadingImages['favicon'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> le favicon
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ICO ou PNG (32x32px recommandé)</p>
                    </>
                  )}
                </label>
              </div>
              <input
                type="text"
                placeholder="Ou entrez une URL manuellement"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Icône carrée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Icône
                <span className="text-xs text-gray-500 ml-2">(Icône carrée de l'entreprise PNG, 512x512px recommandé)</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('company_icon', file);
                  }}
                  className="hidden"
                  id="icon_upload"
                />
                <label htmlFor="icon_upload" className="cursor-pointer">
                  {uploadingImages['company_icon'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> l'icône
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG (512x512px recommandé)</p>
                    </>
                  )}
                </label>
              </div>
              <input
                type="text"
                placeholder="Ou entrez une URL manuellement"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Logo principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Logo principal
                <span className="text-xs text-gray-500 ml-2">(Logo de l'entreprise PNG/SVG recommandé, max 2MB)</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('company_logo', file);
                  }}
                  className="hidden"
                  id="logo_principal_upload"
                />
                <label htmlFor="logo_principal_upload" className="cursor-pointer">
                  {uploadingImages['company_logo'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> le logo principal
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG/SVG (max 2MB)</p>
                    </>
                  )}
                </label>
              </div>
              <input
                type="text"
                placeholder="Ou entrez une URL manuellement"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Logo blanc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Logo blanc
                <span className="text-xs text-gray-500 ml-2">(Logo pour fond sombre PNG/SVG recommandé)</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('logo_blanc', file);
                  }}
                  className="hidden"
                  id="logo_blanc_upload"
                />
                <label htmlFor="logo_blanc_upload" className="cursor-pointer">
                  {uploadingImages['logo_blanc'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> le logo blanc
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG/SVG pour fond sombre</p>
                    </>
                  )}
                </label>
              </div>
              <input
                type="text"
                placeholder="Ou entrez une URL manuellement"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Image Open Graph */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Image Open Graph
                <span className="text-xs text-gray-500 ml-2">(Image pour partage réseaux sociaux 1200x630px)</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('og_image', file);
                  }}
                  className="hidden"
                  id="og_image_upload"
                />
                <label htmlFor="og_image_upload" className="cursor-pointer">
                  {uploadingImages['og_image'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> l'image OG
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG/JPG (1200x630px)</p>
                    </>
                  )}
                </label>
              </div>
              <input
                type="text"
                placeholder="Ou entrez une URL manuellement"
                className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Logo de l'entreprise
              </label>
              
              {/* Logo Preview */}
              <div className="mb-4">
                <div className="relative h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center group">
                  {companySettings.companyName ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-gray-400" />
                    </div>
                  ) : (
                    <Upload className="h-10 w-10 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('company_logo', file);
                  }}
                  className="hidden"
                  id="company_logo_upload"
                />
                <label htmlFor="company_logo_upload" className="cursor-pointer">
                  {uploadingImages['company_logo'] ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="text-red-600 font-medium">Cliquez pour uploader</span> ou glissez-déposez le logo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, SVG jusqu'à 2MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raison sociale
                </label>
                <input
                  type="text"
                  value={companySettings.companyName}
                  onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  N° Registre de Commerce
                </label>
                <input
                  type="text"
                  value={companySettings.registrationNumber}
                  onChange={(e) => setCompanySettings({ ...companySettings, registrationNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  N° Contribuable (NIU)
                </label>
                <input
                  type="text"
                  value={companySettings.taxId}
                  onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  Configurez vos outils d'analytics pour suivre le trafic et les conversions
                </span>
              </div>
            </div>

            {/* Google Analytics 4 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-6 w-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Google Analytics 4</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suivi avancé du trafic et des événements</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsSettings.ga4_enabled}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, ga4_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                </label>
              </div>
              {analyticsSettings.ga4_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID de mesure GA4
                  </label>
                  <input
                    type="text"
                    placeholder="G-XXXXXXXXXX"
                    value={analyticsSettings.ga4_id}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, ga4_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Trouvez votre ID dans Google Analytics → Admin → Flux de données
                  </p>
                </div>
              )}
            </div>

            {/* Google Tag Manager */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Google Tag Manager</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestion centralisée de tous vos tags</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsSettings.gtm_enabled}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, gtm_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                </label>
              </div>
              {analyticsSettings.gtm_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID du conteneur GTM
                  </label>
                  <input
                    type="text"
                    placeholder="GTM-XXXXXXX"
                    value={analyticsSettings.gtm_id}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, gtm_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Facebook Pixel */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Facebook Pixel</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suivi des conversions Facebook Ads</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsSettings.fb_pixel_enabled}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, fb_pixel_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                </label>
              </div>
              {analyticsSettings.fb_pixel_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID du Pixel Facebook
                  </label>
                  <input
                    type="text"
                    placeholder="XXXXXXXXXXXXXXX"
                    value={analyticsSettings.fb_pixel_id}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, fb_pixel_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* reCAPTCHA Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Google reCAPTCHA v3</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Protection contre les bots et le spam</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettingsData.recaptcha_enabled}
                    onChange={(e) => setSecuritySettingsData({ ...securitySettingsData, recaptcha_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                </label>
              </div>

              {securitySettingsData.recaptcha_enabled && (
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Obtenez vos clés sur <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="underline">Google reCAPTCHA Admin</a>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Clé du site (publique)
                      </label>
                      <input
                        type="text"
                        placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXX"
                        value={securitySettingsData.recaptcha_site_key}
                        onChange={(e) => setSecuritySettingsData({ ...securitySettingsData, recaptcha_site_key: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Clé secrète (serveur)
                      </label>
                      <input
                        type="password"
                        placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXX"
                        value={securitySettingsData.recaptcha_secret_key}
                        onChange={(e) => setSecuritySettingsData({ ...securitySettingsData, recaptcha_secret_key: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Score minimum (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={securitySettingsData.recaptcha_min_score}
                      onChange={(e) => setSecuritySettingsData({ ...securitySettingsData, recaptcha_min_score: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Plus le score est élevé, plus strict sera le filtrage (0.5 recommandé)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formulaires protégés
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'contact', label: 'Formulaire de contact' },
                        { key: 'login', label: 'Connexion' },
                        { key: 'register', label: 'Inscription' },
                      ].map((form) => (
                        <label key={form.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={securitySettingsData.recaptcha_forms.includes(form.key)}
                            onChange={(e) => {
                              const forms = e.target.checked
                                ? [...securitySettingsData.recaptcha_forms, form.key]
                                : securitySettingsData.recaptcha_forms.filter(f => f !== form.key);
                              setSecuritySettingsData({ ...securitySettingsData, recaptcha_forms: forms });
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{form.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other security settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Authentification</h4>
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentification à deux facteurs</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ajouter une couche de sécurité supplémentaire</p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiration de session (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tentatives de connexion max
                  </label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Politique de mot de passe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longueur minimale
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée de verrouillage (minutes)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordRequireUppercase}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Exiger des majuscules</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordRequireNumbers}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Exiger des chiffres</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Notifications par email</h4>
              <div className="space-y-4">
                {[
                  { key: 'emailNewUser', label: 'Nouvel utilisateur inscrit' },
                  { key: 'emailNewProject', label: 'Nouveau projet créé' },
                  { key: 'emailPayment', label: 'Paiement reçu' },
                  { key: 'emailDailyReport', label: 'Rapport quotidien' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Notifications SMS</h4>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">
                    Les SMS nécessitent une configuration avec un fournisseur externe
                  </span>
                </div>
              </div>
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Activer les notifications SMS</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.smsEnabled}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Notifications Push</h4>
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Activer les notifications push</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushEnabled}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, pushEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fournisseur d'email
              </label>
              <select
                value={emailSettings.provider}
                onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="smtp">SMTP</option>
                <option value="mailgun">Mailgun</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Serveur SMTP
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Port SMTP
                </label>
                <input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Utilisateur SMTP
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chiffrement
                </label>
                <select
                  value={emailSettings.smtpEncryption}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpEncryption: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="">Aucun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom d'expéditeur
                </label>
                <input
                  type="text"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email d'expéditeur
                </label>
                <input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Tester la configuration email
            </button>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            {/* Moneroo Configuration */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration Moneroo</h4>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Moneroo est la passerelle de paiement utilisée pour Orange Money, MTN MoMo et cartes bancaires.
                  <a href="https://moneroo.io" target="_blank" rel="noopener noreferrer" className="ml-1 underline">
                    Créer un compte Moneroo
                  </a>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clé secrète Moneroo
                  </label>
                  <input
                    type="password"
                    value={paymentSettings.monerooSecretKey}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, monerooSecretKey: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="pvk_live_xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Devise par défaut
                  </label>
                  <select
                    value={paymentSettings.currency}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="XAF">XAF</option>
                    <option value="XOF">XOF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activer le paiement en ligne</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Autoriser les paiements Moneroo</p>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings.enableOnlinePayment}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, enableOnlinePayment: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-sm text-yellow-800 dark:text-yellow-300">
                  Mode test activé - Aucune transaction réelle ne sera effectuée
                </span>
              </div>
            </div>

            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode test</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Utiliser l'environnement sandbox</p>
              </div>
              <input
                type="checkbox"
                checked={paymentSettings.testMode}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, testMode: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </label>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Moyens de paiement</h4>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-orange-600 font-bold text-xs">OM</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Orange Money</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paiement mobile Orange</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.orangeMoneyEnabled}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, orangeMoneyEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </label>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-yellow-600 font-bold text-xs">MTN</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">MTN Mobile Money</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paiement mobile MTN</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.mtnMomoEnabled}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, mtnMomoEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </label>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carte bancaire</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.cardEnabled}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cardEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Configurez vos liens vers les réseaux sociaux. Les URLs vides ne seront pas affichées sur le site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                { key: 'twitter_url', label: 'Twitter/X', placeholder: 'https://twitter.com/...' },
                { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
                { key: 'whatsapp_number', label: 'WhatsApp', placeholder: '+237 6XX XX XX XX' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {item.label}
                  </label>
                  <input
                    type={item.key === 'whatsapp_number' ? 'tel' : 'url'}
                    value={(socialSettings as any)[item.key] || ''}
                    onChange={(e) => setSocialSettings({ ...socialSettings, [item.key]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.key === 'whatsapp_number' ? 'Numéro WhatsApp avec indicatif pays' : 'URL complète du profil'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-8">
            {/* Hero Section Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Section Hero (Accueil)</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre principal
                  </label>
                  <input
                    type="text"
                    value={appearanceSettings.hero_title}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, hero_title: e.target.value })}
                    placeholder="Construire avec rigueur et vision durable"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sous-titre
                  </label>
                  <textarea
                    value={appearanceSettings.hero_subtitle}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, hero_subtitle: e.target.value })}
                    placeholder="MBC accompagne vos projets..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image du Hero
                  </label>
                  
                  {/* Image Preview */}
                  <div className="mb-3">
                    <div className="relative h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center group">
                      {appearanceSettings.hero_image ? (
                        <>
                          <img
                            src={appearanceSettings.hero_image}
                            alt="Hero preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                            <button
                              onClick={() => setAppearanceSettings({ ...appearanceSettings, hero_image: '' })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      ) : (
                        <Upload className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Upload Zone */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('hero_image', file);
                      }}
                      className="hidden"
                      id="hero_image_upload"
                    />
                    <label htmlFor="hero_image_upload" className="cursor-pointer">
                      {uploadingImages['hero_image'] ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            <span className="text-red-600 font-medium">Cliquez pour uploader</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG jusqu'à 2MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* URL manuelle (optionnel) */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={appearanceSettings.hero_image}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, hero_image: e.target.value })}
                        placeholder="Ou entrez une URL manuellement"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Texte du bouton CTA
                  </label>
                  <input
                    type="text"
                    value={appearanceSettings.hero_cta_text}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, hero_cta_text: e.target.value })}
                    placeholder="Demander un devis"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques affichées</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Années d&apos;expérience
                  </label>
                  <input
                    type="number"
                    value={appearanceSettings.stats_years}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, stats_years: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Projets réalisés
                  </label>
                  <input
                    type="number"
                    value={appearanceSettings.stats_projects}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, stats_projects: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clients satisfaits
                  </label>
                  <input
                    type="number"
                    value={appearanceSettings.stats_clients}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, stats_clients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apprenants formés
                  </label>
                  <input
                    type="number"
                    value={appearanceSettings.stats_students}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, stats_students: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thème</h4>
              <div className="grid grid-cols-3 gap-4">
                {['light', 'dark', 'system'].map((theme) => (
                  <button
                    key={theme}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-500 transition-colors"
                  >
                    <div className={`h-20 rounded-lg mb-2 ${theme === 'light' ? 'bg-white border' : theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-r from-white to-gray-900'}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{theme === 'system' ? 'Système' : theme === 'light' ? 'Clair' : 'Sombre'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Couleur principale</h4>
              <div className="flex space-x-4">
                {['#DC2626', '#2563EB', '#059669', '#7C3AED', '#EA580C'].map((color) => (
                  <button
                    key={color}
                    className="h-10 w-10 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className={`p-6 border-2 rounded-xl ${maintenanceSettings.enabled ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <AlertTriangle className={`h-8 w-8 mr-4 ${maintenanceSettings.enabled ? 'text-yellow-600' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mode Maintenance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Lorsque le mode maintenance est activé, seuls les administrateurs pourront accéder au site. 
                      Les visiteurs verront un message personnalisé.
                    </p>
                    {maintenanceSettings.enabled && (
                      <div className="flex items-center text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></div>
                        Mode maintenance actuellement ACTIF
                      </div>
                    )}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceSettings.enabled}
                    onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message de maintenance
              </label>
              <textarea
                value={maintenanceSettings.message}
                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, message: e.target.value })}
                placeholder="Le site est en maintenance. Veuillez réessayer plus tard."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Ce message sera affiché aux visiteurs lorsque le mode maintenance est activé.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Information importante</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    N'oubliez pas de sauvegarder vos paramètres après avoir activé ou désactivé le mode maintenance. 
                    Les administrateurs connectés ne seront pas affectés par ce mode.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sauvegarde des données</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Créez une sauvegarde complète de toutes les données de la plateforme
              </p>
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Créer une sauvegarde
              </button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sauvegardes récentes</h4>
              <div className="space-y-2">
                {[
                  { date: '10 Jan 2026, 06:00', size: '245 MB', status: 'success' },
                  { date: '09 Jan 2026, 06:00', size: '243 MB', status: 'success' },
                  { date: '08 Jan 2026, 06:00', size: '241 MB', status: 'success' },
                ].map((backup, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{backup.date}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{backup.size}</p>
                      </div>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-700">Télécharger</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sauvegarde automatique</h4>
              <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activer la sauvegarde automatique quotidienne</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Une sauvegarde sera créée chaque jour à 6h00</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configurez les paramètres de la plateforme
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          <span className="text-green-800 dark:text-green-300">Paramètres enregistrés avec succès</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
          <span className="text-red-800 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des paramètres...</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-l-4 border-l-red-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {tabs.find(t => t.id === activeTab)?.name}
              </h2>
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
