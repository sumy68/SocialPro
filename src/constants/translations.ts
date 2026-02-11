export type Language = 'de' | 'en' | 'es' | 'tr';

type TranslationKey = 
  | 'welcome'
  | 'getStarted'
  | 'dashboard'
  | 'create'
  | 'calendar'
  | 'settings'
  | 'profile'
  | 'subscription'
  | 'logout'
  | 'language'
  | 'connectedPlatforms'
  | 'notConnected'
  | 'connect'
  | 'disconnect'
  | 'post'
  | 'reel'
  | 'schedule'
  | 'autoPost'
  | 'platforms'
  | 'selectPlatforms'
  | 'caption'
  | 'hashtags'
  | 'uploadMedia'
  | 'fromGallery'
  | 'files'
  | 'aiGenerator'
  | 'generateCaption'
  | 'generating'
  | 'saveAsDraft'
  | 'planAndPost'
  | 'overview'
  | 'totalFollowers'
  | 'engagementRate'
  | 'postsThisWeek'
  | 'reach'
  | 'weeklyReview'
  | 'thisWeek'
  | 'totalReach'
  | 'totalInteractions'
  | 'newFollowers'
  | 'bestPlatform'
  | 'topInsights'
  | 'recommendations'
  | 'reachDetails'
  | 'organicReach'
  | 'paidReach'
  | 'viralReach'
  | 'storyReach'
  | 'engagementDetails'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves';

type Translations = {
  [key in TranslationKey]: {
    de: string;
    en: string;
    es: string;
    tr: string;
  };
};

