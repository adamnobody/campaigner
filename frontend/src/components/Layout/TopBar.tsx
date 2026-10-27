import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, IconButton, Box,
  Breadcrumbs, Link as MuiLink, Button, Tooltip, FormControl, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, alpha, Menu,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CropFreeIcon from '@mui/icons-material/CropFree';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useFactionStore } from '@/store/useFactionStore';
import { useDynastyStore } from '@/store/useDynastyStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { SearchDialog } from '@/components/ui/SearchDialog';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { shallow } from 'zustand/shallow';
import { useBranchStore } from '@/store/useBranchStore';
import { branchesApi } from '@/api/branches';
import { getErrorMessage } from '@/utils/error';
import { campaignerLayout } from '@/theme/designSystem';

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

export const TopBar: React.FC = () => {
  const { t: tNav } = useTranslation('navigation');
  const { t: tCommon } = useTranslation('common');
  const { toggleSidebar, searchOpen, setSearchOpen, showSnackbar, documentChrome } = useUIStore((state) => ({
    toggleSidebar: state.toggleSidebar,
    searchOpen: state.searchOpen,
    setSearchOpen: state.setSearchOpen,
    showSnackbar: state.showSnackbar,
    documentChrome: state.documentChrome,
  }), shallow);
  const currentProject = useProjectStore((state) => state.currentProject);
  const currentCharacter = useCharacterStore((state) => state.currentCharacter);
  const currentFaction = useFactionStore((state) => state.currentFaction);
  const currentDynasty = useDynastyStore((state) => state.currentDynasty);
  const currentNote = useNoteStore((state) => state.currentNote);
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
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

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
        } else if ((section === 'notes' || section === 'wiki') && currentNote && String(currentNote.id) === entityId) {
          entityName = currentNote.title || entityId;
        } else if (section === 'dynasties' && currentDynasty && String(currentDynasty.id) === entityId) {
          entityName = currentDynasty.name || entityId;
        }

        items.push({ label: entityName });
      }
    } else {
      items.push({ label: sectionLabel });
    }

    return items;
  }, [pathParts, currentCharacter, currentFaction, currentDynasty, currentNote, tNav]);

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
        setActiveBranchId(createdBranch.id, projectId);
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
      <Box
        component="header"
        sx={{
          height: campaignerLayout.contextBarHeight,
          flex: `0 0 ${campaignerLayout.contextBarHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          pl: { xs: 2, md: 6 },
          pr: { xs: 2, md: 4 },
          borderBottom: '1px solid rgba(255,255,255,.045)',
          backgroundColor: 'background.default',
          minWidth: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          <Tooltip title={tNav('topbar.toggleSidebarTooltip')}>
            <IconButton
              size="small"
              onClick={toggleSidebar}
              aria-label={tNav('topbar.toggleSidebarTooltip')}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Breadcrumbs
            separator={<Typography sx={{ color: 'rgba(232,228,220,.2)', fontSize: '0.75rem' }}>/</Typography>}
            sx={{ minWidth: 0, color: 'text.secondary', '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
          >
            <MuiLink
              component="button"
              underline="none"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              <HomeIcon sx={{ fontSize: 15 }} />
              {tNav('breadcrumbs.home')}
            </MuiLink>
            {currentProject && pathParts.length > 1 ? (
              <MuiLink
                component="button"
                underline="none"
                color="inherit"
                onClick={() => navigate(`/project/${currentProject.id}`)}
                sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}
              >
                {currentProject.name}
              </MuiLink>
            ) : null}
            {breadcrumbItems.map((item, index) => item.path ? (
              <MuiLink
                key={`${item.path}-${index}`}
                component="button"
                underline="none"
                color="inherit"
                onClick={() => navigate(item.path!)}
                sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                {item.label}
              </MuiLink>
            ) : (
              <Typography key={`${item.label}-${index}`} sx={{ color: 'text.primary', fontSize: '0.78rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </Typography>
            ))}
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {documentChrome ? (
            <>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem', pr: 0.5 }}>
                • {documentChrome.saveText}
              </Typography>
              <Button
                size="small"
                onClick={documentChrome.onToggleFocus}
                startIcon={<CropFreeIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: documentChrome.focusMode ? 'primary.main' : 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                }}
              >
                {tCommon('document.focus')}
              </Button>
              <Button
                size="small"
                onClick={documentChrome.onToggleRead}
                startIcon={documentChrome.readIcon === 'book'
                  ? <MenuBookIcon sx={{ fontSize: 16 }} />
                  : <VisibilityIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: documentChrome.readMode ? 'primary.main' : 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                }}
              >
                {tCommon('document.read')}
              </Button>
              <IconButton
                size="small"
                aria-label={tCommon('document.more')}
                onClick={(event) => setMoreAnchor(event.currentTarget)}
                sx={{ border: '1px solid rgba(255,255,255,.08)' }}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>
              <Button
                variant="contained"
                size="small"
                onClick={documentChrome.onDone}
                startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', fontWeight: 600, px: 1.75 }}
              >
                {tCommon('document.done')}
              </Button>
              <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
                {documentChrome.moreItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => {
                      setMoreAnchor(null);
                      item.onClick();
                    }}
                    sx={item.danger ? { color: 'error.main' } : undefined}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <>
          {currentProject ? (
            <FormControl data-tour="branch-selector" size="small" sx={{ minWidth: { xs: 110, md: 150 } }}>
              <Select
                value={activeBranchId ?? ''}
                inputProps={{ 'aria-label': tNav('branches.selectorLabel') }}
                onChange={(event) => {
                  const value = event.target.value;
                  setActiveBranchId(value === '' ? null : Number(value), currentProject.id);
                }}
                displayEmpty
                renderValue={(selected) => {
                  if (branchesLoading) return tNav('branches.loading');
                  if (branches.length === 0) return tNav('branches.nonePlaceholder');
                  return branches.find((branch) => branch.id === Number(selected))?.name ?? tNav('branches.nonePlaceholder');
                }}
                sx={{ height: 34, fontSize: '0.78rem', color: 'primary.main', backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06) }}
              >
                {branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {currentProject ? (
            <Tooltip title={tNav('topbar.createBranchTooltip')}>
              <span>
                <IconButton
                  data-tour="branch-create"
                  size="small"
                  onClick={handleOpenCreateBranch}
                  disabled={branchesLoading}
                  aria-label={tNav('topbar.createBranchTooltip')}
                  sx={{ border: '1px solid rgba(255,255,255,.08)' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
          {currentProject ? (
            <Button
              data-tour="topbar-search"
              onClick={() => setSearchOpen(true)}
              aria-label={tNav('topbar.searchPlaceholder')}
              size="small"
              startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
              sx={{
                height: 34,
                minWidth: { xs: 34, sm: 150 },
                justifyContent: 'flex-start',
                border: '1px solid rgba(255,255,255,.08)',
                backgroundColor: 'rgba(255,255,255,.02)',
                color: 'rgba(232,228,220,.42)',
                px: { xs: 1, sm: 1.5 },
              }}
            >
              <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: '0.78rem', flex: 1, textAlign: 'left' }}>
                {tNav('topbar.searchPlaceholder')}
              </Typography>
              <Typography component="span" sx={{ display: { xs: 'none', md: 'inline' }, fontFamily: (theme) => theme.campaigner.typography.mono, fontSize: '0.6rem', color: 'rgba(232,228,220,.25)' }}>
                Ctrl K
              </Typography>
            </Button>
          ) : null}
            <LanguageSwitcher sx={{ minWidth: 104, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.75rem' } }} />
            </>
          )}
        </Box>
      </Box>

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
            onChange={(event) => setBranchNameDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !createBranchLoading) {
                event.preventDefault();
                void handleCreateBranch();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateBranch} disabled={createBranchLoading}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={() => void handleCreateBranch()} disabled={createBranchLoading || !branchNameDraft.trim()}>{tCommon('create')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
