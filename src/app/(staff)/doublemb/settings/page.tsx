'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
    Save, 
    Loader2, 
    CreditCard, 
    Key, 
    Building, 
    Phone, 
    Share2, 
    Scale, 
    Search, 
    Wrench, 
    Shield, 
    Mail, 
    BarChart, 
    TrendingUp, 
    Image as ImageIcon,
    GraduationCap
} from 'lucide-react';

// Mapping des icônes par groupe
const GROUP_ICONS: Record<string, React.ElementType> = {
  general: Building,
  contact: Phone,
  social: Share2,
  payment: CreditCard,
  legal: Scale,
  seo: Search,
  maintenance: Wrench,
  security: Shield,
  email: Mail,
  analytics: BarChart,
  stats: TrendingUp,
  hero: ImageIcon,
    formations: GraduationCap,
};

// Labels personnalisés pour les groupes
const GROUP_LABELS: Record<string, string> = {
  general: 'Général',
  contact: 'Contact',
  social: 'Réseaux Sociaux',
  payment: 'Paiements',
  legal: 'Juridique',
  seo: 'SEO',
  maintenance: 'Maintenance',
  security: 'Sécurité',
  email: 'Email',
  analytics: 'Analytique',
  stats: 'Statistiques',
  hero: 'Page d\'accueil',
    formations: 'Formations',
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSettings, setAllSettings] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<string>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAdminSettings();
      setAllSettings(data);
      const emailGroup = Array.isArray(data?.email) ? data.email : [];
      const fromAddress = emailGroup.find((item: any) => item.key === 'mail_from_address')?.value;
      if (typeof fromAddress === 'string' && fromAddress.trim() !== '') {
        setTestEmailRecipient(fromAddress);
      }
      // Sélectionner le premier groupe par défaut si 'general' n'existe pas
      if (data && !data.general) {
        const firstGroup = Object.keys(data)[0];
        if (firstGroup) setActiveTab(firstGroup);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setMessage({ type: 'error', text: 'Impossible de charger les paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
        // Collecter tous les paramètres modifiés du groupe actif
        const currentGroupSettings = allSettings[activeTab] || [];

        if (activeTab === 'formations') {
            const currentValues: Record<string, any> = {};
            currentGroupSettings.forEach(item => {
                currentValues[item.key] = item.value;
            });

            const autoEnabled = currentValues['formation_sessions_auto_enabled'] === true || currentValues['formation_sessions_auto_enabled'] === '1';
            const startDate = (currentValues['formation_sessions_start_date'] as string) || '';
            const interval = parseInt((currentValues['formation_sessions_interval_months'] as string) || '', 10);
            const monthsAhead = parseInt((currentValues['formation_sessions_months_ahead'] as string) || '', 10);

            if (autoEnabled) {
                if (!startDate) {
                    setMessage({ type: 'error', text: 'Merci de renseigner une première date de session (AAAA-MM-JJ).' });
                    setSaving(false);
                    return;
                }

                if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                    setMessage({ type: 'error', text: 'Le format de la date doit être AAAA-MM-JJ.' });
                    setSaving(false);
                    return;
                }
            }

            if (Number.isNaN(interval) || interval < 1) {
                setMessage({ type: 'error', text: 'L\'intervalle doit être un nombre positif (en mois).' });
                setSaving(false);
                return;
            }

            if (Number.isNaN(monthsAhead) || monthsAhead < 1) {
                setMessage({ type: 'error', text: 'Le nombre de mois de planification doit être supérieur à zéro.' });
                setSaving(false);
                return;
            }
        }

        const batch = currentGroupSettings.map(item => ({
            key: item.key,
            value: item.value
        }));

        const success = await api.updateSettingsBatch(batch);
        
        if (success) {
            setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
        } else {
             setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
        }
    } catch (error) {
        setMessage({ type: 'error', text: 'Erreur technique lors de l\'enregistrement' });
    } finally {
        setSaving(false);
    }
  };

  const updateSetting = (group: string, key: string, value: any) => {
      setAllSettings(prev => {
          const groupSettings = [...(prev[group] || [])];
          const settingIndex = groupSettings.findIndex(s => s.key === key);
          
          if (settingIndex !== -1) {
              groupSettings[settingIndex] = { ...groupSettings[settingIndex], value };
          }
          
          return {
              ...prev,
              [group]: groupSettings
          };
      });
  };

  const handleSendTestEmail = async () => {
      setTestingEmail(true);
      setMessage(null);

      try {
          const emailGroup = Array.isArray(allSettings.email) ? allSettings.email : [];
          const getValue = (key: string) => emailGroup.find((item: any) => item.key === key)?.value;

          const response = await api.sendTestEmail({
              recipient: testEmailRecipient || getValue('mail_from_address') || undefined,
              mail_mailer: getValue('mail_mailer') || 'smtp',
              mail_host: getValue('mail_host') || '',
              mail_port: Number(getValue('mail_port') || 587),
              mail_username: getValue('mail_username') || '',
              mail_password: getValue('mail_password') || '',
              mail_encryption: getValue('mail_encryption') || '',
              mail_from_address: getValue('mail_from_address') || '',
              mail_from_name: getValue('mail_from_name') || '',
          });

          if (response.success) {
              setMessage({ type: 'success', text: response.message || 'Email de test envoye avec succes.' });
          } else {
              setMessage({ type: 'error', text: response.message || 'Echec lors de l\'envoi de l\'email de test.' });
          }
      } catch (error) {
          setMessage({ type: 'error', text: 'Erreur technique lors de l\'envoi de l\'email de test.' });
          console.error('Test email error:', error);
      } finally {
          setTestingEmail(false);
      }
  };

  const renderField = (setting: any) => {
      switch(setting.type) {
          case 'boolean':
              return (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex-1 pr-4">
                          <label className="font-medium text-gray-900 dark:text-white block">
                              {setting.label}
                          </label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                          </p>
                      </div>
                      <button
                          type="button"
                          onClick={() => updateSetting(activeTab, setting.key, !setting.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-madiba-red focus:ring-offset-2 ${setting.value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                      >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${setting.value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                  </div>
              );
          
          case 'textarea':
              return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <textarea
                          value={setting.value || ''}
                          onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white min-h-[100px]"
                          placeholder={setting.description}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                  </div>
              );

          case 'select':
               // Note: Pour les selects, on pourrait avoir besoin de définir les options possibles quelque part
               // Pour l'instant on traite comme texte ou cas spécifiques
               if (setting.key === 'moneroo_currency') {
                   return (
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                               {setting.label}
                           </label>
                           <select
                               value={setting.value || 'XAF'}
                               onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                               className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                           >
                               <option value="XAF">XAF (FCFA Afrique Centrale)</option>
                               <option value="XOF">XOF (FCFA Afrique de l'Ouest)</option>
                               <option value="USD">USD (Dollar US)</option>
                               <option value="EUR">EUR (Euro)</option>
                           </select>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                       </div>
                   );
               }
               // Fallback default select handling or text input
               return (
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                           {setting.label}
                       </label>
                       <input
                           type="text"
                           value={setting.value || ''}
                           onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                           className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                       />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description} (Select)</p>
                   </div>
               );

          case 'password':
              return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <div className="relative">
                          <input
                              type="text"
                              value={setting.value || ''}
                              onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white font-mono"
                              placeholder="••••••••••••••••"
                          />
                          <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                  </div>
              );

          case 'image':
              return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <div className="flex gap-4 items-start">
                          {setting.value && (
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                      src={setting.value} 
                                      alt={setting.label}
                                      className="w-full h-full object-contain" 
                                      onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                  />
                              </div>
                          )}
                          <div className="flex-1">
                              <input
                                  type="text"
                                  value={setting.value || ''}
                                  onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                                  placeholder="URL ou chemin de l'image (/images/...)"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                          </div>
                      </div>
                  </div>
              );
          
          case 'json':
               // Pour l'instant on affiche en textarea, pourrait être amélioré avec un éditeur JSON ou des tags
               return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <textarea
                          value={JSON.stringify(setting.value, null, 2)}
                          readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-500 font-mono text-sm min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description} (Lecture seule)</p>
                  </div>
              );

          case 'text': {
              const isDateField = setting.key === 'formation_sessions_start_date';
              const isIntervalField = setting.key === 'formation_sessions_interval_months';
              const isMonthsAheadField = setting.key === 'formation_sessions_months_ahead';
              const inputType = isDateField ? 'date' : (isIntervalField || isMonthsAheadField ? 'number' : 'text');
              const inputValue = setting.value || '';

              return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <input
                          type={inputType}
                          value={inputValue}
                          onChange={(e) => {
                              let value: string = e.target.value;

                              if ((isIntervalField || isMonthsAheadField) && value !== '') {
                                  const parsed = Math.max(1, parseInt(value, 10) || 1);
                                  value = parsed.toString();
                              }

                              updateSetting(activeTab, setting.key, value);
                          }}
                          min={isIntervalField || isMonthsAheadField ? 1 : undefined}
                          step={isIntervalField || isMonthsAheadField ? 1 : undefined}
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                          placeholder={setting.description}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                  </div>
              );
          }

          default:
              return (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                          {setting.label}
                      </label>
                      <input
                          type="text"
                          value={setting.value || ''}
                          onChange={(e) => updateSetting(activeTab, setting.key, e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                  </div>
              );
      }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-madiba-red" />
          </div>
      );
  }

  const groups = Object.keys(allSettings).sort((a, b) => {
      // payment en premier si présent, ensuite alpha
      if (a === 'payment') return -1;
      if (b === 'payment') return 1;
      return a.localeCompare(b);
  });

  return (
      <div className="p-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            <Building className="w-6 h-6" />
            Configuration du Système
          </h1>

          {message && (
              <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {message.text}
              </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                  {groups.map(group => {
                      const Icon = GROUP_ICONS[group] || Building;
                      return (
                          <button
                              key={group}
                              onClick={() => {
                                  setActiveTab(group);
                                  setMessage(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                  activeTab === group 
                                      ? 'bg-madiba-red text-white shadow-md' 
                                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                          >
                              <Icon className="w-4 h-4" />
                              <span className="capitalize">{GROUP_LABELS[group] || group}</span>
                          </button>
                      );
                  })}
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                  <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                {GROUP_LABELS[activeTab] || activeTab}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gérer les paramètres de la section {GROUP_LABELS[activeTab]?.toLowerCase() || activeTab}
                            </p>
                          </div>
                          
                          <button
                              type="submit"
                              disabled={saving}
                              className="bg-madiba-red text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                          >
                              {saving ? (
                                  <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Enregistrement...
                                  </>
                              ) : (
                                  <>
                                      <Save className="w-4 h-4" />
                                      Enregistrer
                                  </>
                              )}
                          </button>
                      </div>

                      <div className="space-y-6">
                          {activeTab === 'formations' && (
                              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-200">
                                  Activez la génération automatique pour créer des sessions à partir de la date de référence. Les mises à jour appliquent immédiatement la planification côté serveur.
                              </div>
                          )}

                          {activeTab === 'email' && (
                              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                      Envoyer un email de test
                                  </p>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                      Teste la configuration email actuelle, meme avant enregistrement.
                                  </p>

                                  <div className="mt-3 flex flex-col md:flex-row gap-3">
                                      <input
                                          type="email"
                                          value={testEmailRecipient}
                                          onChange={(e) => setTestEmailRecipient(e.target.value)}
                                          placeholder="destinataire@example.com"
                                          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-madiba-red outline-none dark:text-white"
                                      />
                                      <button
                                          type="button"
                                          onClick={handleSendTestEmail}
                                          disabled={testingEmail}
                                          className="px-4 py-2 rounded-lg border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                                      >
                                          {testingEmail ? (
                                              <>
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                  Envoi...
                                              </>
                                          ) : (
                                              'Envoyer email de test'
                                          )}
                                      </button>
                                  </div>
                              </div>
                          )}

                          {allSettings[activeTab]?.map((setting: any) => (
                              <div key={setting.key}>
                                  {renderField(setting)}
                              </div>
                          ))}
                          
                          {(!allSettings[activeTab] || allSettings[activeTab].length === 0) && (
                              <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                                  Aucun paramètre dans cette section.
                              </p>
                          )}
                      </div>
                  </form>
              </div>
          </div>
      </div>
  );
}
