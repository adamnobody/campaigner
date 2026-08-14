import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, ButtonBase, Menu, MenuItem, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/store/useNoteStore';
import { useUIStore } from '@/store/useUIStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTagStore } from '@/store/useTagStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { wikiApi } from '@/api/wiki';
import { notesApi } from '@/api/notes';
import { uploadsApi } from '@/api/uploads';
import { resolveUploadAssetUrl } from '@/utils/uploadAssetUrl';
import { formatClock, formatRelativeTime } from '@/utils/relativeTime';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import { CoverDropzone } from '@/components/document-editor/CoverDropzone';
import { DocChip } from '@/components/document-editor/DocChip';
import { DocumentShell, Inspector, InspectorHint, InspectorSection, InspectorStat } from '@/components/document-editor/DocumentShell';
import { EntityPickerDialog } from '@/components/document-editor/EntityPickerDialog';
import { useDocumentChrome } from '@/components/document-editor/useDocumentChrome';
import { useNoteDocument } from '@/components/document-editor/useNoteDocument';
import { WikiInfobox } from '@/components/document-editor/WikiInfobox';
import { WorldTextEditor, type DocumentEntity, type WorldTextEditorHandle } from '@/components/document-editor/WorldTextEditor';
import { countSections, extractEntityLinks, parseDocument, type InfoboxField } from '@/components/document-editor/documentMeta';
import { buildWikiToc } from '@/pages/wiki/wikiToc';
import type { WikiLink } from '@campaigner/shared';

const CATEGORIES = ['location', 'item', 'phenomenon'] as const;

