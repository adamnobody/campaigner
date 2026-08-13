import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { shallow } from 'zustand/shallow';
import GavelIcon from '@mui/icons-material/Gavel';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CastleIcon from '@mui/icons-material/Castle';
import HubIcon from '@mui/icons-material/Hub';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useMapStore } from '@/store/useMapStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useDogmaStore } from '@/store/useDogmaStore';

type ProjectRoutePath =
  | ''
  | 'map'
  | 'graph'
  | 'characters'
  | 'states'
  | 'factions'
  | 'notes'
  | 'wiki'
  | 'timeline'
  | 'dogmas'
  | 'dynasties';

const PROJECT_MENU_ICONS = {
  '': DashboardIcon,
  map: MapIcon,
  graph: HubIcon,
  characters: PeopleIcon,
  states: CastleIcon,
  factions: GroupsIcon,
  notes: DescriptionIcon,
  wiki: MenuBookIcon,
  timeline: TimelineIcon,
  dogmas: GavelIcon,
  dynasties: AccountTreeIcon,
};

const PROJECT_MENU_PATHS: readonly ProjectRoutePath[] = [
  '',
  'map',
  'graph',
  'characters',
  'states',
  'factions',
  'notes',
  'wiki',
  'timeline',
  'dogmas',
  'dynasties',
] as const;

