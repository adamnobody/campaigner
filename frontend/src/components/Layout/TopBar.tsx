import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box,
  Breadcrumbs, Link as MuiLink, Button, Tooltip, FormControl, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { SearchDialog } from '@/components/ui/SearchDialog';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { shallow } from 'zustand/shallow';
import { useBranchStore } from '@/store/useBranchStore';
import { branchesApi } from '@/api/branches';
import { getErrorMessage } from '@/utils/error';

const KNOWN_SECTION_PATHS = new Set([
  'map',
  'characters',
  'states',
  'factions',
  'dynasties',
  'notes',
  'wiki',
  'timeline',
  'files',
  'settings',
  'appearance',
  'dogmas',
  'graph',
]);

function breadcrumbSectionLabel(section: string, tNav: (key: string) => string): string {
  if (KNOWN_SECTION_PATHS.has(section)) return tNav(`breadcrumbs.section.${section}`);
  return section;
}

const languageSwitcherToolbarSx = {
  minWidth: 108,
  flexShrink: 0,
  '& .MuiOutlinedInput-root': {
    color: 'rgba(255,255,255,0.88)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.55)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.85)' },
  },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.85)' },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.55)',
    '&.Mui-focused': { color: 'rgba(255,255,255,0.75)' },
    '&.MuiInputLabel-shrink': { color: 'rgba(255,255,255,0.68)' },
  },
} as const;

