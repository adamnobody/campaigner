import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CastleIcon from '@mui/icons-material/Castle';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import TimelineIcon from '@mui/icons-material/Timeline';
import { CampaignerPage, CampaignerSurface } from '@/components/ui/CampaignerPrimitives';
import { DndButton } from '@/components/ui/DndButton';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { routes } from '@/utils/routes';
import { Reveal } from './Reveal';

type OverviewEmptyStateProps = {
  projectId: number;
  projectName: string;
  branchName?: string;
  isMainBranch: boolean;
  shouldAnimate: boolean;
  animationKey: string;
  characterCount: number;
  stateCount: number;
  eventCount: number;
  wikiCount: number;
};

export function OverviewEmptyState({
  projectId,
  projectName,
  branchName,
  isMainBranch,
  shouldAnimate,
  animationKey,
  characterCount,
  stateCount,
  eventCount,
  wikiCount,
}: OverviewEmptyStateProps) {
  const { t } = useTranslation(['projects', 'navigation', 'common']);
  const theme = useTheme();
  const navigate = useNavigate();
  const updateProject = useProjectStore((s) => s.updateProject);
  const showSnackbar = useUIStore((s) => s.showSnackbar);

  const [renameOpen, setRenameOpen] = useState(false);
  const [worldName, setWorldName] = useState(projectName);
  const [savingName, setSavingName] = useState(false);

  const openRename = () => {
    setWorldName(projectName);
    setRenameOpen(true);
  };

  const saveWorldName = async () => {
    const nextName = worldName.trim();
    if (!nextName) return;
    setSavingName(true);
    try {
      await updateProject(projectId, { name: nextName });
      setRenameOpen(false);
      showSnackbar(t('projects:overview.empty.named'), 'success');
    } catch {
      showSnackbar(t('projects:overview.empty.nameError'), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const stats = [
    {
      icon: PeopleIcon,
      label: t('projects:overview.empty.stats.characters'),
      count: characterCount,
      footer: t('projects:overview.empty.stats.none'),
      to: `/project/${projectId}/characters`,
    },
    {
      icon: CastleIcon,
      label: t('projects:overview.empty.stats.states'),
      count: stateCount,
      footer: t('projects:overview.empty.stats.none'),
      to: routes.factionList(projectId, 'state'),
    },
    {
      icon: TimelineIcon,
      label: t('projects:overview.empty.stats.events'),
      count: eventCount,
      footer: t('projects:overview.empty.stats.timelineEmpty'),
      to: `/project/${projectId}/timeline`,
    },
    {
      icon: MenuBookIcon,
      label: t('projects:overview.empty.stats.wiki'),
      count: wikiCount,
      footer: t('projects:overview.empty.stats.wikiEmpty'),
      to: `/project/${projectId}/wiki`,
    },
  ];

  const startCards = [
    {
      icon: PersonOutlineIcon,
      title: t('projects:overview.empty.start.characterTitle'),
      description: t('projects:overview.empty.start.characterDescription'),
      to: `/project/${projectId}/characters/new`,
    },
    {
      icon: CastleIcon,
      title: t('projects:overview.empty.start.placeTitle'),
      description: t('projects:overview.empty.start.placeDescription'),
      to: routes.factionDetail(projectId, 'state', 'new'),
    },
    {
      icon: GavelIcon,
      title: t('projects:overview.empty.start.dogmaTitle'),
      description: t('projects:overview.empty.start.dogmaDescription'),
      to: routes.dogmas(projectId),
    },
  ];

  const cardBorder = `1px solid ${theme.campaigner.surface.border}`;
  const hoverGold = {
    borderColor: alpha(theme.palette.primary.main, 0.38),
    backgroundColor: alpha(theme.palette.primary.main, 0.045),
  };

  return (
    <CampaignerPage sx={{ pt: { xs: 1, md: 2 }, position: 'relative', zIndex: 1 }}>
      <Reveal shouldAnimate={shouldAnimate} animationKey={`${animationKey}-header`}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2.5, md: 5 },
            pt: { xs: 3, md: 4.25 },
            pb: 2.75,
            borderBottom: cardBorder,
          }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 340px' }}>
            <Typography
              variant="overline"
              sx={{ display: 'block', color: 'primary.main', pb: 1 }}
            >
              {t('navigation:menu.overview')}
              {branchName ? ` · ${branchName}` : ''}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.15rem', md: '2.5rem' }, lineHeight: 1.02 }}>
              {t('projects:overview.empty.unnamedWorld')}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.84rem',
                lineHeight: 1.65,
                maxWidth: 620,
                pt: 1.25,
                textWrap: 'pretty',
              }}
            >
              {t('projects:overview.empty.description')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
            <DndButton
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => navigate(`/project/${projectId}/map`)}
            >
              {t('projects:overview.empty.openCanvas')}
            </DndButton>
            <DndButton variant="contained" startIcon={<EditOutlinedIcon />} onClick={openRename}>
              {t('projects:overview.empty.nameWorld')}
            </DndButton>
          </Box>
        </Box>
      </Reveal>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
          gap: { xs: 4.5, lg: 5 },
          alignItems: 'start',
          pt: { xs: 3, md: 3.5 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Reveal shouldAnimate={shouldAnimate} delay={0.06} animationKey={`${animationKey}-stats`}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              {stats.map((stat) => (
                <ButtonBase
                  key={stat.to}
                  onClick={() => navigate(stat.to)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.85,
                    px: 2,
                    py: 1.85,
                    textAlign: 'left',
                    borderRadius: '14px',
                    border: cardBorder,
                    backgroundColor: alpha(theme.palette.common.white, 0.016),
                    transition: shouldAnimate ? theme.campaigner.motion.transition : 'none',
                    '&:hover, &:focus-visible': hoverGold,
                  }}
                >
                  <stat.icon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ lineHeight: 1, color: 'text.primary' }}>
                    {stat.count}
                  </Typography>
                  <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                    {stat.footer}
                  </Typography>
                </ButtonBase>
              ))}
            </Box>
          </Reveal>

          <Reveal shouldAnimate={shouldAnimate} delay={0.12} animationKey={`${animationKey}-start`}>
            <Box sx={{ pt: { xs: 4, md: 4.75 } }}>
              <Typography variant="h5">{t('projects:overview.empty.start.title')}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.6, pt: 0.85, maxWidth: 560 }}>
                {t('projects:overview.empty.start.hint')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.5,
                  pt: 2,
                }}
              >
                {startCards.map((card) => (
                  <ButtonBase
                    key={card.to}
                    component={RouterLink}
                    to={card.to}
                    sx={{
                      minHeight: 148,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      gap: 1.35,
                      p: 2.25,
                      textAlign: 'left',
                      borderRadius: '14px',
                      border: cardBorder,
                      backgroundColor: alpha(theme.palette.common.white, 0.016),
                      color: 'text.primary',
                      transition: shouldAnimate ? theme.campaigner.motion.transition : 'none',
                      '&:hover, &:focus-visible': hoverGold,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9px',
                        color: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.09),
                        '& .MuiSvgIcon-root': { fontSize: 18 },
                      }}
                    >
                      <card.icon />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{card.title}</Typography>
                      <Typography
                        sx={{
                          mt: 0.7,
                          color: 'text.secondary',
                          fontSize: '0.78rem',
                          lineHeight: 1.55,
                          textWrap: 'pretty',
                        }}
                      >
                        {card.description}
                      </Typography>
                    </Box>
                  </ButtonBase>
                ))}
              </Box>
            </Box>
          </Reveal>

          <Reveal shouldAnimate={shouldAnimate} delay={0.18} animationKey={`${animationKey}-recent`}>
            <Box component="section" sx={{ pt: { xs: 4, md: 4.75 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 2,
                  pb: 1.5,
                }}
              >
                <Typography variant="h5">{t('projects:overview.empty.recent.title')}</Typography>
                <Typography sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                  {t('projects:overview.empty.recent.meta')}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 188,
                  px: 3,
                  py: 5,
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: `1px dashed ${alpha(theme.palette.text.primary, 0.085)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.013),
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  sx={{
                    mt: 2,
                    color: 'text.secondary',
                    fontSize: '0.81rem',
                    lineHeight: 1.6,
                    maxWidth: 420,
                    textWrap: 'pretty',
                  }}
                >
                  {t('projects:overview.empty.recent.empty')}
                </Typography>
              </Box>
            </Box>
          </Reveal>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.75,
            pt: { xs: 0, lg: 0.25 },
          }}
        >
          <Reveal shouldAnimate={shouldAnimate} delay={0.1} animationKey={`${animationKey}-branch`}>
            <CampaignerSurface sx={{ p: 2.25 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                {t('projects:overview.empty.branch.title')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1.35 }}>
                <StarOutlineIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography sx={{ fontSize: 14 }}>
                  {branchName || t('projects:defaultMainBranchName')}
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.7, pt: 1.1 }}>
                {isMainBranch
                  ? t('projects:overview.empty.branch.canonicalHint')
                  : t('projects:overview.empty.branch.altHint')}
              </Typography>
            </CampaignerSurface>
          </Reveal>

          <Reveal shouldAnimate={shouldAnimate} delay={0.16} animationKey={`${animationKey}-focus`}>
            <CampaignerSurface sx={{ p: 2.25 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                {t('projects:overview.empty.focus.title')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.7, pt: 1.25 }}>
                {t('projects:overview.empty.focus.body')}
              </Typography>
            </CampaignerSurface>
          </Reveal>

          <Reveal shouldAnimate={shouldAnimate} delay={0.2} animationKey={`${animationKey}-note`}>
            <DndButton
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/project/${projectId}/notes`)}
              sx={{ mt: 0.5, minHeight: 42 }}
            >
              {t('projects:overview.empty.newNote')}
            </DndButton>
          </Reveal>
        </Box>
      </Box>

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, backgroundImage: 'none' } }}
      >
        <DialogTitle>{t('projects:overview.empty.nameWorldTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label={t('projects:overview.empty.nameWorldLabel')}
            value={worldName}
            onChange={(event) => setWorldName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void saveWorldName();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <DndButton color="inherit" onClick={() => setRenameOpen(false)}>
            {t('common:cancel')}
          </DndButton>
          <DndButton
            variant="contained"
            loading={savingName}
            disabled={!worldName.trim()}
            onClick={() => void saveWorldName()}
          >
            {t('common:save')}
          </DndButton>
        </DialogActions>
      </Dialog>
    </CampaignerPage>
  );
}
