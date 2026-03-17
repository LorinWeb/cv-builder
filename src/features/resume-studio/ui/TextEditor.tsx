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
import { Field } from '@base-ui/react/field';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useController, type Path } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioDraft } from '../types';

const EDITOR_TOOLBAR_CLASS_NAME =
  'resume-studio-editor-toolbar flex-wrap items-center gap-1 border-b border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] px-2.5 py-2';

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

function getTextEditorMinHeightClass(minRows: number) {
  if (minRows <= 1) {
    return 'min-h-11';
  }

  if (minRows <= 4) {
    return 'min-h-28';
  }

  return 'min-h-32';
}

export function TextEditor({
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
  const hideToolbarTimeoutRef = useRef<number | null>(null);
  const markdown = typeof field.value === 'string' ? field.value : '';
  const lastMarkdownRef = useRef(markdown);
  const errorMessage = fieldState.error?.message;
  const minHeightClassName = getTextEditorMinHeightClass(minRows);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const plugins = useMemo(
    () =>
      mode === 'inline'
        ? [
            linkPlugin({ disableAutoLink: true }),
            linkDialogPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarClassName: EDITOR_TOOLBAR_CLASS_NAME,
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                  <CodeToggle />
                  <CreateLink />
                </>
              ),
            }),
          ]
        : [
            linkPlugin({ disableAutoLink: true }),
            linkDialogPlugin(),
            listsPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarClassName: EDITOR_TOOLBAR_CLASS_NAME,
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                  <CodeToggle />
                  <CreateLink />
                  <ListsToggle options={['bullet', 'number']} />
                </>
              ),
            }),
          ],
    [mode]
  );

  useEffect(() => {
    if (markdown === lastMarkdownRef.current) {
      return;
    }

    lastMarkdownRef.current = markdown;
    editorRef.current?.setMarkdown(markdown);
  }, [markdown]);

  useEffect(() => {
    return () => {
      if (hideToolbarTimeoutRef.current !== null) {
        window.clearTimeout(hideToolbarTimeoutRef.current);
      }
    };
  }, []);

  function handleFocusCapture() {
    if (hideToolbarTimeoutRef.current !== null) {
      window.clearTimeout(hideToolbarTimeoutRef.current);
      hideToolbarTimeoutRef.current = null;
    }

    setIsToolbarVisible(true);
  }

  function handleBlurCapture() {
    if (hideToolbarTimeoutRef.current !== null) {
      window.clearTimeout(hideToolbarTimeoutRef.current);
    }

    hideToolbarTimeoutRef.current = window.setTimeout(() => {
      hideToolbarTimeoutRef.current = null;

      if (wrapperRef.current?.contains(document.activeElement)) {
        return;
      }

      setIsToolbarVisible(false);
    }, 0);
  }

  return (
    <Field.Root className={rootClassName} invalid={Boolean(errorMessage)} name={name}>
      <div className={joinClassNames('flex flex-col gap-1.5', containerClassName)}>
        <Field.Label
          className={
            hideLabel ? 'sr-only' : 'text-sm font-medium text-(--color-primary)'
          }
        >
          {label}
        </Field.Label>
        <div
          ref={wrapperRef}
          data-testid={testId}
          data-toolbar-visible={isToolbarVisible ? 'true' : 'false'}
          className="resume-studio-editor-shell"
          onFocusCapture={handleFocusCapture}
          onBlurCapture={handleBlurCapture}
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
                <span className="text-sm text-[rgba(23,49,42,0.52)]">{placeholder}</span>
              ) : null
            }
            plugins={plugins}
            className={joinClassNames(
              'group overflow-hidden rounded-2xl border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition focus-within:border-(--color-primary) focus-within:ring-2 focus-within:ring-[rgba(1,135,65,0.15)]',
              errorMessage
                ? 'border-[rgba(155,44,44,0.35)]'
                : 'border-[rgba(74,127,122,0.25)]'
            )}
            contentEditableClassName={joinClassNames(
              'max-h-64 overflow-y-auto px-3.5 py-2.5 text-sm text-[#17312a] outline-none',
              minHeightClassName,
              mode === 'inline'
                ? '[&_p]:m-0 [&_p+_p]:mt-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-[rgba(137,186,182,0.12)] [&_code]:px-1 [&_code]:py-[0.1em]'
                : '[&_p]:m-0 [&_p+_p]:mt-2.5 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-[rgba(137,186,182,0.12)] [&_code]:px-1 [&_code]:py-[0.1em]'
            )}
            spellCheck
          />
        </div>
        {description ? (
          <Field.Description className="text-xs leading-5 text-(--color-secondary)">
            {description}
          </Field.Description>
        ) : null}
        {errorMessage ? (
          <p className="text-xs font-medium text-[#9b2c2c]">{errorMessage}</p>
        ) : null}
      </div>
    </Field.Root>
  );
}
