export const VIDEO_CALL_ICONS = {
  GOOGLE_MEET: "/meet.png",
  google_meet: "/meet.png",
  "Google Meet": "/meet.png",
  ZOOM: "/zoom.png",
  TEAMS: "/teams.png",
} as const;

export type VideoCallProvider = keyof typeof VIDEO_CALL_ICONS;
