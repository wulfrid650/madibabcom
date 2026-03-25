'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Building2, Shield, CheckCircle, Award } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/company-info';
import { useRedirectIfAuthenticated } from '@/contexts/AuthContext';

export default function InscriptionChoicePage() {
  const { isBlocking } = useRedirectIfAuthenticated();

  if (isBlocking) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Trust Banner */}
      <div className="bg-gradient-to-r from-madiba-red to-red-700 text-white py-3 px-6 rounded-t-2xl flex items-center justify-center gap-3">
        <Shield className="w-5 h-5" />
        <span className="text-sm font-medium">Inscription 100% sécurisée • Données protégées • Entreprise certifiée</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 border-t-0">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-madiba-red rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">MBC</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-madiba-black dark:text-white mb-3">
            Rejoignez {COMPANY_INFO.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Leader de la construction au Cameroun depuis + de 10 ans. Choisissez le type de compte qui vous correspond.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>+50 projets réalisés</span>
            </div>
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>+100 apprenants formés</span>
            </div>
            <div className="flex items-center gap-1.5 text-green-600">
              <Award className="w-4 h-4" />
              <span>Certifié </span>
            </div>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Apprenant Card */}
          <Link
            href="/inscription/apprenant"
            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-madiba-red dark:hover:border-madiba-red transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-madiba-red/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-madiba-red/20 transition-colors">
                <GraduationCap className="w-8 h-8 text-madiba-red" />
              </div>
              <h2 className="text-xl font-bold text-madiba-black dark:text-white mb-2">
                Je suis Apprenant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Je souhaite m'inscrire à une formation professionnelle en BTP
              </p>
              <ul className="text-left text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-madiba-red rounded-full"></span>
                  Accès aux formations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-madiba-red rounded-full"></span>
                  Suivi de progression
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-madiba-red rounded-full"></span>
                  Certificats de formation
                </li>
              </ul>
            </div>
          </Link>

          {/* Client Card */}
          <Link
            href="/inscription/client"
            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-600 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-madiba-black dark:text-white mb-2">
                Je suis Client
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Je souhaite suivre l'avancement de mon projet de construction
              </p>
              <ul className="text-left text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Suivi de chantier en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Photos et rapports d'avancement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Communication avec l'équipe
                </li>
              </ul>
            </div>
          </Link>
        </div>

        {/* Employee Notice */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <span className="font-medium">Vous êtes employé MBC ?</span>{' '}
            Votre compte sera créé par l'administration. Vous recevrez un email pour compléter votre profil.
          </p>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Vous avez déjà un compte ?{' '}
            <Link href="/connexion" className="text-madiba-red hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Footer Security */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span>Connexion SSL sécurisée</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Vos données sont protégées et jamais partagées</span>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            {COMPANY_INFO.fullName} - {COMPANY_INFO.address}
          </p>
        </div>
      </div>
    </div>
  );
}