export const translations: Translations = {
  welcome: {
    de: 'Willkommen',
    en: 'Welcome',
    es: 'Bienvenido',
    tr: 'Hoş geldiniz',
  },
  getStarted: {
    de: 'Los geht\'s',
    en: 'Get Started',
    es: 'Empezar',
    tr: 'Başlayalım',
  },
  dashboard: {
    de: 'Dashboard',
    en: 'Dashboard',
    es: 'Panel',
    tr: 'Panel',
  },
  create: {
    de: 'Erstellen',
    en: 'Create',
    es: 'Crear',
    tr: 'Oluştur',
  },
  calendar: {
    de: 'Kalender',
    en: 'Calendar',
    es: 'Calendario',
    tr: 'Takvim',
  },
  settings: {
    de: 'Einstellungen',
    en: 'Settings',
    es: 'Configuración',
    tr: 'Ayarlar',
  },
  profile: {
    de: 'Profil',
    en: 'Profile',
    es: 'Perfil',
    tr: 'Profil',
  },
  subscription: {
    de: 'Abonnement',
    en: 'Subscription',
    es: 'Suscripción',
    tr: 'Abonelik',
  },
  logout: {
    de: 'Abmelden',
    en: 'Logout',
    es: 'Cerrar sesión',
    tr: 'Çıkış yap',
  },
  language: {
    de: 'Sprache',
    en: 'Language',
    es: 'Idioma',
    tr: 'Dil',
  },
  connectedPlatforms: {
    de: 'Verbundene Plattformen',
    en: 'Connected Platforms',
    es: 'Plataformas conectadas',
    tr: 'Bağlı platformlar',
  },
  notConnected: {
    de: 'Nicht verbunden',
    en: 'Not connected',
    es: 'No conectado',
    tr: 'Bağlı değil',
  },
  connect: {
    de: 'Verbinden',
    en: 'Connect',
    es: 'Conectar',
    tr: 'Bağlan',
  },
  disconnect: {
    de: 'Trennen',
    en: 'Disconnect',
    es: 'Desconectar',
    tr: 'Bağlantıyı kes',
  },
  post: {
    de: 'Post',
    en: 'Post',
    es: 'Publicación',
    tr: 'Gönderi',
  },
  reel: {
    de: 'Reel',
    en: 'Reel',
    es: 'Reel',
    tr: 'Reel',
  },
  schedule: {
    de: 'Planen',
    en: 'Schedule',
    es: 'Programar',
    tr: 'Planla',
  },
  autoPost: {
    de: 'Automatisch posten',
    en: 'Auto post',
    es: 'Publicar automáticamente',
    tr: 'Otomatik gönder',
  },
  platforms: {
    de: 'Plattformen',
    en: 'Platforms',
    es: 'Plataformas',
    tr: 'Platformlar',
  },
  selectPlatforms: {
    de: 'Plattformen auswählen',
    en: 'Select platforms',
    es: 'Seleccionar plataformas',
    tr: 'Platform seç',
  },
  caption: {
    de: 'Caption',
    en: 'Caption',
    es: 'Descripción',
    tr: 'Açıklama',
  },
  hashtags: {
    de: 'Hashtags',
    en: 'Hashtags',
    es: 'Hashtags',
    tr: 'Hashtag\'ler',
  },
  uploadMedia: {
    de: 'Medien hochladen',
    en: 'Upload media',
    es: 'Subir medios',
    tr: 'Medya yükle',
  },
  fromGallery: {
    de: 'Aus Galerie',
    en: 'From gallery',
    es: 'Desde galería',
    tr: 'Galeriden',
  },
  files: {
    de: 'Dateien',
    en: 'Files',
    es: 'Archivos',
    tr: 'Dosyalar',
  },
  aiGenerator: {
    de: 'KI Content Generator',
    en: 'AI Content Generator',
    es: 'Generador de contenido IA',
    tr: 'Yapay Zeka İçerik Oluşturucu',
  },
  generateCaption: {
    de: 'Caption generieren',
    en: 'Generate caption',
    es: 'Generar descripción',
    tr: 'Açıklama oluştur',
  },
  generating: {
    de: 'Generiere...',
    en: 'Generating...',
    es: 'Generando...',
    tr: 'Oluşturuluyor...',
  },
  saveAsDraft: {
    de: 'Als Entwurf speichern',
    en: 'Save as draft',
    es: 'Guardar como borrador',
    tr: 'Taslak olarak kaydet',
  },
  planAndPost: {
    de: 'Planen & Posten',
    en: 'Plan & Post',
    es: 'Planificar y publicar',
    tr: 'Planla ve gönder',
  },
  overview: {
    de: 'Übersicht',
    en: 'Overview',
    es: 'Resumen',
    tr: 'Genel bakış',
  },
  totalFollowers: {
    de: 'Gesamte Follower',
    en: 'Total followers',
    es: 'Seguidores totales',
    tr: 'Toplam takipçi',
  },
  engagementRate: {
    de: 'Engagement-Rate',
    en: 'Engagement rate',
    es: 'Tasa de interacción',
    tr: 'Etkileşim oranı',
  },
  postsThisWeek: {
    de: 'Posts diese Woche',
    en: 'Posts this week',
    es: 'Publicaciones esta semana',
    tr: 'Bu hafta gönderiler',
  },
  reach: {
    de: 'Reichweite',
    en: 'Reach',
    es: 'Alcance',
    tr: 'Erişim',
  },
  weeklyReview: {
    de: 'Wochenrückblick',
    en: 'Weekly review',
    es: 'Resumen semanal',
    tr: 'Haftalık özet',
  },
  thisWeek: {
    de: 'Diese Woche',
    en: 'This week',
    es: 'Esta semana',
    tr: 'Bu hafta',
  },
  totalReach: {
    de: 'Gesamtreichweite',
    en: 'Total reach',
    es: 'Alcance total',
    tr: 'Toplam erişim',
  },
  totalInteractions: {
    de: 'Gesamte Interaktionen',
    en: 'Total interactions',
    es: 'Interacciones totales',
    tr: 'Toplam etkileşim',
  },
  newFollowers: {
    de: 'Neue Follower',
    en: 'New followers',
    es: 'Nuevos seguidores',
    tr: 'Yeni takipçiler',
  },
  bestPlatform: {
    de: 'Beste Plattform',
    en: 'Best platform',
    es: 'Mejor plataforma',
    tr: 'En iyi platform',
  },
  topInsights: {
    de: 'Wichtigste Erkenntnisse',
    en: 'Top insights',
    es: 'Principales perspectivas',
    tr: 'Önemli bilgiler',
  },
  recommendations: {
    de: 'Empfehlungen',
    en: 'Recommendations',
    es: 'Recomendaciones',
    tr: 'Öneriler',
  },
  reachDetails: {
    de: 'Reichweite im Detail',
    en: 'Reach details',
    es: 'Detalles de alcance',
    tr: 'Erişim detayları',
  },
  organicReach: {
    de: 'Organische Reichweite',
    en: 'Organic reach',
    es: 'Alcance orgánico',
    tr: 'Organik erişim',
  },
  paidReach: {
    de: 'Bezahlte Reichweite',
    en: 'Paid reach',
    es: 'Alcance pagado',
    tr: 'Ücretli erişim',
  },
  viralReach: {
    de: 'Virale Reichweite',
    en: 'Viral reach',
    es: 'Alcance viral',
    tr: 'Viral erişim',
  },
  storyReach: {
    de: 'Story-Reichweite',
    en: 'Story reach',
    es: 'Alcance de historias',
    tr: 'Hikaye erişimi',
  },
  engagementDetails: {
    de: 'Engagement-Details',
    en: 'Engagement details',
    es: 'Detalles de interacción',
    tr: 'Etkileşim detayları',
  },
  likes: {
    de: 'Likes',
    en: 'Likes',
    es: 'Me gusta',
    tr: 'Beğeniler',
  },
  comments: {
    de: 'Kommentare',
    en: 'Comments',
    es: 'Comentarios',
    tr: 'Yorumlar',
  },
  shares: {
    de: 'Shares',
    en: 'Shares',
    es: 'Compartidos',
    tr: 'Paylaşımlar',
  },
  saves: {
    de: 'Speichern',
    en: 'Saves',
    es: 'Guardados',
    tr: 'Kaydetmeler',
  },
};

