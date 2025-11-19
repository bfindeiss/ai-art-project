import projection from '../config/projection.json';
import theme from '../config/theme.json';
import system from '../config/system.json';

export type ProjectionConfig = typeof projection;
export type ThemeConfig = typeof theme;
export type SystemConfig = typeof system;

export const projectionConfig: ProjectionConfig = projection;
export const themeConfig: ThemeConfig = theme;
export const systemConfig: SystemConfig = system;
