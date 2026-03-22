import React, { useMemo } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box,
  Breadcrumbs, Link as MuiLink, Button, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { SearchDialog } from '@/components/ui/SearchDialog';

const PAGE_LABELS: Record<string, string> = {
  map: 'Карта',
  characters: 'Персонажи',
  factions: 'Фракции',
  dynasties: 'Династии',
  notes: 'Заметки',
  wiki: 'Вики',
  timeline: 'Хронология',
  files: 'Файлы',
  settings: 'Настройки',
  appearance: 'Внешний вид',
  dogmas: 'Догмы',
  graph: 'Граф связей',
  new: 'Создание',
};

export const TopBar: React.FC = () => {
  const { toggleSidebar, searchOpen, setSearchOpen } = useUIStore();
  const { currentProject } = useProjectStore();
  const { currentCharacter } = useCharacterStore();
  const { currentFaction } = useFactionStore();
  const { currentDynasty } = useDynastyStore();
  const navigate = useNavigate();
  const location = useLocation();

  useHotkeys([
    { key: 'k', ctrl: true, handler: () => setSearchOpen(true), description: 'Open search' },
  ]);

  const pathParts = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; path?: string }[] = [];
    if (pathParts.length < 3) return items;

    const section = pathParts[2];
    const entityId = pathParts[3];
    const sectionLabel = PAGE_LABELS[section] || section;

    if (entityId) {
      items.push({
        label: sectionLabel,
        path: `/project/${pathParts[1]}/${section}`,
      });

      if (entityId === 'new') {
        items.push({ label: 'Создание' });
      } else {
        let entityName = entityId;

        if (section === 'characters' && currentCharacter && String(currentCharacter.id) === entityId) {
          entityName = currentCharacter.name || entityId;
        } else if (section === 'factions' && currentFaction && String(currentFaction.id) === entityId) {
          entityName = currentFaction.name || entityId;
        } else if (section === 'dynasties' && currentDynasty && String(currentDynasty.id) === entityId) {
          entityName = currentDynasty.name || entityId;
        }

        items.push({ label: entityName });
      }
    } else {
      items.push({ label: sectionLabel });
    }

    return items;
  }, [pathParts, currentCharacter, currentFaction, currentDynasty]);

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', cursor: 'pointer', mr: 3 }}
            onClick={() => navigate('/')}
          >
            ⚔️ Campaigner
          </Typography>

          <Breadcrumbs sx={{ flexGrow: 1, color: 'text.secondary' }}>
            <MuiLink
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="small" />
              Home
            </MuiLink>

            {currentProject && pathParts.length > 1 && (
              <MuiLink
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => navigate(`/project/${currentProject.id}`)}
              >
                {currentProject.name}
              </MuiLink>
            )}

            {breadcrumbItems.map((item, i) =>
              item.path ? (
                <MuiLink
                  key={i}
                  component="button"
                  underline="hover"
                  color="inherit"
                  onClick={() => navigate(item.path!)}
                >
                  {item.label}
                </MuiLink>
              ) : (
                <Typography key={i} color="text.primary" sx={{
                  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </Typography>
              )
            )}
          </Breadcrumbs>

          {currentProject && (
            <Tooltip title="Поиск (Ctrl+K)">
              <Button
                onClick={() => setSearchOpen(true)}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 1.5, px: 2, py: 0.5,
                  textTransform: 'none', fontSize: '0.8rem', gap: 1,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <SearchIcon fontSize="small" />
                Поиск...
                <Typography component="span" sx={{
                  fontSize: '0.6rem', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 0.5, px: 0.6, py: 0.1, ml: 1, color: 'rgba(255,255,255,0.3)',
                }}>
                  Ctrl+K
                </Typography>
              </Button>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};