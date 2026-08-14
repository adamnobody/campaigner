import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, ButtonBase, Menu, MenuItem, TextField, Typography, useTheme,
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
import { formatClock, formatRelativeTime, formatShortDate } from '@/utils/relativeTime';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import { DocChip } from '@/components/document-editor/DocChip';
import { DocumentShell, Inspector, InspectorEyebrow, InspectorHint, InspectorSection, InspectorStat } from '@/components/document-editor/DocumentShell';
import { EntityPickerDialog } from '@/components/document-editor/EntityPickerDialog';
import { useDocumentChrome } from '@/components/document-editor/useDocumentChrome';
import { useNoteDocument } from '@/components/document-editor/useNoteDocument';
import { WorldTextEditor, type DocumentEntity, type WorldTextEditorHandle } from '@/components/document-editor/WorldTextEditor';
import { extractEntityLinks, readingMinutes, type NoteKind } from '@/components/document-editor/documentMeta';
import type { WikiLink } from '@campaigner/shared';

const KINDS: NoteKind[] = ['note', 'idea', 'scene', 'question'];

export const NoteEditorPage: React.FC = () => {
  const { t, i18n } = useTranslation(['notes', 'common', 'wiki']);
  const { projectId, noteId } = useParams<{ projectId: string; noteId: string }>();
  const pid = Number.parseInt(projectId!, 10);
  const nid = Number.parseInt(noteId!, 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const untitled = t('notes:untitled');
  const doc = useNoteDocument(nid, untitled);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const setTags = useNoteStore((state) => state.setTags);
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
  const [kindAnchor, setKindAnchor] = useState<HTMLElement | null>(null);
  const [entityOpen, setEntityOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [wikiNotes, setWikiNotes] = useState<{ id: number; title: string }[]>([]);
  const [wikiLinks, setWikiLinks] = useState<WikiLink[]>([]);

  useEffect(() => {
    if (doc.note?.noteType === 'wiki') {
      navigate(`/project/${pid}/wiki/${nid}`, { replace: true });
    }
  }, [doc.note?.noteType, navigate, nid, pid]);

  useEffect(() => {
    void fetchCharacters(pid);
    void fetchTags(pid);
    void notesApi.getAll(pid, { noteType: 'wiki', limit: 500 }).then((res) => {
      setWikiNotes((res.data.data.items || []).map((note) => ({ id: note.id, title: note.title })));
    }).catch(() => {});
    void wikiApi.getLinks(pid, nid).then((res) => setWikiLinks(res.data.data || [])).catch(() => {});
  }, [fetchCharacters, fetchTags, nid, pid]);

  useEffect(() => {
    if (doc.loadError) showSnackbar(t('notes:snackbar.loadError'), 'error');
  }, [doc.loadError, showSnackbar, t]);

  const kind = doc.meta.kind ?? 'note';
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
      t('notes:confirm.deleteNoteTitle'),
      t('notes:confirm.deleteNoteMessage', { title: doc.title || untitled }),
      async () => {
        try {
          await deleteNote(nid);
          navigate(`/project/${pid}/notes`);
        } catch {
          showSnackbar(t('notes:snackbar.deleteError'), 'error');
        }
      },
    );
  }, [deleteNote, doc.title, navigate, nid, pid, showConfirmDialog, showSnackbar, t, untitled]);

  const moreItems = useMemo(() => [{
    label: t('notes:editor.delete'),
    onClick: handleDelete,
    danger: true,
  }], [handleDelete, t]);

  useDocumentChrome({
    saveText,
    readMode,
    focusMode,
    readIcon: 'eye',
    moreItems,
    onToggleRead: () => setReadMode((value) => !value),
    onToggleFocus: () => setFocusMode((value) => !value),
    onDone: () => {
      void doc.persist().then(() => navigate(`/project/${pid}/notes`));
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
    ...wikiNotes.map((note) => ({
      id: `wiki:${note.id}`,
      label: note.title,
      href: `/__note__/${note.id}`,
      group: t('wiki:page.title'),
    })),
  ], [characters, pid, t, wikiNotes]);

  const slashItems = useMemo(() => [
    { id: 'heading', label: t('notes:editor.slashHeading') },
    { id: 'list', label: t('notes:editor.slashList') },
    { id: 'quote', label: t('notes:editor.slashQuote') },
    { id: 'entity-link', label: t('notes:editor.slashEntity') },
    { id: 'question', label: t('notes:editor.slashQuestion') },
    { id: 'image', label: t('notes:editor.slashImage') },
    { id: 'hr', label: t('notes:editor.slashHr') },
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
        // duplicate links are fine
      }
    }
    setEntityOpen(false);
  };

  const addTag = async () => {
    if (!tagDraft.trim() || !doc.note) return;
    const names = [...(doc.note.tags ?? []).map((tag) => tag.name), tagDraft.trim()];
    const ids = await findOrCreateTagsByNames(pid, names);
    await setTags(doc.note.id, ids);
    setTagDraft('');
  };

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

  const empty = !doc.body.trim() && !readMode;
  const minutes = readingMinutes(doc.words);
  const metaLine = empty
    ? `${t('notes:editor.wordMeta', { words: 0 })} • ${t('notes:editor.newNoteMeta')} • ${t('notes:editor.draft')}`
    : `${t('notes:editor.wordMeta', { words: doc.words })} • ${t('notes:editor.changedAgo', { time: formatRelativeTime(doc.note?.updatedAt ?? new Date().toISOString(), i18n.language) })} • ${t('notes:editor.readingTime', { count: minutes })}`;

  return (
    <>
      <DocumentShell
        focus={focusMode}
        inspector={(
          <Inspector>
            <InspectorEyebrow>{t('notes:editor.inspectorTitle')}</InspectorEyebrow>
            <InspectorSection title={t('notes:editor.inspectorTitle')}>
              <InspectorStat label={t('notes:editor.statType')} value={t(`notes:kinds.${kind}`)} />
              <InspectorStat label={t('notes:editor.statWords')} value={doc.words} />
              <InspectorStat label={t('notes:editor.statChars')} value={doc.chars} />
              <InspectorStat label={t('notes:editor.statCreated')} value={doc.note ? formatShortDate(doc.note.createdAt, i18n.language) : '—'} />
            </InspectorSection>
            <InspectorSection
              title={t('notes:editor.tags')}
              action={null}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                {(doc.note?.tags ?? []).map((tag) => (
                  <DocChip key={tag.id} label={tag.name} active muted={false} />
                ))}
                <TextField
                  variant="standard"
                  placeholder={t('notes:editor.addTag')}
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void addTag(); }}
                  InputProps={{ disableUnderline: true }}
                  sx={{ width: 88, '& input': { fontSize: '0.75rem' } }}
                />
              </Box>
            </InspectorSection>
            <InspectorSection
              title={t('notes:editor.linked')}
              action={(
                <ButtonBase onClick={() => setEntityOpen(true)} sx={{ color: 'text.disabled' }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                </ButtonBase>
              )}
            >
              {linked.length === 0 ? (
                <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem' }}>—</Typography>
              ) : linked.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.55, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                >
                  <AccountTreeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography noWrap sx={{ fontSize: '0.8rem' }}>{item.label}</Typography>
                </Box>
              ))}
            </InspectorSection>
            <InspectorSection title={t('notes:editor.whatsNext')}>
              <InspectorHint>{t('notes:editor.whatsNextBody')}</InspectorHint>
            </InspectorSection>
            <InspectorSection title={t('notes:editor.history')}>
              {doc.note ? (
                <Box sx={{ pl: 1.25, borderLeft: `1px solid ${theme.campaigner.surface.border}` }}>
                  <Typography sx={{ fontSize: '0.78rem', pb: 1.25 }}>
                    {t('notes:editor.historyUpdated')}
                    <Box component="span" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.7rem' }}>
                      {formatRelativeTime(doc.note.updatedAt, i18n.language)}
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem' }}>
                    {t('notes:editor.historyCreated')}
                    <Box component="span" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.7rem' }}>
                      {formatShortDate(doc.note.createdAt, i18n.language)}
                    </Box>
                  </Typography>
                </Box>
              ) : null}
            </InspectorSection>
          </Inspector>
        )}
      >
        <Box sx={{ display: 'flex', gap: 1, pb: 2, flexWrap: 'wrap' }}>
          <DocChip
            active
            label={t(`notes:kinds.${kind}`)}
            onClick={(event) => setKindAnchor(event.currentTarget)}
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
              color: 'text.primary',
            },
          }}
        />
        <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem', pt: 1.1, pb: 2.25 }}>
          {metaLine}
        </Typography>
        <Box sx={{ height: 1, backgroundColor: theme.campaigner.surface.border, mb: 3 }} />
        {doc.ready ? (
          <WorldTextEditor
            key={nid}
            ref={editorRef}
            initialMarkdown={doc.body}
            readOnly={readMode}
            placeholder={t('notes:editor.placeholder')}
            slashTitle={t('notes:editor.slashTitle')}
            slashItems={slashItems}
            mentionItems={entities}
            onChange={doc.setBody}
            onCommand={(id) => {
              if (id === 'entity-link') setEntityOpen(true);
              if (id === 'question') doc.setMeta((meta) => ({ ...meta, kind: 'question' }));
            }}
            onUploadImage={async (file) => {
              const uploaded = await uploadsApi.uploadDocumentImage(file);
              const path = uploaded.data.data.path;
              return { path, url: (await resolveUploadAssetUrl(path)) || path };
            }}
            onNavigate={(href) => navigate(href.startsWith('/__note__/') ? `/project/${pid}/wiki/${href.slice('/__note__/'.length)}` : href)}
          />
        ) : null}
        {empty ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', pt: 5 }}>
            {[
              { id: 'scene' as const, label: t('notes:editor.startScene') },
              { id: 'question' as const, label: t('notes:editor.startQuestion') },
              { id: 'idea' as const, label: t('notes:editor.startIdea') },
            ].map((item) => (
              <DocChip key={item.id} label={item.label} onClick={() => doc.setMeta((meta) => ({ ...meta, kind: item.id }))} />
            ))}
            <DocChip label={t('notes:editor.startMention')} onClick={() => setEntityOpen(true)} />
          </Box>
        ) : null}
      </DocumentShell>
      <Menu anchorEl={kindAnchor} open={Boolean(kindAnchor)} onClose={() => setKindAnchor(null)}>
        {KINDS.map((item) => (
          <MenuItem
            key={item}
            selected={item === kind}
            onClick={() => {
              doc.setMeta((meta) => ({ ...meta, kind: item }));
              setKindAnchor(null);
            }}
          >
            {t(`notes:kinds.${item}`)}
          </MenuItem>
        ))}
      </Menu>
      <EntityPickerDialog
        open={entityOpen}
        title={t('notes:editor.pickEntity')}
        items={entities}
        onClose={() => setEntityOpen(false)}
        onPick={(item) => { void insertEntity(item); }}
      />
      <BranchEntityMissingDialog
        open={doc.missing}
        entityName={t('notes:noteTypes.note').toLowerCase()}
        onClose={() => navigate(`/project/${pid}/notes`, { replace: true })}
      />
    </>
  );
};
