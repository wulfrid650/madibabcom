"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ValidationError } from '@/lib/api';
import { useReCaptcha, ReCaptchaBadge } from '@/components/security/ReCaptcha';

const projectTypes = [
  { value: '', label: 'Type de projet' },
  { value: 'construction', label: 'Construction neuve' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'architecture', label: 'Étude architecturale' },
  { value: 'genie-civil', label: 'Génie civil' },
  { value: 'formation', label: 'Formation' },
  { value: 'autre', label: 'Autre' },
];

const contactInfo = {
  address: 'Douala – Cameroun',
  addressDetail: 'Entrée principale IUC Logbesou',
  phones: ['+237 692 65 35 90', '+237 676 94 91 03'],
  email: 'contact@madibabc.com',
};

function ContactPageContent() {
  const searchParams = useSearchParams();
  const formationParam = searchParams.get('formation');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    projectType: formationParam ? 'formation' : '',
    location: '',
    locationMethod: 'manual', // 'manual' | 'auto' | 'coordinates'
    coordinates: { lat: '', lng: '' },
    budget: '',
    description: formationParam ? `Je souhaite m'inscrire à la ${formationParam}.` : '',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const { isEnabled, protectedForms, executeRecaptcha } = useReCaptcha();
  const requiresRecaptcha = isEnabled && protectedForms.includes('contact');

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle coordinate changes
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      coordinates: { ...prev.coordinates, [name]: value }
    }));
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setFormData(prev => ({
            ...prev,
            location: address,
            locationMethod: 'auto',
            coordinates: { lat: latitude.toString(), lng: longitude.toString() }
          }));
        } catch {
          // Fallback to coordinates only
          setFormData(prev => ({
            ...prev,
            location: `Coordonnées: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            locationMethod: 'auto',
            coordinates: { lat: latitude.toString(), lng: longitude.toString() }
          }));
        }
        
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Vous avez refusé l\'accès à votre position.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Impossible de déterminer votre position.');
            break;
          case error.TIMEOUT:
            setLocationError('La demande de localisation a expiré.');
            break;
          default:
            setLocationError('Une erreur est survenue lors de la localisation.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    // Prepare location data
    let locationData = formData.location;
    if (formData.locationMethod === 'coordinates' && formData.coordinates.lat && formData.coordinates.lng) {
      locationData = `Coordonnées GPS: ${formData.coordinates.lat}, ${formData.coordinates.lng}`;
    }

    try {
      let recaptchaToken: string | null = null;
      if (requiresRecaptcha) {
        recaptchaToken = await executeRecaptcha('contact');
        if (!recaptchaToken) {
          setSubmitStatus('error');
          setSubmitError('Vérification reCAPTCHA impossible. Veuillez réessayer.');
          setIsSubmitting(false);
          return;
        }
      }

      const projectLabel = projectTypes.find((type) => type.value === formData.projectType)?.label;
      const subject = projectLabel ? `Demande de devis - ${projectLabel}` : 'Demande de devis';
      const messageParts = [
        formData.description ? `Description: ${formData.description}` : null,
        locationData ? `Localisation: ${locationData}` : null,
        formData.budget ? `Budget estimatif: ${formData.budget}` : null,
      ].filter(Boolean);

      await api.submitContact({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject,
        service_type: formData.projectType || undefined,
        message: messageParts.join('\n'),
        ...(recaptchaToken ? { recaptcha_token: recaptchaToken, recaptcha_action: 'contact' } : {}),
      });
      
      setSubmitStatus('success');
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        projectType: '',
        location: '',
        locationMethod: 'manual',
        coordinates: { lat: '', lng: '' },
        budget: '',
        description: '',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        setSubmitError(error.getAllErrors()[0] || error.message);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Une erreur est survenue.');
      }
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-black">
      {/* Hero Section */}
      <div className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-madiba-black dark:text-white mb-4">
            Demande de <span className="text-madiba-red">devis</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
            Décrivez votre projet et notre équipe vous contactera dans les plus brefs délais.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-6 py-4 rounded-xl">
                    <p className="font-semibold">✓ Votre demande a été envoyée avec succès !</p>
                    <p className="text-sm mt-1">Notre équipe vous contactera sous 24-48h.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl">
                    <p className="font-semibold">Une erreur est survenue.</p>
                    <p className="text-sm mt-1">{submitError || 'Veuillez réessayer ou nous contacter directement.'}</p>
                  </div>
                )}

                {/* Row 1: Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Row 2: Email */}
                <div>
                  <label htmlFor="email" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>

                {/* Row 3: Project Type & Location Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="projectType" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                      Type de projet
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      required
                      className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                    >
                      {projectTypes.map(type => (
                        <option key={type.value} value={type.value} className="bg-white dark:bg-gray-800">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                      Méthode de localisation
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, locationMethod: 'manual' }))}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          formData.locationMethod === 'manual'
                            ? 'bg-madiba-red text-white'
                            : 'bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        📝 Description
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, locationMethod: 'coordinates' }))}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          formData.locationMethod === 'coordinates'
                            ? 'bg-madiba-red text-white'
                            : 'bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        📍 Coordonnées
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location Field - Dynamic based on method */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-madiba-black dark:text-white text-sm font-medium">
                      Localisation du chantier
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isLocating}
                      className="text-sm text-madiba-red hover:text-red-400 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Localisation en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Me localiser automatiquement
                        </>
                      )}
                    </button>
                  </div>

                  {locationError && (
                    <p className="text-amber-400 text-sm flex items-center gap-2">
                      <span>⚠️</span> {locationError}
                    </p>
                  )}

                  {formData.locationMethod === 'coordinates' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lat" className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                          Latitude
                        </label>
                        <input
                          type="text"
                          id="lat"
                          name="lat"
                          value={formData.coordinates.lat}
                          onChange={handleCoordinateChange}
                          className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                          placeholder="Ex: 4.0511"
                        />
                      </div>
                      <div>
                        <label htmlFor="lng" className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                          Longitude
                        </label>
                        <input
                          type="text"
                          id="lng"
                          name="lng"
                          value={formData.coordinates.lng}
                          onChange={handleCoordinateChange}
                          className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                          placeholder="Ex: 9.7679"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                      placeholder="Ex: Quartier Bonamoussadi, près du carrefour Ange Raphael, Douala"
                    />
                  )}

                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                    💡 Conseil : Si vous êtes sur le terrain, utilisez la localisation automatique pour plus de précision.
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <label htmlFor="budget" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                    Budget estimatif <span className="text-gray-500 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors"
                    placeholder="Ex: 50 000 000 FCFA"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-madiba-black dark:text-white text-sm font-medium mb-2">
                    Décrivez votre projet
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-madiba-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-madiba-red focus:ring-1 focus:ring-madiba-red transition-colors resize-none"
                    placeholder="Décrivez votre projet en quelques lignes : type de construction, superficie, nombre d'étages, contraintes particulières..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-madiba-red hover:bg-red-700 disabled:bg-gray-600 text-white px-10 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    'Demander un devis'
                  )}
                </button>
                <ReCaptchaBadge formType="contact" />
              </form>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 sticky top-32">
                {/* Address */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-10 h-10 bg-madiba-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-madiba-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-madiba-black dark:text-white font-bold text-lg mb-1">Adresse</h3>
                    <p className="text-gray-600 dark:text-gray-400">{contactInfo.address}</p>
                    <p className="text-gray-500 text-sm">{contactInfo.addressDetail}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-10 h-10 bg-madiba-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-madiba-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-madiba-black dark:text-white font-bold text-lg mb-1">Téléphone</h3>
                    {contactInfo.phones.map((phone, index) => (
                      <a 
                        key={index}
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        className="block text-gray-600 dark:text-gray-400 hover:text-madiba-red transition-colors"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-madiba-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-madiba-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-madiba-black dark:text-white font-bold text-lg mb-1">Email</h3>
                    <a 
                      href={`mailto:${contactInfo.email}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-madiba-red transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-300 dark:border-gray-700 my-8" />

                {/* Quick Response Badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Réponse sous 24-48h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div></div>}>
      <ContactPageContent />
    </Suspense>
  );
}
