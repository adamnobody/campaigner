import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  ButtonBase,
  Stack,
  Skeleton,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import { useReducedMotion } from 'framer-motion';

import {
  CampaignerPage,
  CampaignerPageHeader,
  CampaignerSurface,
} from '@/components/ui/CampaignerPrimitives';
import { AnimatedContourWaves } from '@/components/ui/AnimatedContourWaves';
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
import { OverviewEmptyState } from './OverviewEmptyState';
import { Reveal } from './Reveal';

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
import HubIcon from '@mui/icons-material/Hub';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export const ProjectDashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = projectId ? parseInt(projectId, 10) : 0;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['navigation', 'common']);
  const theme = useTheme();

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
  const lastLoadedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (pid <= 0) return;
    let mounted = true;
    const currentScopeKey = `${pid}:${branchStore.activeBranchId ?? 'none'}`;
    if (branchStore.activeProjectId === pid && lastLoadedScopeRef.current === currentScopeKey) {
      return;
    }
    const shouldFetchBranches = !branchStore.initialized || branchStore.activeProjectId !== pid;

    const loadData = async () => {
      setIsBootstrapping(true);
      try {
        if (shouldFetchBranches) {
          await branchStore.fetchBranches(pid);
        }

        await Promise.allSettled([
          charStore.fetchCharacters(pid),
          factionStore.fetchFactions(pid),
          noteStore.fetchNotes(pid),
          timelineStore.fetchEvents(pid),
          mapStore.fetchMapTree(pid),
          dynastyStore.fetchDynasties(pid),
          dogmaStore.fetchDogmas(pid),
        ]);
        const activeBranchId = useBranchStore.getState().activeBranchId;
        lastLoadedScopeRef.current = `${pid}:${activeBranchId ?? 'none'}`;
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };
    loadData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, branchStore.activeBranchId]);

  const { motionMode } = preferences;
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = motionMode === 'full' && !prefersReducedMotion;
  const isRu = i18n.language.startsWith('ru');
  const copy = {
    overview: isRu ? 'Обзор' : 'Overview',
    recentChanges: isRu ? 'Последние изменения' : 'Recent changes',
    quickActions: isRu ? 'Быстрые действия' : 'Quick actions',
    currentBranch: isRu ? 'Текущая ветка' : 'Current branch',
    timeline: isRu ? 'Таймлайн' : 'Timeline',
    suggestions: isRu ? 'Что можно улучшить' : 'Suggestions',
    dashboardDescription: isRu
      ? 'Мир в цифрах и последние правки. Отсюда удобно возвращаться туда, где вы остановились.'
      : 'Your world in numbers and its latest edits. Pick up exactly where you left off.',
    altWorld: isRu ? 'Вы смотрите альтернативную версию мира.' : 'You are viewing an alternate version of the world.',
    mainWorld: isRu ? 'Это каноническая версия мира.' : 'This is the canonical version of the world.',
    createNote: isRu ? 'Создать заметку' : 'Create note',
    createChar: isRu ? 'Создать персонажа' : 'Create character',
    createFaction: isRu ? 'Создать фракцию' : 'Create faction',
    addEvent: isRu ? 'Добавить событие' : 'Add event',
    createMap: isRu ? 'Создать холст' : 'Create canvas',
    addDogma: isRu ? 'Добавить догму' : 'Add dogma',
    openWiki: isRu ? 'Открыть вики' : 'Open wiki',
    openGraph: isRu ? 'Открыть граф' : 'Open graph',
    emptyList: isRu ? 'Пока ничего нет' : 'Nothing here yet',
    viewAll: isRu ? 'Смотреть все' : 'View all',
    errorLoad: isRu ? 'Не удалось загрузить обзор проекта.' : 'Could not load the project overview.',
  };

  const isEmptyProject = useMemo(() => {
    const isMapsEmpty =
      mapStore.mapTree.length === 0 ||
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

    charStore.characters.forEach((character) =>
      items.push({ id: character.id, title: character.name, type: isRu ? 'Персонаж' : 'Character', updatedAt: new Date(character.updatedAt), link: `/project/${pid}/characters/${character.id}` }),
    );
    factionStore.factions.forEach((faction) =>
      items.push({ id: faction.id, title: faction.name, type: isRu ? 'Фракция' : 'Faction', updatedAt: new Date(faction.updatedAt), link: `/project/${pid}/factions/${faction.id}` }),
    );
    noteStore.notes.forEach((note) =>
      items.push({ id: note.id, title: note.title, type: isRu ? 'Заметка' : 'Note', updatedAt: new Date(note.updatedAt), link: `/project/${pid}/notes/${note.id}` }),
    );
    timelineStore.events.forEach((event) =>
      items.push({ id: event.id, title: event.title, type: isRu ? 'Событие' : 'Event', updatedAt: new Date(event.updatedAt), link: `/project/${pid}/timeline` }),
    );
    mapStore.mapTree.forEach((canvas) =>
      items.push({ id: canvas.id, title: canvas.name, type: isRu ? 'Холст' : 'Canvas', updatedAt: new Date(canvas.updatedAt), link: `/project/${pid}/map/${canvas.id}` }),
    );
    dynastyStore.dynasties.forEach((dynasty) =>
      items.push({ id: dynasty.id, title: dynasty.name, type: isRu ? 'Династия' : 'Dynasty', updatedAt: new Date(dynasty.updatedAt), link: `/project/${pid}/dynasties/${dynasty.id}` }),
    );
    dogmaStore.dogmas.forEach((dogma) =>
      items.push({ id: dogma.id, title: dogma.title, type: isRu ? 'Догма' : 'Dogma', updatedAt: new Date(dogma.updatedAt), link: `/project/${pid}/dogmas` }),
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

  const activeBranch = useMemo(
    () => branchStore.branches.find((branch) => branch.id === branchStore.activeBranchId),
    [branchStore.branches, branchStore.activeBranchId],
  );

  const suggestions = useMemo(() => {
    const list: string[] = [];
    if (noteStore.total === 0) list.push(isRu ? 'Добавьте первую заметку, чтобы зафиксировать основные идеи мира.' : 'Add your first note to capture the main ideas of your world.');
    if (charStore.total === 0) list.push(isRu ? 'Создайте первого персонажа: героя, правителя, свидетеля или важную фигуру.' : 'Create your first character: a hero, ruler, witness or key figure.');
    if (factionStore.total === 0) list.push(isRu ? 'Добавьте фракцию, чтобы начать политическую структуру мира.' : 'Add a faction to start the political structure of your world.');
    if (timelineStore.events.length === 0) list.push(isRu ? 'Добавьте событие на таймлайн, чтобы мир получил историю.' : 'Add a timeline event to give your world history.');
    if (mapStore.mapTree.length === 0) list.push(isRu ? 'Добавьте холст мира, региона или города.' : 'Add a canvas of the world, region or city.');
    if (dogmaStore.total === 0) list.push(isRu ? 'Опишите догмы, верования или принципы мира.' : 'Describe the dogmas, beliefs or principles of the world.');
    return list.slice(0, 4);
  }, [noteStore.total, charStore.total, factionStore.total, timelineStore.events.length, mapStore.mapTree.length, dogmaStore.total, isRu]);

  const animationKey = `${projectId}-${isEmptyProject ? 'empty' : 'dashboard'}`;
  const firstStepActions = [
    { icon: DescriptionIcon, label: copy.createNote, to: `/project/${pid}/notes` },
    { icon: PeopleIcon, label: copy.createChar, to: `/project/${pid}/characters/new` },
    { icon: GroupsIcon, label: copy.createFaction, to: `/project/${pid}/factions/new` },
    { icon: TimelineIcon, label: copy.addEvent, to: `/project/${pid}/timeline` },
    { icon: MapIcon, label: copy.createMap, to: `/project/${pid}/map` },
    { icon: GavelIcon, label: copy.addDogma, to: `/project/${pid}/dogmas` },
    { icon: MenuBookIcon, label: copy.openWiki, to: `/project/${pid}/wiki` },
  ];
  const statCards = [
    { label: t('menu.characters'), count: charStore.total, to: `/project/${pid}/characters` },
    { label: t('menu.factions'), count: factionStore.total, to: `/project/${pid}/factions` },
    { label: t('menu.notes'), count: noteStore.total, to: `/project/${pid}/notes` },
    { label: t('menu.timeline'), count: timelineStore.events.length, to: `/project/${pid}/timeline` },
    { label: t('menu.map'), count: mapStore.mapTree.length, to: `/project/${pid}/map` },
    { label: t('menu.dynasties'), count: dynastyStore.total, to: `/project/${pid}/dynasties` },
    { label: t('menu.dogmas'), count: dogmaStore.total, to: `/project/${pid}/dogmas` },
  ];

  if (!currentProject && !isBootstrapping) {
    return (
      <CampaignerPage maxWidth={760} sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="error">{copy.errorLoad}</Typography>
      </CampaignerPage>
    );
  }

  if (isBootstrapping) {
    return (
      <CampaignerPage maxWidth={1120} sx={{ pt: { xs: 2, md: 4 } }}>
        <Skeleton width={120} height={20} />
        <Skeleton width="55%" height={66} sx={{ mt: 1 }} />
        <Skeleton width="70%" height={28} />
        <Skeleton variant="rectangular" height={112} sx={{ borderRadius: 0, mt: 4 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 6, mt: 5 }}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
        </Box>
      </CampaignerPage>
    );
  }

  const headerActions = (
    <>
      {activeBranch ? (
        <Chip
          icon={<CallSplitIcon />}
          label={activeBranch.name}
          variant="outlined"
          sx={{ color: activeBranch.isMain ? 'primary.main' : 'warning.main' }}
        />
      ) : null}
      <Button variant="outlined" startIcon={<HubIcon />} component={RouterLink} to={`/project/${pid}/graph`}>
        {copy.openGraph}
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to={`/project/${pid}/notes`}>
        {copy.createNote}
      </Button>
    </>
  );

  if (isEmptyProject) {
    return (
      <Box sx={{ position: 'relative', isolation: 'isolate', minHeight: '100%' }}>
        <AnimatedContourWaves accentColor={theme.palette.primary.main} animate={shouldAnimate} />
        <OverviewEmptyState
          projectId={pid}
          projectName={currentProject?.name ?? ''}
          branchName={activeBranch?.name}
          isMainBranch={Boolean(activeBranch?.isMain)}
          shouldAnimate={shouldAnimate}
          animationKey={animationKey}
          characterCount={charStore.total}
          stateCount={factionStore.factions.filter((faction) => faction.kind === 'state').length}
          eventCount={timelineStore.events.length}
          wikiCount={noteStore.notes.filter((note) => note.noteType === 'wiki').length}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', isolation: 'isolate', minHeight: '100%' }}>
    <AnimatedContourWaves accentColor={theme.palette.primary.main} animate={shouldAnimate} />
    <CampaignerPage maxWidth={1120} sx={{ pt: { xs: 1, md: 2 }, position: 'relative', zIndex: 1 }}>
      <Reveal shouldAnimate={shouldAnimate} animationKey={`${animationKey}-header`}>
        <CampaignerPageHeader
          eyebrow={`${copy.overview}${activeBranch ? ` · ${activeBranch.name}` : ''}`}
          title={currentProject?.name}
          description={currentProject?.description || copy.dashboardDescription}
          actions={headerActions}
        />
      </Reveal>

      <Reveal shouldAnimate={shouldAnimate} delay={0.06} animationKey={`${animationKey}-stats`}>
        <CampaignerSurface
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))', lg: 'repeat(7, minmax(0, 1fr))' },
            borderLeft: 0,
            borderRight: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          {statCards.map((stat, index) => (
            <ButtonBase
              key={stat.to}
              onClick={() => navigate(stat.to)}
              sx={{
                minWidth: 0,
                minHeight: 104,
                flexDirection: 'column',
                gap: 1,
                px: 1,
                borderLeft: index === 0 ? 'none' : { lg: `1px solid ${theme.campaigner.surface.border}` },
                borderRight: { xs: index % 2 === 0 ? `1px solid ${theme.campaigner.surface.border}` : 'none', sm: index % 4 !== 3 ? `1px solid ${theme.campaigner.surface.border}` : 'none', lg: 'none' },
                borderBottom: { xs: index < 6 ? `1px solid ${theme.campaigner.surface.border}` : 'none', lg: 'none' },
                transition: shouldAnimate ? 'background-color 160ms ease' : 'none',
                '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.028) },
              }}
            >
              <Typography variant="h4" sx={{ color: index === 0 ? 'primary.main' : 'text.primary', lineHeight: 1 }}>
                {stat.count}
              </Typography>
              <Typography variant="overline" sx={{ color: 'text.secondary', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stat.label}
              </Typography>
            </ButtonBase>
          ))}
        </CampaignerSurface>
      </Reveal>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: { xs: 5, md: 6 }, alignItems: 'start', pt: { xs: 4, md: 5 } }}>
        <Stack spacing={4.5}>
          <Reveal shouldAnimate={shouldAnimate} delay={0.12} animationKey={`${animationKey}-recent`}>
            <Box component="section">
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, pb: 1.75, borderBottom: `1px solid ${theme.campaigner.surface.border}` }}>
                <Typography variant="h5">{copy.recentChanges}</Typography>
              </Box>
              {recentActivity.length === 0 ? (
                <Typography sx={{ py: 2.25, color: 'text.secondary', fontSize: 13 }}>{copy.emptyList}</Typography>
              ) : (
                recentActivity.map((item) => (
                  <ButtonBase
                    key={`${item.type}-${item.id}`}
                    component={RouterLink}
                    to={item.link}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 2,
                      px: 0.5,
                      py: 1.75,
                      textAlign: 'left',
                      borderBottom: `1px solid ${theme.campaigner.surface.border}`,
                      transition: shouldAnimate ? 'background-color 160ms ease' : 'none',
                      '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.022) },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 14 }}>{item.title}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 11.5, pt: 0.5 }}>
                        {item.type} · {item.updatedAt.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </ButtonBase>
                ))
              )}
            </Box>
          </Reveal>

          <Reveal shouldAnimate={shouldAnimate} delay={0.16} animationKey={`${animationKey}-timeline`}>
            <Box component="section">
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, pb: 1.75, borderBottom: `1px solid ${theme.campaigner.surface.border}` }}>
                <Typography variant="h5">{copy.timeline}</Typography>
                <Button component={RouterLink} to={`/project/${pid}/timeline`} size="small">{copy.viewAll}</Button>
              </Box>
              {timelineStore.events.length === 0 ? (
                <Typography sx={{ py: 2.25, color: 'text.secondary', fontSize: 13 }}>{copy.emptyList}</Typography>
              ) : (
                timelineStore.events.slice(0, 3).map((event, index) => (
                  <Box key={event.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '78px 1px minmax(0, 1fr)', sm: '104px 1px minmax(0, 1fr)' }, gap: 2, pt: 2.25 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', textAlign: 'right', pt: 0.25 }}>
                      {event.eventDate || event.era || '—'}
                    </Typography>
                    <Box sx={{ position: 'relative', bgcolor: theme.campaigner.surface.border }}>
                      <Box sx={{ position: 'absolute', top: 5, left: -3, width: 7, height: 7, borderRadius: '50%', bgcolor: index === 0 ? 'primary.main' : 'text.disabled' }} />
                    </Box>
                    <Box sx={{ minWidth: 0, pb: 2.25 }}>
                      <Typography sx={{ fontSize: 14 }}>{event.title}</Typography>
                      {event.era ? <Typography sx={{ color: 'text.secondary', fontSize: 11.5, pt: 0.5 }}>{event.era}</Typography> : null}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Reveal>
        </Stack>

        <Stack spacing={3.5}>
          <Reveal shouldAnimate={shouldAnimate} delay={0.12} animationKey={`${animationKey}-branch`}>
            <Box component="section">
              <Typography variant="overline" color="text.secondary">{copy.currentBranch}</Typography>
              {activeBranch ? (
                <>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ pt: 1.5 }}>
                    <AccountTreeIcon sx={{ color: 'primary.main', fontSize: 19 }} />
                    <Typography sx={{ fontSize: 14 }}>{activeBranch.name}</Typography>
                  </Stack>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.7, pt: 1 }}>
                    {activeBranch.isMain ? copy.mainWorld : copy.altWorld}
                  </Typography>
                </>
              ) : (
                <Typography sx={{ color: 'text.secondary', fontSize: 12.5, pt: 1.5 }}>{copy.emptyList}</Typography>
              )}
            </Box>
          </Reveal>

          {suggestions.length > 0 ? (
            <Reveal shouldAnimate={shouldAnimate} delay={0.16} animationKey={`${animationKey}-suggestions`}>
              <Box component="section" sx={{ borderTop: `1px solid ${theme.campaigner.surface.border}`, pt: 2.75 }}>
                <Typography variant="overline" color="text.secondary">{copy.suggestions}</Typography>
                <Stack spacing={1.5} sx={{ pt: 1.75 }}>
                  {suggestions.map((suggestion) => (
                    <Box key={suggestion} sx={{ display: 'flex', gap: 1.25 }}>
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', flex: 'none', mt: 0.9 }} />
                      <Typography sx={{ color: 'text.secondary', fontSize: 12.5, lineHeight: 1.65 }}>{suggestion}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Reveal>
          ) : null}

          <Reveal shouldAnimate={shouldAnimate} delay={0.2} animationKey={`${animationKey}-actions`}>
            <Box component="section" sx={{ borderTop: `1px solid ${theme.campaigner.surface.border}`, pt: 2.75 }}>
              <Typography variant="overline" color="text.secondary">{copy.quickActions}</Typography>
              <Stack spacing={0.25} sx={{ pt: 1.25 }}>
                {firstStepActions.map((action) => (
                  <Button
                    key={action.to}
                    variant="text"
                    component={RouterLink}
                    to={action.to}
                    startIcon={<action.icon />}
                    endIcon={<AddIcon />}
                    sx={{ justifyContent: 'flex-start', color: 'text.secondary', px: 1, '& .MuiButton-endIcon': { ml: 'auto' } }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Reveal>
        </Stack>
      </Box>
    </CampaignerPage>
    </Box>
  );
};
