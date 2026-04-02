import {
  addExportVisitor$,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  realmPlugin,
  type MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useController, useFormContext, type Path } from 'react-hook-form';
import { $isLineBreakNode } from 'lexical';

import { joinClassNames } from '../../../helpers/classNames';
import { normalizeResumeStudioMarkdown } from '../draft';
import type { ResumeStudioDraft } from '../types';

const EDITOR_TOOLBAR_CLASS_NAME =
  'resume-studio-editor-toolbar flex-wrap items-center gap-1 border-b border-(--color-border-subtle) bg-(--color-surface-subtle) px-3 py-2';

interface TextEditorProps {
  description?: string;
  hideLabel?: boolean;
  label: string;
  layout?: 'compact' | 'document';
  minRows?: number;
  mode?: 'block' | 'inline';
  name: Path<ResumeStudioDraft>;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  rootClassName?: string;
  testId?: string;
}

type TextEditorMode = NonNullable<TextEditorProps['mode']>;

function getTextEditorControlId(name: Path<ResumeStudioDraft>) {
  return `resume-studio-editor-${name.replace(/[^a-z0-9]+/gi, '-')}`;
}

function getTextEditorMinHeightClass(minRows: number) {
  if (minRows <= 1) {
    return 'min-h-11';
  }

  if (minRows <= 4) {
    return 'min-h-28';
  }

  return 'min-h-32';
}

function InlineToolbarContents() {
  return (
    <>
      <UndoRedo />
      <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
      <CodeToggle />
      <CreateLink />
    </>
  );
}

function BlockToolbarContents() {
  return (
    <>
      <UndoRedo />
      <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
      <CodeToggle />
      <CreateLink />
      <ListsToggle options={['bullet', 'number']} />
    </>
  );
}

const preserveManualHardBreaksPlugin = realmPlugin({
  init(realm) {
    realm.pub(addExportVisitor$, {
      priority: 100,
      testLexicalNode: $isLineBreakNode,
      visitLexicalNode: ({ actions, mdastParent }) => {
        actions.appendToParent(mdastParent, { type: 'break' });
      },
    });
  },
});

function createTextEditorPlugins({
  isDocumentLayout,
  mode,
}: {
  isDocumentLayout: boolean;
  mode: TextEditorMode;
}) {
  if (isDocumentLayout) {
    return [
      preserveManualHardBreaksPlugin(),
      linkPlugin({ disableAutoLink: true }),
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      diffSourcePlugin({ viewMode: 'source' }),
    ];
  }

  return mode === 'inline'
    ? [
        linkPlugin({ disableAutoLink: true }),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName: EDITOR_TOOLBAR_CLASS_NAME,
          toolbarContents: InlineToolbarContents,
        }),
      ]
    : [
        linkPlugin({ disableAutoLink: true }),
        linkDialogPlugin(),
        listsPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName: EDITOR_TOOLBAR_CLASS_NAME,
          toolbarContents: BlockToolbarContents,
        }),
      ];
}

