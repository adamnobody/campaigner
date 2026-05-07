import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Stack,
  Skeleton,
  alpha,
  useTheme,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { shallow } from 'zustand/shallow';
import { motion, useReducedMotion } from 'framer-motion';

import { GlassCard } from '@/components/ui/GlassCard';
import { useProjectStore } from '@/store/useProjectStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useMapStore } from '@/store/useMapStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useDogmaStore } from '@/store/useDogmaStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useBranchStore } from '@/store/useBranchStore';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import MapIcon from '@mui/icons-material/Map';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GavelIcon from '@mui/icons-material/Gavel';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HubIcon from '@mui/icons-material/Hub';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

type RevealProps = {
  children: React.ReactNode;
  shouldAnimate: boolean;
  delay?: number;
  animationKey: string;
  style?: React.CSSProperties;
};

function Reveal({
  children,
  shouldAnimate,
  delay = 0,
  animationKey,
  style,
}: RevealProps) {
  const [entered, setEntered] = useState(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
      setEntered(true);
      return;
    }

    setEntered(false);

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setEntered(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [animationKey, shouldAnimate]);

  return (
    <motion.div
      initial={false}
      animate={
        shouldAnimate && !entered
          ? { opacity: 0, y: 32 }
          : { opacity: 1, y: 0 }
      }
      transition={
        shouldAnimate && entered
          ? {
              duration: 0.42,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              duration: 0,
            }
      }
      style={style}
    >
      {children}
    </motion.div>
  );
}

