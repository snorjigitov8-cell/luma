export type LanguageCode = 'en' | 'uz' | 'ru';

export interface CategoryInfo {
  id: string;
  slug: string;
  names: Record<LanguageCode, string>;
  descriptions: Record<LanguageCode, string>;
  isPremiumDefault?: boolean;
}

export const WALLPAPER_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cat-01',
    slug: 'anime-worlds',
    names: { en: 'Anime Worlds', uz: 'Anime olamlari', ru: 'Миры аниме' },
    descriptions: {
      en: 'Cel-shaded floating archipelagos, twilight shrines, and atmospheric vistas.',
      uz: 'Suzuvchi orollar, shom ibodatxonalari va atmosferaviy manzaralar.',
      ru: 'Парящие архипелаги, сумеречные святилища и атмосферные пейзажи.'
    }
  },
  {
    id: 'cat-02',
    slug: 'fantasy-worlds',
    names: { en: 'Fantasy Worlds', uz: 'Fantaziya olamlari', ru: 'Фэнтезийные миры' },
    descriptions: {
      en: 'High-magic citadels, astral libraries, and enchanted kingdoms.',
      uz: 'Sehrli qal’alar, astral kutubxonalar va afsungar qirolliklar.',
      ru: 'Магические цитадели, астральные библиотеки и зачарованные королевства.'
    }
  },
  {
    id: 'cat-03',
    slug: 'cyberpunk-cities',
    names: { en: 'Cyberpunk Cities', uz: 'Kiberpank shaharlari', ru: 'Киберпанк-города' },
    descriptions: {
      en: 'Rain-slicked megastructures, holographic transit lanes, and neon skylines.',
      uz: 'Yomg‘irli megainshootlar, gologrammali yo‘llar va neon osmono‘parlar.',
      ru: 'Дождливые мегаструктуры, голографические магистрали и неоновые небоскребы.'
    }
  },
  {
    id: 'cat-04',
    slug: 'nature',
    names: { en: 'Nature', uz: 'Tabiat', ru: 'Природа' },
    descriptions: {
      en: 'Alpine peaks, misty fjords, autumn valleys, and serene wilderness.',
      uz: 'Alp cho‘qqilari, tumanli fyordlar, kuzgi vodiylar va sokin tabiat.',
      ru: 'Альпийские вершины, туманные фьорды, осенние долины и дикая природа.'
    }
  },
  {
    id: 'cat-05',
    slug: 'space-and-galaxies',
    names: { en: 'Space and Galaxies', uz: 'Koinot va galaktikalar', ru: 'Космос и галактики' },
    descriptions: {
      en: 'Relativistic black holes, deep-field nebulae, and orbital stations.',
      uz: 'Qora tuynuklar, chuqur tumanliklar va orbital stansiyalar.',
      ru: 'Черные дыры, глубокие туманности и орбитальные станции.'
    }
  },
  {
    id: 'cat-06',
    slug: 'mythical-creatures',
    names: { en: 'Mythical Creatures', uz: 'Afsonaviy mavjudotlar', ru: 'Мифические существа' },
    descriptions: {
      en: 'Celestial phoenixes, spirit guardians, and ancient leviathans.',
      uz: 'Samoviy Qaqnuslar, ruh qo‘riqchilari va qadimiy leviafanlar.',
      ru: 'Небесные фениксы, духи-хранители и древние левиафаны.'
    }
  },
  {
    id: 'cat-07',
    slug: 'dragons',
    names: { en: 'Dragons', uz: 'Ajdarlar', ru: 'Драконы' },
    descriptions: {
      en: 'Elder wyrms soaring above volcanic calderas and frozen peaks.',
      uz: 'Vulqon kraterlari va muzlagan cho‘qqilar uzra parvoz qilayotgan ajdarlar.',
      ru: 'Древние драконы, парящие над вулканическими кальдерами и ледяными пиками.'
    },
    isPremiumDefault: true
  },
  {
    id: 'cat-08',
    slug: 'futuristic-cities',
    names: { en: 'Futuristic Cities', uz: 'Kelajak shaharlari', ru: 'Города будущего' },
    descriptions: {
      en: 'Solarpunk arcologies, orbital elevators, and clean utopian architecture.',
      uz: 'Solarpank arkologiyalari, orbital liftlar va utopik arxitektura.',
      ru: 'Соларпанк-аркологии, орбитальные лифты и чистая утопическая архитектура.'
    }
  },
  {
    id: 'cat-09',
    slug: 'gaming',
    names: { en: 'Gaming', uz: 'O‘yin olami', ru: 'Игровые миры' },
    descriptions: {
      en: 'High-refresh tactical arenas, RPG sanctuaries, and mech hangars.',
      uz: 'Taktik arenalar, RPG maskanlari va mex-angarlar.',
      ru: 'Тактические арены, святилища из RPG и ангары мехов.'
    }
  },
  {
    id: 'cat-10',
    slug: 'ocean-worlds',
    names: { en: 'Ocean Worlds', uz: 'Okean olamlari', ru: 'Океанические миры' },
    descriptions: {
      en: 'Bioluminescent abyssal reefs, sunlit kelp forests, and underwater domes.',
      uz: 'Biolyuminessent riflar, suvosti o‘rmonlari va gumbazlar.',
      ru: 'Биолюминесцентные рифы, залитые солнцем подводные леса и купола.'
    }
  },
  {
    id: 'cat-11',
    slug: 'magical-forests',
    names: { en: 'Magical Forests', uz: 'Sehrli o‘rmonlar', ru: 'Волшебные леса' },
    descriptions: {
      en: 'Ancient redwoods with floating wisps, crystal streams, and twilight fog.',
      uz: 'Suzuvchi chiroqlar, billur irmoqlar va tumanli qadimiy o‘rmonlar.',
      ru: 'Древние секвойи со светлячками, хрустальными ручьями и сумеречным туманом.'
    }
  },
  {
    id: 'cat-12',
    slug: 'dark-fantasy',
    names: { en: 'Dark Fantasy', uz: 'Qorong‘u fantaziya', ru: 'Темное фэнтези' },
    descriptions: {
      en: 'Gothic cathedrals, eclipse moons, and obsidian fortresses.',
      uz: 'Gotik ibodatxonalar, oy tutilishi va obsidian qal’alar.',
      ru: 'Готические соборы, лунные затмения и обсидиановые крепости.'
    },
    isPremiumDefault: true
  },
  {
    id: 'cat-13',
    slug: 'abstract-art',
    names: { en: 'Abstract Art', uz: 'Abstrakt san’at', ru: 'Абстрактное искусство' },
    descriptions: {
      en: 'Fluid silk dynamics, iridescent glass refraction, and kinetic geometry.',
      uz: 'Suyuq ipak dinamikasi, shisha sinishi va kinetik geometriya.',
      ru: 'Динамика жидкого шелка, преломление стекла и кинетическая геометрия.'
    }
  },
  {
    id: 'cat-14',
    slug: 'relaxing-environments',
    names: { en: 'Relaxing Environments', uz: 'Tinchlantiruvchi muhit', ru: 'Расслабляющая атмосфера' },
    descriptions: {
      en: 'Lo-fi rain studies, warm fireplace cabins, and zen garden ponds.',
      uz: 'Yomg‘irli xona, issiq kaminli uychalar va dzen bog‘lari.',
      ru: 'Дождливые кабинеты, уютные домики с камином и пруды дзен-садов.'
    }
  },
  {
    id: 'cat-15',
    slug: 'motivational-wallpapers',
    names: { en: 'Motivational Wallpapers', uz: 'Motivatsion oboylar', ru: 'Мотивационные обои' },
    descriptions: {
      en: 'Minimalist kinetic typography, discipline mantras, and focus horizons.',
      uz: 'Minimalist kinetik tipografiya, intizom va diqqat ufqlar.',
      ru: 'Минималистичная кинетическая типографика и горизонты концентрации.'
    }
  },
  {
    id: 'cat-16',
    slug: 'ai-generated-worlds',
    names: { en: 'AI-Generated Worlds', uz: 'AI yaratgan olamlar', ru: 'Миры, созданные ИИ' },
    descriptions: {
      en: 'Neural dreamscapes synthesized via authorized generative models.',
      uz: 'Tasdiqlangan generativ modellar orqali yaratilgan neyron manzaralar.',
      ru: 'Нейронные пейзажи, синтезированные авторизованными моделями ИИ.'
    },
    isPremiumDefault: true
  },
  {
    id: 'cat-17',
    slug: '3d-wallpapers',
    names: { en: '3D Wallpapers', uz: '3D oboylar', ru: '3D-обои' },
    descriptions: {
      en: 'Depth-mapped parallax scenes and physically-based metallic shaders.',
      uz: 'Chuqurlik xaritasiga ega parallaks sahnalar va metall sheyderlar.',
      ru: 'Сцены с параллакс-глубиной и физически корректными шейдерами.'
    }
  },
  {
    id: 'cat-18',
    slug: 'interactive-wallpapers',
    names: { en: 'Interactive Wallpapers', uz: 'Interaktiv oboylar', ru: 'Интерактивные обои' },
    descriptions: {
      en: 'Cursor-reactive particle fields, audio visualizers, and clock overlays.',
      uz: 'Kursorga javob beruvchi zarralar, audio vizualizatorlar va soatlar.',
      ru: 'Реагирующие на курсор поля частиц, аудиовизуализаторы и часы.'
    },
    isPremiumDefault: true
  }
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_categories: 'Categories',
    nav_favorites: 'Favorites',
    nav_my_wallpapers: 'My Wallpapers',
    nav_premium: 'Premium',
    nav_settings: 'Settings',
    nav_admin: 'Admin',
    nav_architecture: 'Native Engine',

    hero_kicker: 'Cross-Platform Hardware-Accelerated Live Wallpaper Engine',
    hero_title: 'Living Worlds for Windows Desktop & Android',
    hero_subtitle: 'Zero-black-frame 10s seamless loops, per-monitor WorkerW desktop projection, automatic gaming pause, and native Android ExoPlayer integration.',
    btn_apply: 'Apply Wallpaper',
    btn_applied: 'Applied to Display',
    btn_download: 'Download',
    btn_downloading: 'Downloading...',
    btn_downloaded: 'Cached Locally',
    btn_favorite: 'Favorite',
    btn_favorited: 'Favorited',
    btn_preview: 'Live Preview',
    btn_import_video: 'Import Personal Video',
    btn_ai_studio: 'AI Wallpaper Studio',

    section_featured: 'Featured Wallpapers',
    section_trending: 'Trending Wallpapers',
    section_new: 'New Releases',
    section_premium: 'Premium Collection',
    section_recommended: 'Recommended for Your Display',
    section_recent: 'Recently Applied Wallpapers',
    section_categories: 'Browse 18 Curated Categories',

    search_placeholder: 'Search wallpapers by title, style, or tag...',
    filter_all_categories: 'All Categories',
    filter_all_resolutions: 'All Resolutions',
    filter_all_tiers: 'All Tiers',
    filter_free_only: 'Free Only',
    filter_premium_only: 'Premium Only',
    sort_popular: 'Most Popular',
    sort_newest: 'Recently Added',
    sort_size_asc: 'File Size (Smallest)',
    sort_size_desc: 'File Size (Largest)',

    badge_free: 'Free',
    badge_premium: 'Premium',

    simulator_title: 'Live Multi-Platform Engine Telemetry & Monitor Simulator',
    simulator_win_mode: 'Windows 11 WorkerW Multi-Monitor',
    simulator_android_mode: 'Android 15 WallpaperService',
    simulator_fullscreen_game: 'Simulate Fullscreen Game',
    simulator_battery_power: 'Simulate Battery Power',
    simulator_lock_screen: 'Simulate OS Lock',
    simulator_heavy_load: 'Simulate Heavy CPU/GPU Load',
    simulator_span_monitors: 'Span Single Wallpaper Across Monitors',
    simulator_per_monitor: 'Independent Per-Monitor Assignment',

    personal_title: 'Personal Video Wallpaper Studio',
    personal_subtitle: 'Import local MP4, WebM, GIF, JPG, PNG, or WebP media. Files stay strictly on your device unless you explicitly opt into cloud sync.',
    personal_trim_start: 'Loop Start (s)',
    personal_trim_end: 'Loop End (s)',
    personal_speed: 'Playback Speed',
    personal_display_mode: 'Display Scaling Mode',
    personal_mute: 'Mute Wallpaper Audio',
    personal_save_apply: 'Save to My Wallpapers & Apply',

    downloads_title: 'Wallpaper Download Manager',
    downloads_subtitle: 'SHA-256 integrity verification, local disk cache inspection, pause/resume queue, and duplicate prevention.',
    downloads_clear_completed: 'Clear Completed History',

    ai_studio_title: 'LUMA AI Wallpaper Studio',
    ai_studio_subtitle: 'Server-side Gemini API adapter for custom wallpaper synthesis and prompt choreography. Never fakes output.',
    ai_generate_btn: 'Synthesize Live Wallpaper',

    premium_title: 'LUMA Membership & Entitlement Architecture',
    premium_subtitle: 'Validated server-side entitlements for 4K/8K masters, interactive shaders, cloud sync, and AI Studio quota.',
    premium_free_tier: 'LUMA Free',
    premium_pro_tier: 'LUMA Premium',
    premium_monthly: 'Monthly Billing Cycle',
    premium_annual: 'Annual Billing Cycle',
    premium_restore: 'Restore Purchases',
    premium_upgrade_btn: 'Activate LUMA Premium Entitlement',

    settings_title: 'Application & Engine Settings',
    settings_general: 'General',
    settings_wallpaper: 'Wallpaper Playback',
    settings_performance: 'Performance & Power',
    settings_audio: 'Audio & Mixer',
    settings_storage: 'Storage & Cache',
    settings_account: 'Account & Sync',
    settings_saved_notice: 'All settings are automatically persisted to disk and synced across restarts.'
  },
  uz: {
    nav_home: 'Bosh sahifa',
    nav_explore: 'Katalog',
    nav_categories: 'Kategoriyalar',
    nav_favorites: 'Sevimlilar',
    nav_my_wallpapers: 'Mening oboylarim',
    nav_premium: 'Premium',
    nav_settings: 'Sozlamalar',
    nav_admin: 'Admin panel',
    nav_architecture: 'Tizim kodi',

    hero_kicker: 'Windows va Android uchun apparat tezlashtirilgan jonli oboy tizimi',
    hero_title: 'Kompyuter va smartfonlar uchun jonli olamlar',
    hero_subtitle: 'Qora kadrlarsiz 10 soniyali uzluksiz sikllar, ko‘p monitorli WorkerW integratsiyasi, o‘yin vaqtida avto-pauza va Android ExoPlayer dvigateli.',
    btn_apply: 'Oboyni o‘rnatish',
    btn_applied: 'Ekranga o‘rnatildi',
    btn_download: 'Yuklab olish',
    btn_downloading: 'Yuklanmoqda...',
    btn_downloaded: 'Keshda saqlangan',
    btn_favorite: 'Sevimli',
    btn_favorited: 'Sevimlilarda',
    btn_preview: 'Jonli ko‘rish',
    btn_import_video: 'Shaxsiy videoni yuklash',
    btn_ai_studio: 'AI Oboy Studiyasi',

    section_featured: 'Tanlangan oboylar',
    section_trending: 'Trenddagi oboylar',
    section_new: 'Yangi qo‘shilganlar',
    section_premium: 'Premium to‘plam',
    section_recommended: 'Ekraningiz uchun tavsiyalar',
    section_recent: 'Yaqinda ishlatilganlar',
    section_categories: '18 ta maxsus kategoriya',

    search_placeholder: 'Oboy nomi, uslubi yoki teg bo‘yicha qidirish...',
    filter_all_categories: 'Barcha kategoriyalar',
    filter_all_resolutions: 'Barcha o‘lchamlar',
    filter_all_tiers: 'Barcha tariflar',
    filter_free_only: 'Faqat bepul',
    filter_premium_only: 'Faqat Premium',
    sort_popular: 'Eng mashhur',
    sort_newest: 'Yangi qo‘shilgan',
    sort_size_asc: 'Hajmi (kichikdan)',
    sort_size_desc: 'Hajmi (kattadan)',

    badge_free: 'Bepul',
    badge_premium: 'Premium',

    simulator_title: 'Jonli dvigatel telemetriyasi va monitor simulyatori',
    simulator_win_mode: 'Windows 11 WorkerW Ko‘p-monitorli',
    simulator_android_mode: 'Android 15 WallpaperService',
    simulator_fullscreen_game: 'To‘liq ekranli o‘yinni simulyatsiya qilish',
    simulator_battery_power: 'Batareya rejimini yoqish',
    simulator_lock_screen: 'Tizim qulfini tekshirish',
    simulator_heavy_load: 'Yuqori CPU/GPU yuklamasi',
    simulator_span_monitors: 'Bitta oboyni barcha monitorlarga cho‘zish',
    simulator_per_monitor: 'Har bir monitor uchun alohida oboy',

    personal_title: 'Shaxsiy video oboylar studiyasi',
    personal_subtitle: 'Mahalliy MP4, WebM, GIF, JPG, PNG yoki WebP fayllarni tanlang. Ruxsatingizsiz fayllar serverga yuborilmaydi.',
    personal_trim_start: 'Boshlanish vaqti (s)',
    personal_trim_end: 'Tugash vaqti (s)',
    personal_speed: 'Ijro tezligi',
    personal_display_mode: 'Joylashtirish rejimi',
    personal_mute: 'Ovozni o‘chirish',
    personal_save_apply: 'Saqlash va ekranga o‘rnatish',

    downloads_title: 'Yuklamalar menejeri',
    downloads_subtitle: 'SHA-256 fayl butunligini tekshirish, mahalliy kesh, pauza/davom ettirish va takroriy yuklashni oldini olish.',
    downloads_clear_completed: 'Tarixni tozalash',

    ai_studio_title: 'LUMA AI Oboy Studiyasi',
    ai_studio_subtitle: 'Haqiqiy Gemini API adapteri orqali maxsus oboylar yaratish.',
    ai_generate_btn: 'AI Oboy yaratish',

    premium_title: 'LUMA Premium obuna tizimi',
    premium_subtitle: '4K/8K oboylar, interaktiv sheyderlar, bulutli sinxronizatsiya va AI studiya uchun himoyalangan ruxsatlar.',
    premium_free_tier: 'LUMA Bepul',
    premium_pro_tier: 'LUMA Premium',
    premium_monthly: 'Oylik obuna',
    premium_annual: 'Yillik obuna',
    premium_restore: 'Xaridlarni tiklash',
    premium_upgrade_btn: 'LUMA Premium obunasini faollashtirish',

    settings_title: 'Ilova va dvigatel sozlamalari',
    settings_general: 'Umumiy',
    settings_wallpaper: 'Oboy ijrosi',
    settings_performance: 'Samaradorlik va quvvat',
    settings_audio: 'Audio va ovoz',
    settings_storage: 'Xotira va kesh',
    settings_account: 'Hisob va sinxronizatsiya',
    settings_saved_notice: 'Barcha sozlamalar avtomatik saqlanadi va qayta ishga tushirilganda tiklanadi.'
  },
  ru: {
    nav_home: 'Главная',
    nav_explore: 'Обзор',
    nav_categories: 'Категории',
    nav_favorites: 'Избранное',
    nav_my_wallpapers: 'Мои обои',
    nav_premium: 'Премиум',
    nav_settings: 'Настройки',
    nav_admin: 'Админ-панель',
    nav_architecture: 'Код движка',

    hero_kicker: 'Кроссплатформенный движок живых обоев с аппаратным ускорением',
    hero_title: 'Живые миры для Windows и Android',
    hero_subtitle: 'Бесшовные 10-секундные циклы без черных кадров, мультимониторная проекция WorkerW, автопауза в играх и нативный ExoPlayer на Android.',
    btn_apply: 'Применить обои',
    btn_applied: 'Установлено на экран',
    btn_download: 'Скачать',
    btn_downloading: 'Загрузка...',
    btn_downloaded: 'В локальном кэше',
    btn_favorite: 'В избранное',
    btn_favorited: 'В избранном',
    btn_preview: 'Предпросмотр',
    btn_import_video: 'Импорт своего видео',
    btn_ai_studio: 'ИИ-студия обоев',

    section_featured: 'Рекомендуемые обои',
    section_trending: 'В тренде',
    section_new: 'Новинки',
    section_premium: 'Премиум-коллекция',
    section_recommended: 'Подобрано для вашего дисплея',
    section_recent: 'Недавно использованные',
    section_categories: '18 тематических категорий',

    search_placeholder: 'Поиск обоев по названию, стилю или тегу...',
    filter_all_categories: 'Все категории',
    filter_all_resolutions: 'Все разрешения',
    filter_all_tiers: 'Все уровни',
    filter_free_only: 'Только бесплатные',
    filter_premium_only: 'Только Премиум',
    sort_popular: 'По популярности',
    sort_newest: 'Сначала новые',
    sort_size_asc: 'Размер (по возрастанию)',
    sort_size_desc: 'Размер (по убыванию)',

    badge_free: 'Бесплатно',
    badge_premium: 'Премиум',

    simulator_title: 'Телеметрия движка и симулятор мониторов',
    simulator_win_mode: 'Windows 11 WorkerW Мультимонитор',
    simulator_android_mode: 'Android 15 WallpaperService',
    simulator_fullscreen_game: 'Симуляция полноэкранной игры',
    simulator_battery_power: 'Симуляция работы от батареи',
    simulator_lock_screen: 'Симуляция блокировки ОС',
    simulator_heavy_load: 'Симуляция высокой нагрузки CPU/GPU',
    simulator_span_monitors: 'Растянуть одни обои на все мониторы',
    simulator_per_monitor: 'Отдельные обои для каждого монитора',

    personal_title: 'Студия пользовательских видеообоев',
    personal_subtitle: 'Импортируйте локальные файлы MP4, WebM, GIF, JPG, PNG или WebP. Личные видео не загружаются на сервер без вашего согласия.',
    personal_trim_start: 'Начало цикла (с)',
    personal_trim_end: 'Конец цикла (с)',
    personal_speed: 'Скорость воспроизведения',
    personal_display_mode: 'Режим масштабирования',
    personal_mute: 'Отключить звук обоев',
    personal_save_apply: 'Сохранить в коллекцию и применить',

    downloads_title: 'Менеджер загрузок обоев',
    downloads_subtitle: 'Проверка целостности SHA-256, контроль свободного места, пауза/возобновление и защита от дубликатов.',
    downloads_clear_completed: 'Очистить историю',

    ai_studio_title: 'ИИ-студия обоев LUMA',
    ai_studio_subtitle: 'Серверный адаптер Gemini API для генерации живых обоев по текстовому описанию.',
    ai_generate_btn: 'Сгенерировать обои',

    premium_title: 'Подписка LUMA Premium и проверка прав доступа',
    premium_subtitle: 'Серверная проверка подписки для доступа к 4K/8K коллекции, интерактивным обоям, облачной синхронизации и ИИ-студии.',
    premium_free_tier: 'LUMA Базовый',
    premium_pro_tier: 'LUMA Премиум',
    premium_monthly: 'Ежемесячная подписка',
    premium_annual: 'Годовая подписка',
    premium_restore: 'Восстановить покупки',
    premium_upgrade_btn: 'Активировать подписку LUMA Premium',

    settings_title: 'Настройки приложения и движка',
    settings_general: 'Общие',
    settings_wallpaper: 'Воспроизведение обоев',
    settings_performance: 'Производительность и питание',
    settings_audio: 'Аудио и громкость',
    settings_storage: 'Хранилище и кэш',
    settings_account: 'Аккаунт и синхронизация',
    settings_saved_notice: 'Все настройки автоматически сохраняются и восстанавливаются при перезапуске.'
  }
};

export function t(lang: LanguageCode, key: string): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

export function getCategoryName(catSlugOrId: string, lang: LanguageCode): string {
  const found = WALLPAPER_CATEGORIES.find(c => c.slug === catSlugOrId || c.id === catSlugOrId);
  return found ? found.names[lang] : catSlugOrId;
}
