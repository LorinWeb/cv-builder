import {
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useController, type Path } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioDraft } from '../types';
import { ResumeStudioFieldFrame } from './form-fields';

const EDITOR_TOOLBAR_CLASS_NAME =
  'resume-studio-editor-toolbar flex-wrap items-center gap-1 border-b border-(--color-border-subtle) bg-(--color-surface-subtle) px-2.5 py-2';

interface TextEditorProps {
  containerClassName?: string;
  description?: string;
  hideLabel?: boolean;
  label: string;
  minRows?: number;
  mode?: 'block' | 'inline';
  name: Path<ResumeStudioDraft>;
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

function createTextEditorPlugins(mode: TextEditorMode) {
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
  containerClassName,
  description,
  hideLabel = false,
  label,
  minRows = 1,
  mode = 'block',
  name,
  placeholder,
  rootClassName,
  testId,
}: TextEditorProps) {
  const { field, fieldState } = useController<ResumeStudioDraft>({
    name,
  });
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const controlId = getTextEditorControlId(name);
  const labelId = `${controlId}-label`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorMessageId = fieldState.error?.message ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorMessageId].filter(Boolean).join(' ') || undefined;
  const markdown = typeof field.value === 'string' ? field.value : '';
  const lastMarkdownRef = useRef(markdown);
  const errorMessage = fieldState.error?.message;
  const minHeightClassName = getTextEditorMinHeightClass(minRows);
  const plugins = useMemo(() => createTextEditorPlugins(mode), [mode]);

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
    editableElement.setAttribute('aria-labelledby', labelId);

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
  }, [controlId, describedBy, errorMessage, labelId]);

  return (
    <ResumeStudioFieldFrame
      containerClassName={containerClassName}
      description={description}
      errorMessage={errorMessage}
      errorMessageId={errorMessageId}
      hideLabel={hideLabel}
      invalid={Boolean(errorMessage)}
      label={label}
      labelId={labelId}
      labelMode="plain"
      name={name}
      rootClassName={rootClassName}
      descriptionId={descriptionId}
    >
      <div
        ref={wrapperRef}
        data-testid={testId}
        className="resume-studio-editor-shell"
      >
        <MDXEditor
          ref={editorRef}
          markdown={markdown}
          onBlur={() => field.onBlur()}
          onChange={(nextMarkdown, initialMarkdownNormalize) => {
            lastMarkdownRef.current = nextMarkdown;

            if (initialMarkdownNormalize || nextMarkdown === markdown) {
              return;
            }

            field.onChange(nextMarkdown);
          }}
          placeholder={
            placeholder ? (
              <span className="text-sm text-(--color-text-placeholder)">{placeholder}</span>
            ) : null
          }
          plugins={plugins}
          className={joinClassNames(
            'group overflow-hidden rounded-2xl border bg-(--color-surface-base) shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus-within:border-(--color-focus-border) focus-within:ring-2 focus-within:ring-(--color-focus-ring)',
            errorMessage
              ? 'border-[rgba(155,44,44,0.35)]'
              : 'border-(--color-border-control)'
          )}
          contentEditableClassName={joinClassNames(
            'max-h-64 overflow-y-auto px-3.5 py-2.5 text-sm text-(--color-text-body) outline-none',
            minHeightClassName,
            mode === 'inline'
              ? '[&_p]:m-0 [&_p+_p]:mt-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-(--color-inline-code-background) [&_code]:px-1 [&_code]:py-[0.1em]'
              : '[&_p]:m-0 [&_p+_p]:mt-2.5 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-(--color-inline-code-background) [&_code]:px-1 [&_code]:py-[0.1em]'
          )}
          spellCheck
        />
      </div>
    </ResumeStudioFieldFrame>
  );
});
