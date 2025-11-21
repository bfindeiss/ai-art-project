import projection from '../config/projection.json';
import theme from '../config/theme.json';
import system from '../config/system.json';
import playlist from '../config/playlist.json';

export type ProjectionConfig = typeof projection;
export type ThemeConfig = typeof theme;
export type SystemConfig = typeof system;
export type PlaylistConfig = typeof playlist;

export const projectionConfig: ProjectionConfig = projection;
export const themeConfig: ThemeConfig = theme;
export const systemConfig: SystemConfig = system;
export const playlistConfig: PlaylistConfig = playlist;