export const WikiArticlePage: React.FC = () => {
  const { t, i18n } = useTranslation(['wiki', 'common', 'notes']);
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const pid = Number.parseInt(projectId!, 10);
  const nid = Number.parseInt(noteId!, 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const untitled = t('wiki:untitled');
  const doc = useNoteDocument(nid, untitled);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const setTags = useNoteStore((state) => state.setTags);
  const notes = useNoteStore((state) => state.notes);
  const showSnackbar = useUIStore((state) => state.showSnackbar);
  const showConfirmDialog = useUIStore((state) => state.showConfirmDialog);
  const branches = useBranchStore((state) => state.branches);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const characters = useCharacterStore((state) => state.characters);
  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters);
  const { fetchTags, findOrCreateTagsByNames } = useTagStore();
  const editorRef = useRef<WorldTextEditorHandle>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const [categoryAnchor, setCategoryAnchor] = useState<HTMLElement | null>(null);
  const [entityOpen, setEntityOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [wikiNotes, setWikiNotes] = useState<{ id: number; title: string }[]>([]);
  const [wikiLinks, setWikiLinks] = useState<WikiLink[]>([]);

  useEffect(() => {
    if (doc.note && doc.note.noteType !== 'wiki') {
      navigate(`/project/${pid}/notes/${nid}`, { replace: true });
    }
  }, [doc.note, navigate, nid, pid]);

  useEffect(() => {
    void fetchCharacters(pid);
    void fetchTags(pid);
    void notesApi.getAll(pid, { noteType: 'wiki', limit: 500 }).then((res) => {
      setWikiNotes((res.data.data.items || []).map((note) => ({ id: note.id, title: note.title })));
    }).catch(() => {});
    void wikiApi.getLinks(pid, nid).then((res) => setWikiLinks(res.data.data || [])).catch(() => {});
  }, [fetchCharacters, fetchTags, nid, pid]);

  useEffect(() => {
    if (doc.loadError) showSnackbar(t('wiki:article.loadError'), 'error');
  }, [doc.loadError, showSnackbar, t]);

  const defaultInfobox: InfoboxField[] = useMemo(() => [
    { key: t('wiki:editor.infoboxWhere'), value: '' },
    { key: t('wiki:editor.infoboxStart'), value: '' },
    { key: t('wiki:editor.infoboxArea'), value: '' },
  ], [t]);
  const infobox = doc.meta.infobox?.length ? doc.meta.infobox : defaultInfobox;
  const status = doc.meta.status ?? 'draft';
  const branchName = branches.find((branch) => branch.id === activeBranchId)?.name ?? '';
  const saveText = doc.saveStatus === 'saving'
    ? t('common:document.saving')
    : doc.saveStatus === 'unsaved'
      ? t('common:document.unsaved')
      : doc.saveStatus === 'error'
        ? t('common:document.saveError')
        : t('common:document.savedAt', { time: doc.lastSaved ? formatClock(doc.lastSaved, i18n.language) : '' });

  const handleDelete = useCallback(() => {
    showConfirmDialog(
      t('wiki:confirm.deleteTitle'),
      t('wiki:confirm.deleteArticleMessage', { title: doc.title || untitled }),
      async () => {
        try {
          await deleteNote(nid);
          navigate(`/project/${pid}/wiki`);
        } catch {
          showSnackbar(t('wiki:snackbar.deleteError'), 'error');
        }
      },
    );
  }, [deleteNote, doc.title, navigate, nid, pid, showConfirmDialog, showSnackbar, t, untitled]);

  const moreItems = useMemo(() => [{
    label: t('wiki:article.delete'),
    onClick: handleDelete,
    danger: true,
  }], [handleDelete, t]);

  useDocumentChrome({
    saveText,
    readMode,
    focusMode,
    readIcon: 'book',
    moreItems,
    onToggleRead: () => setReadMode((value) => !value),
    onToggleFocus: () => setFocusMode((value) => !value),
    onDone: () => {
      void doc.persist().then(() => navigate(`/project/${pid}/wiki`));
    },
  });

  useHotkeys(useMemo(() => [{ key: 's', ctrl: true, handler: () => { void doc.persist(); } }], [doc.persist]));

  const entities: DocumentEntity[] = useMemo(() => [
    ...characters.map((character) => ({
      id: `character:${character.id}`,
      label: character.name,
      href: `/project/${pid}/characters/${character.id}`,
      group: t('common:searchDialog.types.character'),
    })),
    ...wikiNotes.filter((note) => note.id !== nid).map((note) => ({
      id: `wiki:${note.id}`,
      label: note.title,
      href: `/__note__/${note.id}`,
      group: t('wiki:page.title'),
    })),
  ], [characters, nid, pid, t, wikiNotes]);

  const slashItems = useMemo(() => [
    { id: 'definition', label: t('wiki:editor.slashDefinition') },
    { id: 'heading', label: t('wiki:editor.slashSection') },
    { id: 'infobox-field', label: t('wiki:editor.slashInfobox') },
    { id: 'entity-link', label: t('wiki:editor.slashEntity') },
  ], [t]);

  const insertEntity = async (entity: DocumentEntity) => {
    editorRef.current?.insertHtml(`<a class="entity-pill" href="${entity.href}">${entity.label}</a>&nbsp;`);
    const noteMatch = entity.href.match(/^\/__note__\/(\d+)$/);
    if (noteMatch) {
      try {
        await wikiApi.createLink({ projectId: pid, sourceNoteId: nid, targetNoteId: Number(noteMatch[1]), label: entity.label });
        const res = await wikiApi.getLinks(pid, nid);
        setWikiLinks(res.data.data || []);
      } catch {
        // duplicate
      }
    }
    setEntityOpen(false);
  };

  const uploadCover = async (file: File) => {
    try {
      const uploaded = await uploadsApi.uploadDocumentImage(file);
      doc.setMeta((meta) => ({ ...meta, cover: uploaded.data.data.path }));
    } catch {
      showSnackbar(t('wiki:snackbar.coverError'), 'error');
    }
  };

  const addTag = async () => {
    if (!tagDraft.trim() || !doc.note) return;
    const names = [...(doc.note.tags ?? []).map((tag) => tag.name), tagDraft.trim()];
    const ids = await findOrCreateTagsByNames(pid, names);
    await setTags(doc.note.id, ids);
    setTagDraft('');
  };

  const toc = useMemo(() => buildWikiToc(doc.body), [doc.body]);
  const libraryPaths = notes
    .filter((note) => note.noteType === 'wiki')
    .map((note) => parseDocument(note.content).meta.cover)
    .filter((item): item is string => Boolean(item));

  const linked = [
    ...wikiLinks.map((link) => ({
      id: `link-${link.id}`,
      label: link.sourceNoteId === nid ? link.targetTitle : link.sourceTitle,
      href: `/project/${pid}/wiki/${link.sourceNoteId === nid ? link.targetNoteId : link.sourceNoteId}`,
    })),
    ...extractEntityLinks(doc.body).map((item, index) => ({
      id: `md-${index}`,
      label: item.label,
      href: item.href.startsWith('/__note__/')
        ? `/project/${pid}/wiki/${item.href.slice('/__note__/'.length)}`
        : item.href,
    })),
  ].filter((item, index, all) => all.findIndex((other) => other.label === item.label) === index);

  if (!doc.ready && !doc.missing) return <LoadingScreen />;

  const empty = !doc.body.trim();
  const sections = countSections(doc.body);
  const metaLine = empty
    ? `${t('wiki:editor.wordMeta', { words: 0 })} • ${t('wiki:editor.expected', { count: 400 })} • ${t('wiki:editor.example')}`
    : `${t('wiki:editor.wordMeta', { words: doc.words })} • ${t('wiki:editor.sectionsMeta', { count: sections })} • ${t('wiki:editor.changedAgo', { time: formatRelativeTime(doc.note?.updatedAt ?? new Date().toISOString(), i18n.language) })}`;

  return (
    <>
      <DocumentShell
        maxWidth={840}
        focus={focusMode}
        inspector={(
          <Inspector>
            <InspectorSection title={t('wiki:editor.publication')}>
              <InspectorStat label={t('wiki:editor.status')} value={status === 'canon' ? t('wiki:editor.canon') : t('wiki:editor.draft')} />
              <InspectorStat label={t('wiki:editor.branch')} value={branchName || '—'} />
              <InspectorStat
                label={t('wiki:editor.category')}
                value={doc.meta.category ? t(`wiki:categories.${doc.meta.category}`, { defaultValue: doc.meta.category }) : t('wiki:editor.categoryNone')}
              />
              <Box
                onClick={() => !readMode && doc.setMeta((meta) => ({ ...meta, playerVisible: !meta.playerVisible }))}
                sx={{ cursor: readMode ? 'default' : 'pointer' }}
              >
                <InspectorStat label={t('wiki:editor.playerVisible')} value={doc.meta.playerVisible ? t('wiki:editor.yes') : t('wiki:editor.no')} />
              </Box>
            </InspectorSection>
            <InspectorSection title={t('wiki:editor.toc')}>
              {toc.length === 0 ? (
                <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem' }}>{t('wiki:editor.tocEmpty')}</Typography>
              ) : toc.map((item, index) => (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    background: 'transparent',
                    color: index === 0 ? 'text.primary' : 'text.secondary',
                    borderLeft: index === 0 ? '2px solid' : '2px solid transparent',
                    borderColor: index === 0 ? 'primary.main' : 'transparent',
                    pl: 1.25 + (item.level - 2) * 1.25,
                    py: 0.55,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {item.text}
                </Box>
              ))}
            </InspectorSection>
            <InspectorSection title={t('wiki:editor.tags')}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {(doc.note?.tags ?? []).map((tag) => (
                  <DocChip key={tag.id} label={tag.name} active />
                ))}
                <TextField
                  variant="standard"
                  placeholder={t('wiki:editor.addTag')}
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void addTag(); }}
                  InputProps={{ disableUnderline: true }}
                  sx={{ width: 88, '& input': { fontSize: '0.75rem' } }}
                />
              </Box>
            </InspectorSection>
            <InspectorSection
              title={t('wiki:editor.links')}
              action={(
                <ButtonBase onClick={() => setEntityOpen(true)} sx={{ color: 'text.disabled' }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                </ButtonBase>
              )}
            >
              {linked.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.55, cursor: 'pointer' }}
                >
                  <AccountTreeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography noWrap sx={{ fontSize: '0.8rem' }}>{item.label}</Typography>
                </Box>
              ))}
              {empty ? (
                <Box sx={{ pt: 1.5 }}>
                  <Typography sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '.14em', textTransform: 'uppercase', pb: 0.75 }}>
                    {t('wiki:editor.startHint')}
                  </Typography>
                  <InspectorHint>{t('wiki:editor.startHintBody')}</InspectorHint>
                </Box>
              ) : null}
            </InspectorSection>
            <InspectorSection title={t('wiki:editor.conflicts')}>
              <TextField
                multiline
                fullWidth
                minRows={2}
                placeholder={t('wiki:editor.conflictsHint')}
                value={doc.meta.aside ?? ''}
                onChange={(event) => doc.setMeta((meta) => ({ ...meta, aside: event.target.value }))}
                InputProps={{ readOnly: readMode }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '0.78rem',
                    backgroundColor: alpha(theme.palette.common.white, 0.02),
                    p: 1.25,
                    borderRadius: 1.5,
                  },
                  '& fieldset': { border: 0 },
                }}
              />
            </InspectorSection>
          </Inspector>
        )}
      >
        <CoverDropzone
          path={doc.meta.cover}
          readOnly={readMode}
          uploadLabel={t('wiki:editor.upload')}
          libraryLabel={t('wiki:editor.library')}
          hint={t('wiki:editor.coverHint')}
          libraryPaths={libraryPaths}
          onUpload={(file) => { void uploadCover(file); }}
          onPick={(path) => doc.setMeta((meta) => ({ ...meta, cover: path }))}
        />
        <Box sx={{ display: 'flex', gap: 1, pb: 2, flexWrap: 'wrap' }}>
          <DocChip
            muted={!doc.meta.category}
            active={Boolean(doc.meta.category)}
            label={doc.meta.category ? t(`wiki:categories.${doc.meta.category}`, { defaultValue: doc.meta.category }) : t('wiki:editor.pickCategory')}
            onClick={(event) => !readMode && setCategoryAnchor(event.currentTarget)}
          />
          <DocChip
            active={status === 'canon'}
            label={status === 'canon' ? t('wiki:editor.canon') : t('wiki:editor.draft')}
            onClick={() => !readMode && doc.setMeta((meta) => ({ ...meta, status: meta.status === 'canon' ? 'draft' : 'canon' }))}
          />
          {branchName ? <DocChip muted label={branchName} icon={<AccountTreeIcon sx={{ fontSize: 13 }} />} /> : null}
        </Box>
        <TextField
          fullWidth
          variant="standard"
          value={doc.title}
          onChange={(event) => doc.setTitle(event.target.value)}
          placeholder={untitled}
          InputProps={{ disableUnderline: true, readOnly: readMode }}
          sx={{
            '& input': {
              fontFamily: theme.campaigner.typography.display,
              fontSize: { xs: '2.15rem', md: '2.7rem' },
              fontWeight: 600,
              lineHeight: 1.05,
            },
          }}
        />
        <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem', pt: 1.1, pb: 2.5 }}>{metaLine}</Typography>
        {doc.ready ? (
          <WorldTextEditor
            key={nid}
            ref={editorRef}
            initialMarkdown={doc.body}
            readOnly={readMode}
            placeholder={t('wiki:editor.placeholder')}
            slashTitle={t('wiki:editor.slashTitle')}
            slashItems={slashItems}
            mentionItems={entities}
            showSelectionToolbar
            floatContent={(
              <WikiInfobox
                title={t('wiki:editor.infobox')}
                fields={infobox}
                emptyLabel={t('wiki:editor.infoboxEmpty')}
                addLabel={t('wiki:editor.infoboxAdd')}
                readOnly={readMode}
                onChange={(fields) => doc.setMeta((meta) => ({ ...meta, infobox: fields }))}
              />
            )}
            onChange={doc.setBody}
            onCommand={(id) => {
              if (id === 'entity-link') setEntityOpen(true);
              if (id === 'infobox-field') {
                doc.setMeta((meta) => ({
                  ...meta,
                  infobox: [...(meta.infobox?.length ? meta.infobox : defaultInfobox), { key: t('wiki:editor.infoboxAdd'), value: '' }],
                }));
              }
            }}
            onUploadImage={async (file) => {
              const uploaded = await uploadsApi.uploadDocumentImage(file);
              const path = uploaded.data.data.path;
              return { path, url: (await resolveUploadAssetUrl(path)) || path };
            }}
            onNavigate={(href) => navigate(href.startsWith('/__note__/') ? `/project/${pid}/wiki/${href.slice('/__note__/'.length)}` : href)}
          />
        ) : null}
        {empty && !readMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, flexWrap: 'wrap', pt: 2 }}>
            {slashItems.map((item) => (
              <DocChip
                key={item.id}
                label={item.label}
                onClick={() => {
                  if (item.id === 'entity-link' || item.id === 'infobox-field') {
                    editorRef.current?.focus();
                    if (item.id === 'entity-link') setEntityOpen(true);
                    if (item.id === 'infobox-field') {
                      doc.setMeta((meta) => ({
                        ...meta,
                        infobox: [...(meta.infobox?.length ? meta.infobox : defaultInfobox), { key: t('wiki:editor.infoboxAdd'), value: '' }],
                      }));
                    }
                    return;
                  }
                  if (item.id === 'definition') editorRef.current?.insertHtml(`<p><strong>${t('wiki:editor.slashDefinition')}.</strong> </p>`);
                  if (item.id === 'heading') editorRef.current?.insertHtml('<h2></h2>');
                }}
              />
            ))}
          </Box>
        ) : null}
      </DocumentShell>
      <Menu anchorEl={categoryAnchor} open={Boolean(categoryAnchor)} onClose={() => setCategoryAnchor(null)}>
        {CATEGORIES.map((item) => (
          <MenuItem
            key={item}
            onClick={() => {
              doc.setMeta((meta) => ({ ...meta, category: item }));
              setCategoryAnchor(null);
            }}
          >
            {t(`wiki:categories.${item}`)}
          </MenuItem>
        ))}
      </Menu>
      <EntityPickerDialog
        open={entityOpen}
        title={t('wiki:editor.pickEntity')}
        items={entities}
        onClose={() => setEntityOpen(false)}
        onPick={(item) => { void insertEntity(item); }}
      />
      <BranchEntityMissingDialog
        open={doc.missing}
        entityName={t('wiki:article.entityName')}
        onClose={() => navigate(`/project/${pid}/wiki`, { replace: true })}
      />
    </>
  );
};
