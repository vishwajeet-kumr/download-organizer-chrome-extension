// ============================================================
// Download Organizer Pro — background.js (Phase 2: Full Pro Gates)
// ============================================================

// --- Constants ---

const DEFAULT_FOLDER_MAP = {
  images: 'Images', videos: 'Videos', documents: 'Documents',
  audio: 'Music', archives: 'Archives', code: 'Code',
};

const DEFAULT_STATS = {
  total: 0, images: 0, videos: 0, documents: 0,
  audio: 0, archives: 0, code: 0,
};

const FREE_CATEGORIES = ['images', 'videos', 'documents'];
const PRO_CATEGORIES  = ['audio', 'archives', 'code'];

const EXTENSION_MAP = {
  // Images
  jpg:'images', jpeg:'images', png:'images', gif:'images', webp:'images',
  svg:'images', bmp:'images', ico:'images', tiff:'images', tif:'images',
  avif:'images', heic:'images', raw:'images', psd:'images', ai:'images', eps:'images',
  // Videos
  mp4:'videos', avi:'videos', mov:'videos', mkv:'videos', webm:'videos',
  flv:'videos', wmv:'videos', m4v:'videos', '3gp':'videos', ogv:'videos',
  ts:'videos', vob:'videos', mpg:'videos', mpeg:'videos',
  // Documents
  pdf:'documents', doc:'documents', docx:'documents', xls:'documents', xlsx:'documents',
  ppt:'documents', pptx:'documents', txt:'documents', csv:'documents', odt:'documents',
  ods:'documents', odp:'documents', rtf:'documents', epub:'documents', md:'documents',
  pages:'documents', numbers:'documents', key:'documents', djvu:'documents',
  // Audio
  mp3:'audio', wav:'audio', flac:'audio', aac:'audio', ogg:'audio',
  m4a:'audio', wma:'audio', opus:'audio', aiff:'audio', alac:'audio',
  mid:'audio', midi:'audio',
  // Archives
  zip:'archives', rar:'archives', '7z':'archives', tar:'archives', gz:'archives',
  bz2:'archives', xz:'archives', dmg:'archives', iso:'archives', pkg:'archives',
  deb:'archives', rpm:'archives', cab:'archives', z:'archives', lz:'archives',
  // Code
  js:'code', jsx:'code', ts:'code', tsx:'code', py:'code', html:'code',
  css:'code', json:'code', xml:'code', php:'code', java:'code', c:'code',
  cpp:'code', h:'code', go:'code', rs:'code', rb:'code', sh:'code',
  yml:'code', yaml:'code', toml:'code', sql:'code', swift:'code', kt:'code',
  dart:'code', vue:'code',
};

const MIME_RULES = [
  { prefix: 'image/',                                         category: 'images'    },
  { prefix: 'video/',                                         category: 'videos'    },
  { prefix: 'audio/',                                         category: 'audio'     },
  { prefix: 'application/ogg',                                category: 'audio'     },
  { prefix: 'application/pdf',                                category: 'documents' },
  { prefix: 'application/msword',                             category: 'documents' },
  { prefix: 'application/vnd.openxmlformats-officedocument',  category: 'documents' },
  { prefix: 'application/vnd.ms-excel',                       category: 'documents' },
  { prefix: 'application/vnd.ms-powerpoint',                  category: 'documents' },
  { prefix: 'application/vnd.oasis.opendocument',             category: 'documents' },
  { prefix: 'application/rtf',                                category: 'documents' },
  { prefix: 'application/epub+zip',                           category: 'documents' },
  { prefix: 'application/zip',                                category: 'archives'  },
  { prefix: 'application/x-zip',                              category: 'archives'  },
  { prefix: 'application/x-zip-compressed',                   category: 'archives'  },
  { prefix: 'application/x-gzip',                             category: 'archives'  },
  { prefix: 'application/x-rar-compressed',                   category: 'archives'  },
  { prefix: 'application/x-7z-compressed',                    category: 'archives'  },
  { prefix: 'application/gzip',                               category: 'archives'  },
  { prefix: 'application/x-tar',                              category: 'archives'  },
  { prefix: 'text/javascript',                                 category: 'code'      },
  { prefix: 'application/javascript',                          category: 'code'      },
  { prefix: 'application/x-javascript',                        category: 'code'      },
  { prefix: 'text/typescript',                                 category: 'code'      },
  { prefix: 'text/html',                                       category: 'code'      },
  { prefix: 'text/css',                                        category: 'code'      },
  { prefix: 'text/x-python',                                   category: 'code'      },
  { prefix: 'application/x-sh',                                category: 'code'      },
  { prefix: 'application/json',                                category: 'code'      },
  { prefix: 'application/xml',                                 category: 'code'      },
  { prefix: 'text/xml',                                        category: 'code'      },
];


