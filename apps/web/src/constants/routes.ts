export const SAMPLE_WARDROBE_ID = 'demo-wardrobe';

export const buildWardrobePath = (wardrobeId: string) => `/wardrobes/${wardrobeId}`;

export const routes = {
  createWardrobe: '/',
  home: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/home`,
  histories: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/histories`,
  historyDetail: (wardrobeId: string, historyId = 'history-1', origin: 'home' | 'list' = 'list') =>
    `${buildWardrobePath(wardrobeId)}/histories/${historyId}/${origin}`,
  templates: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/templates`,
  templateNew: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/templates/new`,
  templateDetail: (wardrobeId: string, templateId = 'template-1') =>
    `${buildWardrobePath(wardrobeId)}/templates/${templateId}`,
  templateEdit: (wardrobeId: string, templateId = 'template-1') =>
    `${buildWardrobePath(wardrobeId)}/templates/${templateId}/edit`,
  clothings: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/clothings`,
  clothingNew: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/clothings/new`,
  clothingDetail: (wardrobeId: string, clothingId = 'clothing-1') =>
    `${buildWardrobePath(wardrobeId)}/clothings/${clothingId}`,
  clothingEdit: (wardrobeId: string, clothingId = 'clothing-1') =>
    `${buildWardrobePath(wardrobeId)}/clothings/${clothingId}/edit`,
  recordMethod: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/record/method`,
  recordByTemplate: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/record/template`,
  recordByCombination: (wardrobeId: string) => `${buildWardrobePath(wardrobeId)}/record/combination`,
};