function tourAttrForSidebarPath(path: ProjectRoutePath): string | undefined {
  switch (path) {
    case 'characters':
      return 'sidebar-characters';
    case 'graph':
      return 'sidebar-graph';
    case 'states':
      return 'sidebar-states';
    case 'factions':
      return 'sidebar-factions';
    case 'notes':
      return 'sidebar-notes';
    case 'wiki':
      return 'sidebar-wiki';
    case 'timeline':
      return 'sidebar-timeline';
    case 'dogmas':
      return 'sidebar-dogmas';
    case 'dynasties':
      return 'sidebar-dynasties';
    default:
      return undefined;
  }
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation('navigation');
  const { sidebarOpen, sidebarWidth, toggleSidebar } = useUIStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    sidebarWidth: state.sidebarWidth,
    toggleSidebar: state.toggleSidebar,
  }), shallow);
  const { currentProject, fetchProject } = useProjectStore((state) => ({
    currentProject: state.currentProject,
    fetchProject: state.fetchProject,
  }), shallow);
  const characters = useCharacterStore((state) => state.characters);
  const factions = useFactionStore((state) => state.factions);
  const notes = useNoteStore((state) => state.notes);
  const events = useTimelineStore((state) => state.events);
  const mapTree = useMapStore((state) => state.mapTree);
  const dynasties = useDynastyStore((state) => state.dynasties);
  const dogmas = useDogmaStore((state) => state.dogmas);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const [expanded, setExpanded] = useState<Set<ProjectRoutePath>>(new Set());

  const isProjectPage = !!projectId;
  const pid = projectId ? Number(projectId) : null;

  const activePath = useMemo<ProjectRoutePath>(() => {
    if (!projectId) return '';
    const section = location.pathname.split('/')[3] ?? '';
    return PROJECT_MENU_PATHS.includes(section as ProjectRoutePath)
      ? section as ProjectRoutePath
      : '';
  }, [location.pathname, projectId]);

  const childItems = useMemo<Record<ProjectRoutePath, Array<{ id: string; label: string; to: string }>>>(() => {
    if (!pid) return { '': [], map: [], graph: [], characters: [], states: [], factions: [], notes: [], wiki: [], timeline: [], dogmas: [], dynasties: [] };
    const mapEntity = <T extends { id: number }>(items: T[], label: (item: T) => string, to: (item: T) => string) =>
      items.slice(0, 8).map((item) => ({ id: String(item.id), label: label(item), to: to(item) }));
    return {
      '': [],
      map: mapEntity(mapTree, (item) => item.name, (item) => `/project/${pid}/map/${item.id}`),
      graph: [],
      characters: mapEntity(characters, (item) => item.name, (item) => `/project/${pid}/characters/${item.id}`),
      states: mapEntity(factions.filter((item) => item.kind === 'state'), (item) => item.name, (item) => `/project/${pid}/states/${item.id}`),
      factions: mapEntity(factions.filter((item) => item.kind !== 'state'), (item) => item.name, (item) => `/project/${pid}/factions/${item.id}`),
      notes: mapEntity(notes.filter((item) => item.noteType !== 'wiki'), (item) => item.title, (item) => `/project/${pid}/notes/${item.id}`),
      wiki: mapEntity(notes.filter((item) => item.noteType === 'wiki'), (item) => item.title, (item) => `/project/${pid}/wiki/${item.id}`),
      timeline: mapEntity(events, (item) => item.title, () => `/project/${pid}/timeline`),
      dogmas: mapEntity(dogmas, (item) => item.title, () => `/project/${pid}/dogmas`),
      dynasties: mapEntity(dynasties, (item) => item.name, (item) => `/project/${pid}/dynasties/${item.id}`),
    };
  }, [characters, dogmas, dynasties, events, factions, mapTree, notes, pid]);

  const projectMenuItems = useMemo(
    () => PROJECT_MENU_PATHS.map((path) => ({ path, Icon: PROJECT_MENU_ICONS[path], children: childItems[path] })),
    [childItems]
  );

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== Number(projectId))) {
      void fetchProject(Number(projectId));
    }
  }, [projectId, currentProject, fetchProject]);

  useEffect(() => {
    if (!activePath) return;
    setExpanded((current) => current.has(activePath) ? current : new Set(current).add(activePath));
  }, [activePath]);

  const toggleExpanded = (path: ProjectRoutePath) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const drawerSx = {
    width: sidebarWidth,
    flexShrink: 0,
    transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
    '& .MuiDrawer-paper': {
      width: sidebarWidth,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      backgroundColor: 'background.paper',
      borderRight: '1px solid rgba(255,255,255,.055)',
      transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
    },
  } as const;

  return (
    <Drawer variant="permanent" sx={drawerSx}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: sidebarOpen ? 2.25 : 1.25, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 38, px: 1.25, mb: 2.5 }}>
          <CastleIcon sx={{ color: 'primary.main', fontSize: 21, flexShrink: 0 }} />
          {sidebarOpen ? (
            <Typography sx={{ flex: 1, fontFamily: (theme) => theme.campaigner.typography.display, fontWeight: 600, fontSize: 21, color: '#ece7dd' }}>
              Campaigner
            </Typography>
          ) : null}
          <Tooltip title={sidebarOpen ? t('topbar.collapseSidebar') : t('topbar.expandSidebar')}>
            <IconButton size="small" onClick={toggleSidebar} aria-label={sidebarOpen ? t('topbar.collapseSidebar') : t('topbar.expandSidebar')}>
              {sidebarOpen ? <KeyboardDoubleArrowLeftIcon fontSize="small" /> : <KeyboardDoubleArrowRightIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {sidebarOpen && currentProject ? (
          <Box sx={{ px: 1.25, pb: 2.25 }}>
            <Typography variant="overline" sx={{ color: 'rgba(232,228,220,.3)' }}>{t('sidebar.projectLabel')}</Typography>
            <Typography sx={{ fontFamily: (theme) => theme.campaigner.typography.display, fontSize: 19, fontWeight: 600, color: '#e8e4dc', pt: 0.75 }} noWrap>
              {currentProject.name}
            </Typography>
            {currentProject.description ? (
              <Typography sx={{ color: 'rgba(232,228,220,.35)', fontSize: 11.5, pt: 0.5 }} noWrap>{currentProject.description}</Typography>
            ) : null}
          </Box>
        ) : null}

        <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {isProjectPage && currentProject ? projectMenuItems.map(({ path, Icon, children }) => {
            const fullPath = path ? `/project/${projectId}/${path}` : `/project/${projectId}`;
            const active = path === activePath;
            const canExpand = children.length > 0;
            const isExpanded = expanded.has(path) && sidebarOpen;
            const row = (
              <ListItemButton
                data-tour={tourAttrForSidebarPath(path)}
                selected={active}
                onClick={() => navigate(fullPath)}
                sx={{
                  height: 42,
                  px: 1.25,
                  borderRadius: '9px',
                  gap: 1.25,
                  mb: 0.25,
                  '&.Mui-selected': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) },
                  '&.Mui-selected:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.14) },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: active ? 'primary.main' : 'rgba(232,228,220,.42)' }}><Icon sx={{ fontSize: 19 }} /></ListItemIcon>
                {sidebarOpen ? <ListItemText primary={t(path ? `menu.${path}` : 'menu.overview')} primaryTypographyProps={{ noWrap: true, fontSize: 13.5, color: active ? '#f0ece3' : 'rgba(232,228,220,.72)' }} /> : null}
                {sidebarOpen && canExpand ? (
                  <IconButton
                    size="small"
                    onClick={(event) => { event.stopPropagation(); toggleExpanded(path); }}
                    aria-label={isExpanded ? t('sidebar.collapseSection') : t('sidebar.expandSection')}
                    sx={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 180ms ease' }}
                  >
                    <ChevronRightIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                ) : null}
              </ListItemButton>
            );
            return (
              <React.Fragment key={path}>
                {sidebarOpen ? row : <Tooltip title={t(path ? `menu.${path}` : 'menu.overview')} placement="right">{row}</Tooltip>}
                {canExpand ? (
                  <Collapse in={isExpanded} timeout={180} unmountOnExit>
                    <List disablePadding sx={{ pb: 1, pl: 4.25 }}>
                      {children.map((child) => (
                        <ListItemButton key={`${path}-${child.id}`} onClick={() => navigate(child.to)} sx={{ minHeight: 32, borderRadius: '7px', px: 1.5, gap: 1 }}>
                          <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: location.pathname === child.to ? 'primary.main' : 'rgba(232,228,220,.28)', flexShrink: 0 }} />
                          <ListItemText primary={child.label} primaryTypographyProps={{ noWrap: true, fontSize: 12.5, color: 'rgba(232,228,220,.62)' }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                ) : null}
              </React.Fragment>
            );
          }) : (
            <ListItemButton onClick={() => navigate('/')} sx={{ borderRadius: '9px' }}>
              <ListItemIcon sx={{ minWidth: 36 }}><HomeIcon color="primary" /></ListItemIcon>
              {sidebarOpen ? <ListItemText primary={t('sidebar.allCampaigns')} /> : null}
            </ListItemButton>
          )}
        </List>

        <Box sx={{ pt: 1.25, mt: 1, borderTop: '1px solid rgba(255,255,255,.055)' }}>
          {isProjectPage ? (
            <ListItemButton data-tour="sidebar-settings" selected={location.pathname === `/project/${projectId}/settings`} onClick={() => navigate(`/project/${projectId}/settings`)} sx={{ height: 40, borderRadius: '9px', px: 1.25 }}>
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 38 : 0 }}><SettingsIcon sx={{ fontSize: 19 }} /></ListItemIcon>
              {sidebarOpen ? <ListItemText primary={t('sidebar.projectSettings')} primaryTypographyProps={{ fontSize: 13.5 }} /> : null}
            </ListItemButton>
          ) : null}
          <ListItemButton onClick={() => navigate('/')} sx={{ height: 40, borderRadius: '9px', px: 1.25 }}>
            <ListItemIcon sx={{ minWidth: sidebarOpen ? 38 : 0 }}><HomeIcon sx={{ fontSize: 19 }} /></ListItemIcon>
            {sidebarOpen ? <ListItemText primary={t('sidebar.allCampaigns')} primaryTypographyProps={{ fontSize: 13.5 }} /> : null}
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
};;