export const TextEditor = memo(function TextEditor({
  description,
  hideLabel = false,
  label,
  layout = 'compact',
  minRows = 1,
  mode = 'block',
  name,
  onValueChange,
  placeholder,
  rootClassName,
  testId,
}: TextEditorProps) {
  const { setValue } = useFormContext<ResumeStudioDraft>();
  const { field, fieldState } = useController<ResumeStudioDraft>({
    name,
  });
  const markdown = typeof field.value === 'string' ? field.value : '';
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const latestMarkdownPropRef = useRef(markdown);
  const latestOnValueChangeRef = useRef(onValueChange);
  const controlId = getTextEditorControlId(name);
  const shouldRenderLabel = !hideLabel;
  const labelId = `${controlId}-label`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorMessageId = fieldState.error?.message ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorMessageId].filter(Boolean).join(' ') || undefined;
  const lastMarkdownRef = useRef<string | null>(null);
  const errorMessage = fieldState.error?.message;
  const isDocumentLayout = layout === 'document';
  const plugins = useMemo(
    () => createTextEditorPlugins({ isDocumentLayout, mode }),
    [isDocumentLayout, mode]
  );

  const commitMarkdown = useCallback((nextMarkdown: string) => {
    const normalizedMarkdown = isDocumentLayout
      ? normalizeResumeStudioMarkdown(nextMarkdown)
      : nextMarkdown;

    lastMarkdownRef.current = normalizedMarkdown;

    if (normalizedMarkdown === latestMarkdownPropRef.current) {
      return;
    }

    setValue(name, normalizedMarkdown, {
      shouldDirty: true,
      shouldTouch: true,
    });
    latestOnValueChangeRef.current?.(normalizedMarkdown);
  }, [isDocumentLayout, name, setValue]);

  useEffect(() => {
    latestMarkdownPropRef.current = markdown;
    latestOnValueChangeRef.current = onValueChange;
  }, [markdown, onValueChange]);

  useEffect(() => {
    if (markdown === lastMarkdownRef.current) {
      return;
    }

    lastMarkdownRef.current = markdown;
    editorRef.current?.setMarkdown(markdown);
  }, [markdown]);

  useEffect(() => {
    const editableElement = wrapperRef.current?.querySelector<HTMLElement>(
      '[contenteditable="true"]'
    );

    if (!editableElement) {
      return;
    }

    editableElement.id = controlId;

    if (shouldRenderLabel) {
      editableElement.setAttribute('aria-labelledby', labelId);
      editableElement.removeAttribute('aria-label');
    } else {
      editableElement.removeAttribute('aria-labelledby');
      editableElement.setAttribute('aria-label', label);
    }

    if (describedBy) {
      editableElement.setAttribute('aria-describedby', describedBy);
    } else {
      editableElement.removeAttribute('aria-describedby');
    }

    if (errorMessage) {
      editableElement.setAttribute('aria-invalid', 'true');
    } else {
      editableElement.removeAttribute('aria-invalid');
    }
  }, [controlId, describedBy, errorMessage, label, labelId, shouldRenderLabel]);

  return (
    <div
      className={joinClassNames(
        'flex flex-col',
        shouldRenderLabel ? 'gap-2' : 'gap-0',
        rootClassName
      )}
    >
      {shouldRenderLabel ? (
        <p id={labelId} className="text-sm font-medium text-(--color-text-strong)">
          {label}
        </p>
      ) : null}

        <div
          ref={wrapperRef}
          data-testid={testId}
          className={joinClassNames(
            'resume-studio-editor-shell',
            isDocumentLayout && 'min-h-full'
          )}
        >
          <MDXEditor
          ref={editorRef}
          markdown={markdown}
          onBlur={() => field.onBlur()}
          onChange={commitMarkdown}
          placeholder={
            placeholder ? (
              <span className="text-sm text-(--color-text-placeholder)">{placeholder}</span>
            ) : null
          }
          plugins={plugins}
          className={joinClassNames(
            'group overflow-hidden rounded-none border-0 bg-transparent transition',
            isDocumentLayout
              ? '[&_.mdxeditor-diff-source-wrapper]:min-h-full [&_.mdxeditor-diff-source-wrapper]:overflow-visible [&_.cm-editor]:h-auto [&_.cm-editor]:min-h-full [&_.cm-editor]:overflow-visible [&_.cm-scroller]:h-auto [&_.cm-scroller]:min-h-full [&_.cm-scroller]:overflow-visible [&_.cm-content]:min-h-full'
              : joinClassNames(
                  'rounded-2xl border bg-(--color-surface-base) shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus-within:border-(--color-focus-border) focus-within:ring-2 focus-within:ring-(--color-focus-ring)',
                  errorMessage
                    ? 'border-[rgba(155,44,44,0.35)]'
                    : 'border-(--color-border-control)'
                )
          )}
          contentEditableClassName={joinClassNames(
            isDocumentLayout
              ? 'min-h-full px-6 py-5 text-[15px] leading-7 text-(--color-text-body) outline-none'
              : joinClassNames(
                  'max-h-64 overflow-y-auto px-3.5 py-2.5 text-sm text-(--color-text-body) outline-none',
                  getTextEditorMinHeightClass(minRows)
                ),
            mode === 'inline'
              ? '[&_p]:m-0 [&_p+_p]:mt-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-(--color-inline-code-background) [&_code]:px-1 [&_code]:py-[0.1em]'
              : '[&_p]:m-0 [&_p+_p]:mt-2.5 [&_ul]:my-2.5 [&_ul]:pl-5 [&_ol]:my-2.5 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-(--color-inline-code-background) [&_code]:px-1 [&_code]:py-[0.1em]'
          )}
          spellCheck
        />
      </div>

      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-(--color-text-muted)">
          {description}
        </p>
      ) : null}

      {errorMessage ? (
        <p id={errorMessageId} className="text-xs font-medium text-[#9b2c2c]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