export const ProjectDashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = projectId ? parseInt(projectId, 10) : 0;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['navigation', 'common']);
  const theme = useTheme();

  // Stores
  const currentProject = useProjectStore((s) => s.currentProject);
  const charStore = useCharacterStore();
  const factionStore = useFactionStore();
  const noteStore = useNoteStore();
  const timelineStore = useTimelineStore();
  const mapStore = useMapStore();
  const dynastyStore = useDynastyStore();
  const dogmaStore = useDogmaStore();
  const branchStore = useBranchStore();
  const preferences = usePreferencesStore();

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (pid <= 0) return;
    let mounted = true;

    const loadData = async () => {
      try {
        await Promise.allSettled([
          charStore.initialized ? Promise.resolve() : charStore.fetchCharacters(pid),
          factionStore.initialized ? Promise.resolve() : factionStore.fetchFactions(pid),
          noteStore.total > 0 || noteStore.notes.length > 0 ? Promise.resolve() : noteStore.fetchNotes(pid),
          timelineStore.events.length > 0 ? Promise.resolve() : timelineStore.fetchEvents(pid),
          mapStore.mapTree.length > 0 ? Promise.resolve() : mapStore.fetchMapTree(pid),
          dynastyStore.initialized ? Promise.resolve() : dynastyStore.fetchDynasties(pid),
          dogmaStore.total > 0 || dogmaStore.dogmas.length > 0 ? Promise.resolve() : dogmaStore.fetchDogmas(pid),
          branchStore.initialized ? Promise.resolve() : branchStore.fetchBranches(pid),
        ]);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };
    loadData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const { motionMode } = preferences;
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = motionMode === 'full' && !prefersReducedMotion;

  // Language mapping
  const isRu = i18n.language.startsWith('ru');
  const i18nText = {
    overview: isRu ? 'Обзор' : 'Overview',
    projectCenter: isRu ? 'Центр проекта' : 'Project Center',
    recentChanges: isRu ? 'Последние изменения' : 'Recent changes',
    quickActions: isRu ? 'Быстрые действия' : 'Quick actions',
    currentBranch: isRu ? 'Текущая ветка' : 'Current branch',
    timeline: isRu ? 'Таймлайн' : 'Timeline',
    suggestions: isRu ? 'Что можно улучшить' : 'Suggestions',
    welcome: isRu ? 'Добро пожаловать в новый проект' : 'Welcome to your new project',
    startBuilding: isRu ? 'Начните собирать мир: создайте заметку, персонажа, фракцию, событие или карту.' : 'Start building your world: create a note, character, faction, event or map.',
    altWorld: isRu ? 'Вы смотрите альтернативную версию мира.' : 'You are viewing an alternate version of the world.',
    mainWorld: isRu ? 'Это каноническая версия мира.' : 'This is the canonical version of the world.',
    createNote: isRu ? 'Создать заметку' : 'Create note',
    createChar: isRu ? 'Создать персонажа' : 'Create character',
    createFaction: isRu ? 'Создать фракцию' : 'Create faction',
    addEvent: isRu ? 'Добавить событие' : 'Add event',
    createMap: isRu ? 'Создать карту' : 'Create map',
    openGraph: isRu ? 'Открыть графы' : 'Open graphs',
    emptyList: isRu ? 'Список пуст' : 'No items',
    viewAll: isRu ? 'Смотреть все' : 'View all',
    firstSteps: isRu ? 'Первые шаги' : 'First steps',
    errorLoad: isRu ? 'Не удалось загрузить центр проекта.' : 'Could not load Project Center.',
  };

  const isEmptyProject = useMemo(() => {
    const isMapsEmpty = mapStore.mapTree.length === 0 || 
      (mapStore.mapTree.length === 1 && mapStore.mapTree[0].name === 'World' && !mapStore.mapTree[0].imagePath);

    return (
      charStore.total === 0 &&
      factionStore.total === 0 &&
      noteStore.total === 0 &&
      timelineStore.events.length === 0 &&
      isMapsEmpty &&
      dynastyStore.total === 0 &&
      dogmaStore.total === 0
    );
  }, [
    charStore.total,
    factionStore.total,
    noteStore.total,
    timelineStore.events.length,
    mapStore.mapTree,
    mapStore.markers.length,
    dynastyStore.total,
    dogmaStore.total,
  ]);

  const recentActivity = useMemo(() => {
    const items: Array<{ id: number; title: string; type: string; updatedAt: Date; link: string }> = [];

    charStore.characters.forEach((c) =>
      items.push({ id: c.id, title: c.name, type: isRu ? 'Персонаж' : 'Character', updatedAt: new Date(c.updatedAt), link: `/project/${pid}/characters/${c.id}` })
    );
    factionStore.factions.forEach((f) =>
      items.push({ id: f.id, title: f.name, type: isRu ? 'Фракция' : 'Faction', updatedAt: new Date(f.updatedAt), link: `/project/${pid}/factions/${f.id}` })
    );
    noteStore.notes.forEach((n) =>
      items.push({ id: n.id, title: n.title, type: isRu ? 'Заметка' : 'Note', updatedAt: new Date(n.updatedAt), link: `/project/${pid}/notes/${n.id}` })
    );
    timelineStore.events.forEach((e) =>
      items.push({ id: e.id, title: e.title, type: isRu ? 'Событие' : 'Event', updatedAt: new Date(e.updatedAt), link: `/project/${pid}/timeline` })
    );
    mapStore.mapTree.forEach((m) =>
      items.push({ id: m.id, title: m.name, type: isRu ? 'Карта' : 'Map', updatedAt: new Date(m.updatedAt), link: `/project/${pid}/map/${m.id}` })
    );
    dynastyStore.dynasties.forEach((d) =>
      items.push({ id: d.id, title: d.name, type: isRu ? 'Династия' : 'Dynasty', updatedAt: new Date(d.updatedAt), link: `/project/${pid}/dynasties/${d.id}` })
    );
    dogmaStore.dogmas.forEach((d) =>
      items.push({ id: d.id, title: d.title, type: isRu ? 'Догма' : 'Dogma', updatedAt: new Date(d.updatedAt), link: `/project/${pid}/dogmas` })
    );

    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);
  }, [
    charStore.characters,
    factionStore.factions,
    noteStore.notes,
    timelineStore.events,
    mapStore.mapTree,
    dynastyStore.dynasties,
    dogmaStore.dogmas,
    pid,
    isRu,
  ]);

  const activeBranch = useMemo(() => {
    return branchStore.branches.find((b) => b.id === branchStore.activeBranchId);
  }, [branchStore.branches, branchStore.activeBranchId]);

  const suggestions = useMemo(() => {
    const list: string[] = [];
    if (noteStore.total === 0) list.push(isRu ? 'Добавьте первую заметку, чтобы зафиксировать основные идеи мира.' : 'Add your first note to capture the main ideas of your world.');
    if (charStore.total === 0) list.push(isRu ? 'Создайте первого персонажа: героя, правителя, свидетеля или важную фигуру.' : 'Create your first character: a hero, ruler, witness or key figure.');
    if (factionStore.total === 0) list.push(isRu ? 'Добавьте фракцию, чтобы начать политическую структуру мира.' : 'Add a faction to start the political structure of your world.');
    if (timelineStore.events.length === 0) list.push(isRu ? 'Добавьте событие на таймлайн, чтобы мир получил историю.' : 'Add a timeline event to give your world history.');
    if (mapStore.mapTree.length === 0) list.push(isRu ? 'Добавьте карту мира, региона или города.' : 'Add a map of the world, region or city.');
    if (dogmaStore.total === 0) list.push(isRu ? 'Опишите догмы, верования или принципы мира.' : 'Describe the dogmas, beliefs or principles of the world.');
    return list.slice(0, 4);
  }, [noteStore.total, charStore.total, factionStore.total, timelineStore.events.length, mapStore.mapTree.length, dogmaStore.total, isRu]);

  const animationKey = `${projectId}-${isEmptyProject ? 'empty' : 'dashboard'}`;

  useEffect(() => {
    console.debug('[ProjectDashboard animation]', {
      projectId,
      isEmptyProject,
      motionMode,
      prefersReducedMotion,
      shouldAnimate,
      animationKey,
    });
  }, [
    projectId,
    isEmptyProject,
    motionMode,
    prefersReducedMotion,
    shouldAnimate,
    animationKey,
  ]);

  if (!currentProject && !isBootstrapping) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="error">{i18nText.errorLoad}</Typography>
      </Container>
    );
  }

  if (isBootstrapping) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 4 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (isEmptyProject) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }} key={animationKey}>
        <Box>
          <Reveal shouldAnimate={shouldAnimate} delay={0} animationKey={`${animationKey}-empty-hero`}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                {i18nText.welcome}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                {i18nText.startBuilding}
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={4} justifyContent="center">
            {[
              { icon: DescriptionIcon, title: i18nText.createNote, to: `/project/${pid}/notes` },
              { icon: PeopleIcon, title: i18nText.createChar, to: `/project/${pid}/characters/new` },
              { icon: GroupsIcon, title: i18nText.createFaction, to: `/project/${pid}/factions/new` },
              { icon: TimelineIcon, title: i18nText.addEvent, to: `/project/${pid}/timeline` },
              { icon: MapIcon, title: i18nText.createMap, to: `/project/${pid}/map` },
            ].map((action, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Reveal
                  shouldAnimate={shouldAnimate}
                  delay={0.1 + i * 0.06}
                  animationKey={`${animationKey}-empty-card-${i}`}
                  style={{ height: '100%' }}
                >
                  <GlassCard interactive onClick={() => navigate(action.to)} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      <action.icon fontSize="large" />
                    </Box>
                    <Typography variant="h6">{action.title}</Typography>
                  </GlassCard>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  const statCards = [
    { icon: PeopleIcon, label: t('menu.characters'), count: charStore.total, to: `/project/${pid}/characters` },
    { icon: GroupsIcon, label: t('menu.factions'), count: factionStore.total, to: `/project/${pid}/factions` },
    { icon: DescriptionIcon, label: t('menu.notes'), count: noteStore.total, to: `/project/${pid}/notes` },
    { icon: TimelineIcon, label: t('menu.timeline'), count: timelineStore.events.length, to: `/project/${pid}/timeline` },
    { icon: MapIcon, label: t('menu.map'), count: mapStore.mapTree.length, to: `/project/${pid}/map` },
    { icon: AccountTreeIcon, label: t('menu.dynasties'), count: dynastyStore.total, to: `/project/${pid}/dynasties` },
    { icon: GavelIcon, label: t('menu.dogmas'), count: dogmaStore.total, to: `/project/${pid}/dogmas` },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} key={animationKey}>
      <Box>
        {/* HERO */}
        <Reveal shouldAnimate={shouldAnimate} delay={0} animationKey={`${animationKey}-hero`}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              mb: 4,
              bgcolor: 'background.paper',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
                zIndex: 0,
              }}
            />
            <Box sx={{ p: { xs: 3, md: 6 }, position: 'relative', zIndex: 1 }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h3" fontWeight={700} gutterBottom>
                    {currentProject?.name}
                  </Typography>
                  {currentProject?.description && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {currentProject.description}
                    </Typography>
                  )}
                  {activeBranch && (
                    <Chip
                      icon={<CallSplitIcon />}
                      label={activeBranch.name}
                      color={activeBranch.isMain ? 'default' : 'warning'}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                  <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
                    <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to={`/project/${pid}/notes`} sx={{ mb: 1 }}>
                      {i18nText.createNote}
                    </Button>
                    <Button variant="outlined" startIcon={<HubIcon />} component={RouterLink} to={`/project/${pid}/graph`} sx={{ mb: 1 }}>
                      {i18nText.openGraph}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Reveal>

        {/* STATS GRID */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {statCards.map((stat, i) => (
            <Grid item xs={6} sm={4} md={3} lg key={i}>
              <Reveal
                shouldAnimate={shouldAnimate}
                delay={0.1 + i * 0.04}
                animationKey={`${animationKey}-stats-card-${i}`}
                style={{ height: '100%' }}
              >
                <GlassCard interactive onClick={() => navigate(stat.to)} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <stat.icon />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} lineHeight={1}>
                      {stat.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </GlassCard>
              </Reveal>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          {/* LEFT COL */}
          <Grid item xs={12} md={8}>
            <Stack spacing={4}>
              {/* RECENT ACTIVITY */}
              <Reveal shouldAnimate={shouldAnimate} delay={0.2} animationKey={`${animationKey}-recent-activity`}>
                <GlassCard sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="action" />
                    <Typography variant="h6">{i18nText.recentChanges}</Typography>
                  </Box>
                  <List disablePadding>
                    {recentActivity.length === 0 ? (
                      <ListItem>
                        <ListItemText primary={i18nText.emptyList} sx={{ color: 'text.secondary' }} />
                      </ListItem>
                    ) : (
                      recentActivity.map((item, i) => (
                        <ListItem
                          key={`${item.type}-${item.id}-${i}`}
                          button
                          component={RouterLink}
                          to={item.link}
                          sx={{ borderBottom: i < recentActivity.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}
                        >
                          <ListItemText
                            primary={item.title}
                            secondary={`${item.type} • ${item.updatedAt.toLocaleDateString()}`}
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                          <ArrowForwardIcon fontSize="small" color="action" />
                        </ListItem>
                      ))
                    )}
                  </List>
                </GlassCard>
              </Reveal>

              {/* TIMELINE PREVIEW */}
              <Reveal shouldAnimate={shouldAnimate} delay={0.25} animationKey={`${animationKey}-timeline`}>
                <GlassCard sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon color="action" />
                      <Typography variant="h6">{i18nText.timeline}</Typography>
                    </Box>
                    <Button component={RouterLink} to={`/project/${pid}/timeline`} size="small">
                      {i18nText.viewAll}
                    </Button>
                  </Box>
                  <List disablePadding>
                    {timelineStore.events.slice(0, 3).map((ev, i) => (
                      <ListItem key={ev.id} sx={{ borderBottom: i < 2 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                        <ListItemText
                          primary={ev.title}
                          secondary={ev.eventDate || ev.era || ''}
                        />
                      </ListItem>
                    ))}
                    {timelineStore.events.length === 0 && (
                      <ListItem>
                        <ListItemText primary={i18nText.emptyList} sx={{ color: 'text.secondary' }} />
                      </ListItem>
                    )}
                  </List>
                </GlassCard>
              </Reveal>
            </Stack>
          </Grid>

          {/* RIGHT COL */}
          <Grid item xs={12} md={4}>
            <Stack spacing={4}>
              {/* CURRENT BRANCH */}
              <Reveal shouldAnimate={shouldAnimate} delay={0.2} animationKey={`${animationKey}-current-branch`}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <CallSplitIcon color="action" />
                    {i18nText.currentBranch}
                  </Typography>
                  {activeBranch ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {activeBranch.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {activeBranch.isMain ? i18nText.mainWorld : i18nText.altWorld}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {i18nText.emptyList}
                    </Typography>
                  )}
                </GlassCard>
              </Reveal>

              {/* SUGGESTIONS */}
              {suggestions.length > 0 && (
                <Reveal shouldAnimate={shouldAnimate} delay={0.25} animationKey={`${animationKey}-suggestions`}>
                  <GlassCard sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1} color="info.main">
                      <LightbulbIcon />
                      {i18nText.suggestions}
                    </Typography>
                    <List disablePadding sx={{ mt: 1 }}>
                      {suggestions.map((sug, i) => (
                        <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={sug} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </GlassCard>
                </Reveal>
              )}

              {/* QUICK ACTIONS (if needed) */}
              <Reveal shouldAnimate={shouldAnimate} delay={0.3} animationKey={`${animationKey}-quick-actions`}>
                <GlassCard sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {i18nText.quickActions}
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Button variant="text" component={RouterLink} to={`/project/${pid}/characters/new`} startIcon={<PeopleIcon />} sx={{ justifyContent: 'flex-start' }}>
                      {i18nText.createChar}
                    </Button>
                    <Button variant="text" component={RouterLink} to={`/project/${pid}/factions/new`} startIcon={<GroupsIcon />} sx={{ justifyContent: 'flex-start' }}>
                      {i18nText.createFaction}
                    </Button>
                    <Button variant="text" component={RouterLink} to={`/project/${pid}/map`} startIcon={<MapIcon />} sx={{ justifyContent: 'flex-start' }}>
                      {i18nText.createMap}
                    </Button>
                  </Stack>
                </GlassCard>
              </Reveal>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
