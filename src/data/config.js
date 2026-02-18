// Base URL for the Blessings365 API
export const API_BASE_URL = 'https://api.blessings365.top';

// Supported Bible versions
export const BIBLE_VERSIONS = [
    { value: 'TB', label: 'TB' },
    { value: 'ESV', label: 'ESV' },
    { value: 'KJV', label: 'KJV' },
    { value: 'NASB', label: 'NASB' },
    { value: 'NIV', label: 'NIV' },
    { value: 'NLT', label: 'NLT' },
    { value: 'TLB', label: 'TLB' },
    { value: 'CNVS', label: '新译本(CNVS)' },
    { value: 'CUNPSS-上帝', label: '新标点和合本，上帝版' },
    { value: 'CUNPSS-神', label: '新标点和合本，神版' },
    { value: 'CUV', label: '和合本 (繁體) (CUV)' },
];

// Chinese version codes
export const CHINESE_SIMPLIFIED_VERSIONS = ['CNVS', 'CUNPSS-上帝', 'CUNPSS-神'];
export const CHINESE_TRADITIONAL_VERSIONS = ['CUV'];
export const INDONESIAN_VERSIONS = ['TB'];