export const t = (key: TranslationKey, lang: Language): string => {
  return translations[key][lang] || translations[key]['en'];
};

// ✅ ONBOARDING TRANSLATIONS
export const onboardingTranslations = {
  de: {
    welcome: {
      title: 'Willkommen bei SocialPro',
      subtitle: 'Deine All-in-One Social Media Management Plattform',
      getStarted: 'Los geht\'s',
    },
    companyInfo: {
      accountTypeTitle: 'Wähle deinen Account-Typ',
      accountTypeSubtitle: 'Wähle den Typ, der am besten zu dir passt',
      business: 'Unternehmen',
      businessDesc: 'Für Unternehmen und Marken',
      creator: 'Creator',
      creatorDesc: 'Für Content Creators und Influencer',
      both: 'Beides',
      bothDesc: 'Für beide Zwecke',
      continue: 'Weiter',
      profileTitle: 'Vervollständige dein Profil',
      profileSubtitle: 'Hilf uns, personalisierte Empfehlungen zu erstellen',
      name: 'Name',
      namePlaceholder: 'Dein Name',
      industry: 'Branche',
      industryPlaceholder: 'z.B. Mode, Technologie, Food',
      niche: 'Nische',
      nichePlaceholder: 'z.B. Reisen, Fitness, Beauty',
      targetAudience: 'Zielgruppe',
      targetAudiencePlaceholder: 'z.B. 18-35, Frauen, Urban',
      contentGoals: 'Content-Ziele',
      contentGoalsPlaceholder: 'z.B. Mehr Engagement, Follower-Wachstum',
      complete: 'Abschließen',
    },
    platforms: {
      title: 'Plattformen verbinden',
      subtitle: 'Verbinde deine Social Media Accounts',
      skip: 'Überspringen',
      connectNow: 'Jetzt verbinden',
    },
  },
  en: {
    welcome: {
      title: 'Welcome to SocialPro',
      subtitle: 'Your All-in-One Social Media Management Platform',
      getStarted: 'Get Started',
    },
    companyInfo: {
      accountTypeTitle: 'Choose Your Account Type',
      accountTypeSubtitle: 'Select the type that best fits you',
      business: 'Business',
      businessDesc: 'For companies and brands',
      creator: 'Creator',
      creatorDesc: 'For content creators and influencers',
      both: 'Both',
      bothDesc: 'For both purposes',
      continue: 'Continue',
      profileTitle: 'Complete Your Profile',
      profileSubtitle: 'Help us create personalized recommendations',
      name: 'Name',
      namePlaceholder: 'Your name',
      industry: 'Industry',
      industryPlaceholder: 'e.g. Fashion, Technology, Food',
      niche: 'Niche',
      nichePlaceholder: 'e.g. Travel, Fitness, Beauty',
      targetAudience: 'Target Audience',
      targetAudiencePlaceholder: 'e.g. 18-35, Women, Urban',
      contentGoals: 'Content Goals',
      contentGoalsPlaceholder: 'e.g. More engagement, Follower growth',
      complete: 'Complete',
    },
    platforms: {
      title: 'Connect Platforms',
      subtitle: 'Connect your social media accounts',
      skip: 'Skip',
      connectNow: 'Connect Now',
    },
  },
  es: {
    welcome: {
      title: 'Bienvenido a SocialPro',
      subtitle: 'Tu plataforma todo en uno de gestión de redes sociales',
      getStarted: 'Empezar',
    },
    companyInfo: {
      accountTypeTitle: 'Elige tu tipo de cuenta',
      accountTypeSubtitle: 'Selecciona el tipo que mejor se adapte a ti',
      business: 'Empresa',
      businessDesc: 'Para empresas y marcas',
      creator: 'Creador',
      creatorDesc: 'Para creadores de contenido e influencers',
      both: 'Ambos',
      bothDesc: 'Para ambos propósitos',
      continue: 'Continuar',
      profileTitle: 'Completa tu perfil',
      profileSubtitle: 'Ayúdanos a crear recomendaciones personalizadas',
      name: 'Nombre',
      namePlaceholder: 'Tu nombre',
      industry: 'Industria',
      industryPlaceholder: 'ej. Moda, Tecnología, Comida',
      niche: 'Nicho',
      nichePlaceholder: 'ej. Viajes, Fitness, Belleza',
      targetAudience: 'Audiencia objetivo',
      targetAudiencePlaceholder: 'ej. 18-35, Mujeres, Urbano',
      contentGoals: 'Objetivos de contenido',
      contentGoalsPlaceholder: 'ej. Más engagement, Crecimiento de seguidores',
      complete: 'Completar',
    },
    platforms: {
      title: 'Conectar plataformas',
      subtitle: 'Conecta tus cuentas de redes sociales',
      skip: 'Saltar',
      connectNow: 'Conectar ahora',
    },
  },
  tr: {
    welcome: {
      title: 'SocialPro\'ya Hoş Geldiniz',
      subtitle: 'Hepsi Bir Arada Sosyal Medya Yönetim Platformu',
      getStarted: 'Başlayalım',
    },
    companyInfo: {
      accountTypeTitle: 'Hesap Türünü Seç',
      accountTypeSubtitle: 'Size en uygun türü seçin',
      business: 'İşletme',
      businessDesc: 'Şirketler ve markalar için',
      creator: 'İçerik Üreticisi',
      creatorDesc: 'İçerik üreticileri ve influencer\'lar için',
      both: 'Her İkisi',
      bothDesc: 'Her iki amaç için',
      continue: 'Devam Et',
      profileTitle: 'Profilini Tamamla',
      profileSubtitle: 'Kişiselleştirilmiş öneriler oluşturmamıza yardımcı ol',
      name: 'İsim',
      namePlaceholder: 'Adınız',
      industry: 'Sektör',
      industryPlaceholder: 'örn. Moda, Teknoloji, Yemek',
      niche: 'Niş',
      nichePlaceholder: 'örn. Seyahat, Fitness, Güzellik',
      targetAudience: 'Hedef Kitle',
      targetAudiencePlaceholder: 'örn. 18-35, Kadınlar, Şehir',
      contentGoals: 'İçerik Hedefleri',
      contentGoalsPlaceholder: 'örn. Daha fazla etkileşim, Takipçi artışı',
      complete: 'Tamamla',
    },
    platforms: {
      title: 'Platformları Bağla',
      subtitle: 'Sosyal medya hesaplarınızı bağlayın',
      skip: 'Atla',
      connectNow: 'Şimdi Bağla',
    },
  },
};