// --- Helper Functions ---

function getCategoryFromMime(mimeType) {
  if (!mimeType || mimeType === 'application/octet-stream') return null;
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  for (const rule of MIME_RULES) {
    if (normalized.startsWith(rule.prefix)) return rule.category;
  }
  return null;
}

function getCategoryFromExtension(filename) {
  if (!filename) return null;
  const cleanName = filename.split('?')[0].split('#')[0];
  const parts = cleanName.split('.');
  if (parts.length < 2) return null;
  const ext = parts[parts.length - 1].toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}

function getBasename(filepath) {
  const segments = filepath.split(/[\\/]/);
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i]) return segments[i];
  }
  return filepath;
}

function getDatePath() {
  const now = new Date();
  return `${now.getFullYear()}/${now.toLocaleString('en-US', { month: 'long' })}`;
}


// --- chrome.runtime.onInstalled ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(
    ['enabled', 'isPro', 'licenseKey', 'folderMap', 'dateSubfolders', 'apiUrl'],
    (result) => {
      const updates = {};
      if (result.enabled === undefined) updates.enabled = true;
      if (result.isPro === undefined) updates.isPro = false;
      if (result.licenseKey === undefined) updates.licenseKey = null;
      if (result.dateSubfolders === undefined) updates.dateSubfolders = false;
      if (result.apiUrl === undefined) updates.apiUrl = '';
      if (result.folderMap === undefined) updates.folderMap = DEFAULT_FOLDER_MAP;

      if (Object.keys(updates).length > 0) {
        chrome.storage.sync.set(updates);
      }
    }
  );

  chrome.storage.local.get(['stats'], (result) => {
    if (!result.stats) {
      chrome.storage.local.set({ stats: DEFAULT_STATS });
    }
  });

  chrome.alarms.create('revalidate-license', { periodInMinutes: 10080 });
});


// --- chrome.alarms.onAlarm ---

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'revalidate-license') return;

  chrome.storage.sync.get(['licenseKey', 'apiUrl'], (result) => {
    if (!result.licenseKey || !result.apiUrl) return;

    try {
      fetch(result.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: result.licenseKey }),
      })
        .then((response) => {
          if (response.ok) return response.json();
          return null;
        })
        .then((data) => {
          if (data && data.valid) {
            chrome.storage.sync.set({ isPro: true });
          }
          // If invalid or error, do nothing (offline grace period)
        })
        .catch(() => {
          // Network error — do nothing
        });
    } catch (err) {
      // Catch any synchronous errors — do nothing
    }
  });
});


// --- chrome.downloads.onDeterminingFilename ---

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  chrome.storage.sync.get(
    ['enabled', 'isPro', 'folderMap', 'dateSubfolders'],
    (result) => {
      // Compute basename once, used in all suggest() calls including early exits
      const basename = getBasename(item.filename);

      // If extension is disabled, use default location
      if (!result.enabled) {
        suggest({ filename: basename, conflictAction: 'uniquify' });
        return;
      }

      // Merge user folder names with defaults as fallback
      const mergedFolderMap = { ...DEFAULT_FOLDER_MAP, ...(result.folderMap || {}) };

      // Determine category: try MIME first, then extension
      const category =
        getCategoryFromMime(item.mime) ?? getCategoryFromExtension(item.filename);

      // Unknown file type — use default location
      if (!category) {
        suggest({ filename: basename, conflictAction: 'uniquify' });
        return;
      }

      // Pro category on free plan — use default location
      if (PRO_CATEGORIES.includes(category) && !result.isPro) {
        suggest({ filename: basename, conflictAction: 'uniquify' });
        return;
      }

      // Build the target path
      let folderName = mergedFolderMap[category];

      // Date subfolders (Pro only)
      if (result.isPro && result.dateSubfolders) {
        folderName = folderName + '/' + getDatePath();
      }

      suggest({ filename: folderName + '/' + basename, conflictAction: 'uniquify' });

      // Track stats for all users — display is still Pro-only (gated in popup.js renderProState)
      chrome.storage.local.get(['stats'], (statsResult) => {
        const stats = statsResult.stats || { ...DEFAULT_STATS };
        stats.total = (stats.total || 0) + 1;
        stats[category] = (stats[category] || 0) + 1;
        chrome.storage.local.set({ stats });
      });
    }
  );

  // REQUIRED: return true to keep the suggest() channel open for the async callback
  return true;
});
