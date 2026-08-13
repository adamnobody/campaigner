import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemePresetDefinition } from '@/theme/presets';
import { getFontPreset } from './fontPresets';
import styles from '../AppearanceSettingsPage.module.css';

type PreviewMode = 'menu' | 'workspace';

type AppearanceLivePreviewProps = {
  preset: ThemePresetDefinition;
  tone: string;
  accentGlow: 'none' | 'soft' | 'strong';
  fontPresetId: string;
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  readingFontSize: number;
  readingLineHeight: 'tight' | 'normal' | 'loose';
  summary: Array<{ label: string; value: string; accent?: boolean }>;
};

const alphaHex = (hex: string, alpha: number) => {
  const value = hex.match(/^#([\da-f]{6})$/i)?.[1];
  if (!value) return `rgba(201, 169, 97, ${alpha})`;
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  return `rgba(${channels.join(', ')}, ${alpha})`;
};

export const AppearanceLivePreview: React.FC<AppearanceLivePreviewProps> = ({
  preset,
  tone,
  accentGlow,
  fontPresetId,
  uiDensity,
  readingFontSize,
  readingLineHeight,
  summary,
}) => {
  const { t } = useTranslation('appearance');
  const [mode, setMode] = React.useState<PreviewMode>('menu');
  const font = getFontPreset(fontPresetId);
  const gap = uiDensity === 'compact' ? 7 : uiDensity === 'spacious' ? 14 : 10;
  const padding = uiDensity === 'compact' ? '11px 13px' : uiDensity === 'spacious' ? '20px 22px' : '15px 17px';
  const lineHeight = readingLineHeight === 'tight' ? 1.55 : readingLineHeight === 'loose' ? 1.95 : 1.75;
  const glowAlpha = accentGlow === 'none' ? 0 : accentGlow === 'strong' ? 0.3 : 0.16;
  const buttonInk = '#10120f';

  return (
    <div className={styles.previewStack}>
      <div className={styles.previewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.styleDot} style={{ background: '#8fbf9f' }} />
          <span className={styles.eyebrow} style={{ color: 'rgba(232,228,220,.44)' }}>
            {t('preview.title')}
          </span>
        </div>
        <div className={styles.previewTabs}>
          {(['menu', 'workspace'] as const).map((option) => (
            <button
              className={`${styles.previewTab} ${mode === option ? styles.previewTabActive : ''}`}
              key={option}
              type="button"
              onClick={() => setMode(option)}
            >
              {t(`preview.tabs.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.previewStage} style={{ background: tone, fontFamily: font.family }}>
        <div
          className={styles.previewGlow}
          style={{ background: `radial-gradient(ellipse at center, ${alphaHex(preset.accentMain, glowAlpha)}, transparent 70%)` }}
        />
        {mode === 'menu' ? (
          <div className={styles.menuPreview}>
            <div className={styles.menuLogo}>CAMPAIGNER</div>
            <div style={{ paddingTop: 4, color: preset.muted, fontSize: 9.5 }}>{t('preview.menu.projectCount')}</div>
            <div className={styles.menuArcs}>
              <div className={styles.menuArc} style={{ background: `linear-gradient(180deg, ${alphaHex(preset.accentMain, .06)}, rgba(0,0,0,.5))` }} />
              <div
                className={`${styles.menuArc} ${styles.menuArcMain}`}
                style={{
                  background: `linear-gradient(180deg, ${alphaHex(preset.accentMain, .28)}, rgba(0,0,0,.45))`,
                  boxShadow: accentGlow === 'none' ? 'none' : `0 0 34px ${alphaHex(preset.accentMain, glowAlpha + .04)}`,
                }}
              />
              <div className={styles.menuArc} style={{ background: `linear-gradient(180deg, ${alphaHex(preset.accentMain, .1)}, rgba(0,0,0,.55))` }} />
            </div>
            <button
              className={styles.previewPrimary}
              type="button"
              style={{ position: 'absolute', bottom: 15, color: buttonInk, background: preset.accentMain }}
            >
              + {t('preview.menu.newWorld')}
            </button>
          </div>
        ) : (
          <div className={styles.workspacePreview}>
            <div className={styles.workspaceNav} style={{ display: 'flex', flexDirection: 'column', gap }}>
              <span style={{ width: 42, height: 8, borderRadius: 3, background: alphaHex(preset.accentMain, .7) }} />
              {[100, 70, 84].map((width) => (
                <span key={width} style={{ width: `${width}%`, height: 6, borderRadius: 3, background: 'rgba(240,236,227,.14)' }} />
              ))}
            </div>
            <div className={styles.workspaceMain} style={{ display: 'flex', flexDirection: 'column', gap }}>
              <div className={styles.eyebrow}>{t('preview.workspace.eyebrow')}</div>
              <div style={{ color: preset.textPrimary, fontFamily: font.family, fontSize: 19, fontWeight: 600 }}>
                {t('preview.workspace.title')}
              </div>
              <div className={styles.previewCard} style={{ padding }}>
                <div style={{ color: preset.textSecondary, fontSize: Math.max(10, readingFontSize - 4), lineHeight }}>
                  {t('preview.workspace.body')}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: gap }}>
                  {['location', 'magic', 'mystery'].map((tag, index) => (
                    <span
                      key={tag}
                      style={{
                        padding: '3px 8px',
                        border: `1px solid ${index === 0 ? alphaHex(preset.accentMain, .34) : 'rgba(255,255,255,.09)'}`,
                        borderRadius: 5,
                        color: index === 0 ? preset.accentMain : preset.textSecondary,
                        background: index === 0 ? alphaHex(preset.accentMain, .12) : 'transparent',
                        fontSize: 9.5,
                      }}
                    >
                      {t(`preview.workspace.tags.${tag}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.previewButtonRow}>
                <button className={styles.previewPrimary} type="button" style={{ color: buttonInk, background: preset.accentMain }}>
                  {t('preview.workspace.open')}
                </button>
                <button className={styles.previewSecondary} type="button">{t('preview.workspace.details')}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.summary}>
        {summary.map((item) => (
          <div className={styles.summaryRow} key={item.label}>
            <span className={styles.summaryKey}>{item.label}</span>
            <span className={styles.summaryValue} style={{ color: item.accent ? preset.accentMain : undefined }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.notice}>{t('preview.liveNote')}</div>
    </div>
  );
};
