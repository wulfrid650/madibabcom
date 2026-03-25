// Informations centralisées de l'entreprise MBC
// À utiliser partout sur le site pour garantir la cohérence

export const COMPANY_INFO = {
  // Identité
  name: 'MBC',
  fullName: 'Madiba Building Construction SARL',
  legalName: 'MBC SARL',
  slogan: 'Ensemble, bâtissons l\'Afrique',
  slogans: {
    main: 'Leader dans la construction et la formation professionnelle au Cameroun.',
    short: 'Ensemble, bâtissons l\'Afrique',
    tagline: 'Votre partenaire construction de confiance',
  },
  shortDescription: 'Entreprise de construction et de formation professionnelle au Cameroun',
  
  // Localisation
  country: 'Cameroun',
  city: 'Douala',
  address: 'IUC Douala, Cameroun',
  regions: ['Douala', 'Yaoundé', 'Bafoussam'],
  
  // Historique
  foundedYear: 2023,
  yearsOfExperience: new Date().getFullYear() - 2023,
  
  // Contact
  phone: '+237 692 65 35 90',
  email: 'contact@madibabc.com',
  whatsapp: '+237692653590',
  
  // Informations légales
  legal: {
    rccm: 'RCCM: DLA/2023/B/XXXXX',
    niu: 'NIU: M012300000000X',
    capital: 'Capital:900 000 FCFA',
  },
  
  // Statistiques
  stats: {
    projectsCompleted: 15,
    employees: 50,
    trainedStudents: 200,
    happyClients: 50,
    regions: 3,
  },
  
  // Descriptions
  descriptions: {
    footer: 'Leader dans la construction et la formation professionnelle au Cameroun. Plus de 3 ans d\'excellence au service de vos projets.',
    about: 'MBC est une entreprise de construction et génie civil engagée dans le développement durable des infrastructures camerounaises.',
    mission: 'Bâtir des infrastructures durables et de qualité, tout en formant une nouvelle génération de professionnels compétents, capables de répondre aux besoins réels du secteur du bâtiment et de la construction en Afrique.',
    vision: 'Devenir une référence africaine dans le bâtiment, la construction et la formation pratique, en contribuant activement au développement des infrastructures modernes, accessibles et durables.',
    history: `Fondée en 2023, MBC (Madiba Building Construction) est née de la vision d'un groupe d'ingénieurs camerounais déterminés à contribuer au développement des infrastructures de leur pays avec des standards internationaux. Au fil des années, nous avons bâti notre réputation sur la qualité de nos réalisations, le respect des délais et notre engagement envers la satisfaction de nos clients.`,
  },
  
  // Offres promotionnelles
  promos: {
    devisReduction: {
      percentage: 10,
      message: 'Bénéficiez de 10% de réduction sur votre devis construction si vous demandez un devis via notre site !',
    },
  },
  
  // Réseaux sociaux (URLs à compléter depuis les settings)
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61558819814101',
    instagram: '',
    linkedin: '',
    twitter: '',
    youtube: '',
    whatsapp: 'https://wa.me/+237692653590',
  },
};

// Fonction helper pour obtenir l'année d'expérience
export function getYearsOfExperience(): number {
  return new Date().getFullYear() - COMPANY_INFO.foundedYear;
}

// Copyright text
export function getCopyrightText(): string {
  return `© ${new Date().getFullYear()} ${COMPANY_INFO.legalName}. Tous droits réservés.`;
}