// ✅ PLATFORM NAMES für connect-platforms screen
export const platformNames = {
  de: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
  en: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
  es: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
  tr: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
};

// ✅ SETTINGS TRANSLATIONS
export const settingsTranslations = {
  de: {
    title: 'Einstellungen',
    profile: 'Profil',
    accountType: 'Account-Typ',
    connectedPlatforms: 'Verbundene Plattformen',
    language: 'Sprache',
    subscription: 'Abonnement',
    privacy: 'Datenschutz',
    help: 'Hilfe',
    logout: 'Abmelden',
  },
  en: {
    title: 'Settings',
    profile: 'Profile',
    accountType: 'Account Type',
    connectedPlatforms: 'Connected Platforms',
    language: 'Language',
    subscription: 'Subscription',
    privacy: 'Privacy',
    help: 'Help',
    logout: 'Logout',
  },
  es: {
    title: 'Configuración',
    profile: 'Perfil',
    accountType: 'Tipo de cuenta',
    connectedPlatforms: 'Plataformas conectadas',
    language: 'Idioma',
    subscription: 'Suscripción',
    privacy: 'Privacidad',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
  },
  tr: {
    title: 'Ayarlar',
    profile: 'Profil',
    accountType: 'Hesap Türü',
    connectedPlatforms: 'Bağlı Platformlar',
    language: 'Dil',
    subscription: 'Abonelik',
    privacy: 'Gizlilik',
    help: 'Yardım',
    logout: 'Çıkış',
  },
};
