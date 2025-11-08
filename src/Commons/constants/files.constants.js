export const fileTypes = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  APPLICATION: "application",
};

export const allowedFileExtensions = {
  [fileTypes.IMAGE]: ["png", "jpg", "jpeg", "gif", "webp"],
  [fileTypes.VIDEO]: ["mp4", "mov", "avi", "mkv"],
  [fileTypes.AUDIO]: ["mp3", "wav"],
  [fileTypes.APPLICATION]: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
};
