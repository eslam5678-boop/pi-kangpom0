// Farm game i18n localization system
export type Language = "ar" | "en" | "zh" | "fr" | "es"

export const LANGUAGES: Record<Language, string> = {
  ar: "العربية",
  en: "English",
  zh: "中文",
  fr: "Français",
  es: "Español",
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ar: {
    // Onboarding
    onboarding_welcome_title: "مرحباً بك في مزرعة باي الفرعونية",
    onboarding_welcome_desc: "استعد لرحلة ملكية في عالم الزراعة الفرعوني!",
    onboarding_assets_title: "أصولك الأولى",
    onboarding_assets_desc: "لقد حصلت على 3 دجاجات مجانية! اطعمها وجمع المحاصيل.",
    onboarding_vitality_title: "نظام الحيوية",
    onboarding_vitality_desc: "احذر! إذا لم تطعم أصولك خلال 24 ساعة، ستمرض!",
    onboarding_expansion_title: "توسيع الأراضي",
    onboarding_expansion_desc: "استأجر أراضي جديدة من ديوان الأراضي لزراعة المزيد.",
    onboarding_next: "التالي",
    onboarding_start: "ابدأ اللعبة",
    
    // Game UI
    balance: "الرصيد",
    stamina: "الطاقة",
    level: "المستوى",
    health: "الحيوية",
    feed_all: "إطعام الكل",
    collect_all: "تحصيل الكل",
    drag_drop_hint: "اسحب الحبوب إلى الدجاج لإطعامه",
    
    // Vitality warnings
    health_warning_low: "⚠️ حيوية منخفضة! اطعم أصولك الآن.",
    health_warning_critical: "🚨 حالة حرجة! قد تمرض أصولك قريباً.",
    
    // Menu
    language_settings: "إعدادات اللغة",
    help: "المساعدة",
    about: "حول اللعبة",
    
    // Daily Tasks
    tasks_title: "المهام اليومية",
    tasks_xp: "نقاط التجربة",
    task_feed_title: "أطعم الدجاج",
    task_feed_desc: "أطعم 3 دجاجات لزيادة إنتاجيتهم",
    task_harvest_title: "اجمع المحصول",
    task_harvest_desc: "اجمع محصول واحد من أصولك",
    task_kitchen_title: "زر المطبخ",
    task_kitchen_desc: "افتح المطبخ الملكي",
    task_complete_reward: "تم الإنجاز! +{xp} XP و +{coins} عملة",
    task_completed: "مكتمل",
  },
  en: {
    // Onboarding
    onboarding_welcome_title: "Welcome to Pharaohs Pi Farm",
    onboarding_welcome_desc: "Get ready for a royal journey into the world of pharaonic farming!",
    onboarding_assets_title: "Your First Assets",
    onboarding_assets_desc: "You've received 3 free chickens! Feed them and collect crops.",
    onboarding_vitality_title: "Vitality System",
    onboarding_vitality_desc: "Beware! If you don't feed your assets within 24 hours, they will get sick!",
    onboarding_expansion_title: "Land Expansion",
    onboarding_expansion_desc: "Lease new lands from the Land Bureau to farm more.",
    onboarding_next: "Next",
    onboarding_start: "Start Game",
    
    // Game UI
    balance: "Balance",
    stamina: "Stamina",
    level: "Level",
    health: "Health",
    feed_all: "Feed All",
    collect_all: "Collect All",
    drag_drop_hint: "Drag grain to chicken to feed it",
    
    // Vitality warnings
    health_warning_low: "⚠️ Low health! Feed your assets now.",
    health_warning_critical: "🚨 Critical! Your assets may get sick soon.",
    
    // Menu
    language_settings: "Language Settings",
    help: "Help",
    about: "About Game",
    
    // Daily Tasks
    tasks_title: "Daily Tasks",
    tasks_xp: "Experience Points",
    task_feed_title: "Feed the Chickens",
    task_feed_desc: "Feed 3 chickens to boost their productivity",
    task_harvest_title: "Harvest Crops",
    task_harvest_desc: "Harvest one crop from your assets",
    task_kitchen_title: "Visit Kitchen",
    task_kitchen_desc: "Open the Royal Kitchen",
    task_complete_reward: "Task Complete! +{xp} XP and +{coins} coins",
    task_completed: "Completed",
  },
  zh: {
    // Onboarding
    onboarding_welcome_title: "欢迎来到法老派农场",
    onboarding_welcome_desc: "准备好踏上法老式农业的皇家之旅！",
    onboarding_assets_title: "您的首批资产",
    onboarding_assets_desc: "您获得了3只免费鸡！喂养它们并收集庄稼。",
    onboarding_vitality_title: "生命力系统",
    onboarding_vitality_desc: "小心！如果您在24小时内不喂养您的资产，它们会生病！",
    onboarding_expansion_title: "土地扩张",
    onboarding_expansion_desc: "从土地局租赁新土地以种植更多。",
    onboarding_next: "下一步",
    onboarding_start: "开始游戏",
    
    // Game UI
    balance: "余额",
    stamina: "精力",
    level: "等级",
    health: "生命力",
    feed_all: "全部喂养",
    collect_all: "全部收集",
    drag_drop_hint: "将谷物拖到鸡身上进行喂养",
    
    // Vitality warnings
    health_warning_low: "⚠️ 生命力低！现在喂养您的资产。",
    health_warning_critical: "🚨 危险！您的资产可能很快会生病。",
    
    // Menu
    language_settings: "语言设置",
    help: "帮助",
    about: "关于游戏",
    
    // Daily Tasks
    tasks_title: "日常任务",
    tasks_xp: "经验值",
    task_feed_title: "喂养鸡",
    task_feed_desc: "喂养3只鸡以提高它们的产量",
    task_harvest_title: "收获庄稼",
    task_harvest_desc: "从您的资产中收获一个庄稼",
    task_kitchen_title: "访问厨房",
    task_kitchen_desc: "打开皇家厨房",
    task_complete_reward: "任务完成！+{xp}经验值和+{coins}硬币",
    task_completed: "已完成",
  },
  fr: {
    // Onboarding
    onboarding_welcome_title: "Bienvenue à la Ferme Pharaons Pi",
    onboarding_welcome_desc: "Préparez-vous pour un voyage royal dans le monde de l'agriculture pharaonique!",
    onboarding_assets_title: "Vos premiers actifs",
    onboarding_assets_desc: "Vous avez reçu 3 poulets gratuits! Nourrissez-les et collectez les récoltes.",
    onboarding_vitality_title: "Système de Vitalité",
    onboarding_vitality_desc: "Attention! Si vous ne nourrissez pas vos actifs dans les 24 heures, ils tomberont malades!",
    onboarding_expansion_title: "Expansion des Terres",
    onboarding_expansion_desc: "Louer de nouvelles terres auprès du Bureau des Terres pour cultiver davantage.",
    onboarding_next: "Suivant",
    onboarding_start: "Commencer le Jeu",
    
    // Game UI
    balance: "Solde",
    stamina: "Endurance",
    level: "Niveau",
    health: "Santé",
    feed_all: "Tout Nourrir",
    collect_all: "Tout Collecter",
    drag_drop_hint: "Faites glisser le grain vers le poulet pour le nourrir",
    
    // Vitality warnings
    health_warning_low: "⚠️ Santé faible! Nourrissez vos actifs maintenant.",
    health_warning_critical: "🚨 Critique! Vos actifs risquent de tomber malades bientôt.",
    
    // Menu
    language_settings: "Paramètres de Langue",
    help: "Aide",
    about: "À Propos du Jeu",
    
    // Daily Tasks
    tasks_title: "Tâches Quotidiennes",
    tasks_xp: "Points d'Expérience",
    task_feed_title: "Nourrir les Poules",
    task_feed_desc: "Nourrissez 3 poules pour augmenter leur productivité",
    task_harvest_title: "Récolter les Cultures",
    task_harvest_desc: "Récoltez une culture de vos actifs",
    task_kitchen_title: "Visiter la Cuisine",
    task_kitchen_desc: "Ouvrez la Cuisine Royale",
    task_complete_reward: "Tâche Complétée! +{xp} XP et +{coins} pièces",
    task_completed: "Complétée",
  },
  es: {
    // Onboarding
    onboarding_welcome_title: "Bienvenido a Pharaohs Pi Farm",
    onboarding_welcome_desc: "¡Prepárate para un viaje real al mundo de la agricultura faraónica!",
    onboarding_assets_title: "Tus primeros activos",
    onboarding_assets_desc: "¡Has recibido 3 pollos gratis! Alimentalos y recolecta cosechas.",
    onboarding_vitality_title: "Sistema de Vitalidad",
    onboarding_vitality_desc: "¡Cuidado! Si no alimentas tus activos dentro de 24 horas, ¡se enfermarán!",
    onboarding_expansion_title: "Expansión de Tierras",
    onboarding_expansion_desc: "Alquila nuevas tierras de la Oficina de Tierras para cultivar más.",
    onboarding_next: "Siguiente",
    onboarding_start: "Comenzar Juego",
    
    // Game UI
    balance: "Saldo",
    stamina: "Resistencia",
    level: "Nivel",
    health: "Salud",
    feed_all: "Alimentar Todo",
    collect_all: "Coleccionar Todo",
    drag_drop_hint: "Arrastra el grano al pollo para alimentarlo",
    
    // Vitality warnings
    health_warning_low: "⚠️ ¡Salud baja! Alimenta tus activos ahora.",
    health_warning_critical: "🚨 ¡Crítico! Tus activos pueden enfermarse pronto.",
    
    // Menu
    language_settings: "Configuración de Idioma",
    help: "Ayuda",
    about: "Acerca del Juego",
    
    // Daily Tasks
    tasks_title: "Tareas Diarias",
    tasks_xp: "Puntos de Experiencia",
    task_feed_title: "Alimentar Pollos",
    task_feed_desc: "Alimenta 3 pollos para aumentar su productividad",
    task_harvest_title: "Cosechar Cultivos",
    task_harvest_desc: "Cosecha un cultivo de tus activos",
    task_kitchen_title: "Visitar Cocina",
    task_kitchen_desc: "Abre la Cocina Real",
    task_complete_reward: "¡Tarea Completada! +{xp} XP y +{coins} monedas",
    task_completed: "Completada",
  },
}

// Translation helper - returns translated string with optional variable interpolation
export function makeT(language: Language) {
  return (key: string, vars?: Record<string, string | number>): string => {
    let text = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    return text
  }
}

export function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "en"
  const lang = navigator.language.slice(0, 2).toLowerCase() as Language
  return TRANSLATIONS[lang] ? lang : "en"
}

export function useTranslation(lang: Language) {
  return (key: string): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key
  }
}