export const TopBar: React.FC = () => {
  const { t: tNav } = useTranslation('navigation');
  const { t: tCommon } = useTranslation('common');
  const { toggleSidebar, searchOpen, setSearchOpen, showSnackbar } = useUIStore((state) => ({
    toggleSidebar: state.toggleSidebar,
    searchOpen: state.searchOpen,
    setSearchOpen: state.setSearchOpen,
    showSnackbar: state.showSnackbar,
  }), shallow);
  const currentProject = useProjectStore((state) => state.currentProject);
  const currentCharacter = useCharacterStore((state) => state.currentCharacter);
  const currentFaction = useFactionStore((state) => state.currentFaction);
  const currentDynasty = useDynastyStore((state) => state.currentDynasty);
  const { branches, activeBranchId, loading: branchesLoading, fetchBranches, setActiveBranchId } = useBranchStore((state) => ({
    branches: state.branches,
    activeBranchId: state.activeBranchId,
    loading: state.loading,
    fetchBranches: state.fetchBranches,
    setActiveBranchId: state.setActiveBranchId,
  }), shallow);
  const navigate = useNavigate();
  const location = useLocation();
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const [branchNameDraft, setBranchNameDraft] = useState('');
  const [createBranchLoading, setCreateBranchLoading] = useState(false);

  const openSearchShortcut = useCallback(() => setSearchOpen(true), [setSearchOpen]);

  const searchHotkeys = useMemo(
    () => [
      {
        key: 'k',
        ctrl: true,
        handler: openSearchShortcut,
        description: tNav('topbar.openSearchHotkeyDesc'),
      },
    ],
    [openSearchShortcut, tNav]
  );

  useHotkeys(searchHotkeys);

  const pathParts = location.pathname.split('/').filter(Boolean);

  useEffect(() => {
    if (currentProject?.id) {
      fetchBranches(currentProject.id);
    }
  }, [currentProject?.id, fetchBranches]);

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; path?: string }[] = [];
    if (pathParts.length < 3) return items;

    const section = pathParts[2];
    const entityId = pathParts[3];
    const sectionLabel = breadcrumbSectionLabel(section, tNav);

    if (entityId) {
      items.push({
        label: sectionLabel,
        path: `/project/${pathParts[1]}/${section}`,
      });

      if (entityId === 'new') {
        items.push({ label: tNav('breadcrumbs.newEntity') });
      } else {
        let entityName = entityId;

        if (section === 'characters' && currentCharacter && String(currentCharacter.id) === entityId) {
          entityName = currentCharacter.name || entityId;
        } else if ((section === 'factions' || section === 'states') && currentFaction && String(currentFaction.id) === entityId) {
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
  }, [pathParts, currentCharacter, currentFaction, currentDynasty, tNav]);

  const handleOpenCreateBranch = () => {
    setBranchNameDraft('');
    setCreateBranchOpen(true);
  };

  const handleCloseCreateBranch = () => {
    if (createBranchLoading) return;
    setCreateBranchOpen(false);
    setBranchNameDraft('');
  };

  const handleCreateBranch = async () => {
    const projectId = currentProject?.id;
    const name = branchNameDraft.trim();
    if (!projectId || !name) return;

    setCreateBranchLoading(true);
    try {
      const response = await branchesApi.create({
        projectId,
        name,
        parentBranchId: activeBranchId ?? undefined,
      });
      const createdBranch = response.data.data;
      await fetchBranches(projectId);
      if (createdBranch?.id) {
        setActiveBranchId(createdBranch.id);
      }
      showSnackbar(tNav('branches.created'), 'success');
      setCreateBranchOpen(false);
      setBranchNameDraft('');
    } catch (error: unknown) {
      showSnackbar(getErrorMessage(error, tNav('branches.createFailedFallback')), 'error');
    } finally {
      setCreateBranchLoading(false);
    }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontFamily: 'inherit', color: 'primary.main', cursor: 'pointer', mr: 2, flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            ⚔️ {tCommon('appName')}
          </Typography>

          <Breadcrumbs sx={{ flexGrow: 1, color: 'text.secondary', minWidth: 0 }}>
            <MuiLink
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="small" />
              {tNav('breadcrumbs.home')}
            </MuiLink>

            {currentProject && pathParts.length > 1 && (
              <MuiLink
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => navigate(`/project/${currentProject.id}`)}
                sx={{
                  maxWidth: { xs: 120, sm: 260 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
              >
                {currentProject.name}
              </MuiLink>
            )}

            {breadcrumbItems.map((item, i) =>
              item.path ? (
                <MuiLink
                  key={`${item.path}-${i}`}
                  component="button"
                  underline="hover"
                  color="inherit"
                  onClick={() => navigate(item.path!)}
                >
                  {item.label}
                </MuiLink>
              ) : (
                <Typography
                  key={i}
                  color="text.primary"
                  sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </Typography>
              )
            )}
          </Breadcrumbs>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.25, sm: 0.75 },
              flexShrink: 0,
            }}
          >
            {currentProject && (
              <FormControl data-tour="branch-selector" size="small" sx={{ minWidth: { xs: 100, sm: 130 }, maxWidth: 160 }}>
                <Select
                  value={activeBranchId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setActiveBranchId(value === '' ? null : Number(value));
                  }}
                  displayEmpty
                  renderValue={(selected) => {
                    if (branchesLoading) return tNav('branches.loading');
                    if (branches.length === 0) return tNav('branches.nonePlaceholder');
                    const selectedBranch = branches.find((branch) => branch.id === Number(selected));
                    return selectedBranch?.name ?? tNav('branches.nonePlaceholder');
                  }}
                  sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {currentProject && (
              <Tooltip title={tNav('topbar.createBranchTooltip')}>
                <span>
                  <IconButton
                    data-tour="branch-create"
                    size="small"
                    onClick={handleOpenCreateBranch}
                    disabled={branchesLoading}
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.35)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {currentProject && (
              <Tooltip title={tNav('topbar.searchTooltip')}>
                <Button
                  data-tour="topbar-search"
                  onClick={() => setSearchOpen(true)}
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 1.5,
                    px: { xs: 1, sm: 2 },
                    py: 0.5,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    gap: 1,
                    minWidth: 0,
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.25)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  <SearchIcon fontSize="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
                  <Typography
                    component="span"
                    sx={{
                      maxWidth: { xs: 64, sm: 'none' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tNav('topbar.searchPlaceholder')}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.6rem',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 0.5,
                      px: 0.6,
                      py: 0.1,
                      ml: { xs: 0, sm: 1 },
                      color: 'rgba(255,255,255,0.3)',
                      display: { xs: 'none', md: 'inline' },
                    }}
                  >
                    Ctrl+K
                  </Typography>
                </Button>
              </Tooltip>
            )}

            <LanguageSwitcher sx={languageSwitcherToolbarSx} />
          </Box>
        </Toolbar>
      </AppBar>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Dialog open={createBranchOpen} onClose={handleCloseCreateBranch} fullWidth maxWidth="xs">
        <DialogTitle>{tNav('branches.dialogTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            margin="dense"
            label={tNav('branches.nameLabel')}
            value={branchNameDraft}
            onChange={(e) => setBranchNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !createBranchLoading) {
                e.preventDefault();
                void handleCreateBranch();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateBranch} disabled={createBranchLoading}>{tCommon('cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateBranch()}
            disabled={createBranchLoading || branchNameDraft.trim().length === 0}
          >
            {tCommon('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
