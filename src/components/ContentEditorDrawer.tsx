import React, { Suspense, lazy } from 'react';
import { X, LayoutGrid, Loader2 } from 'lucide-react';
import { useEditMode } from '../contexts/EditModeContext';

const ContentManager = lazy(() =>
  import('../features/ContentManager').then(m => ({ default: m.ContentManager }))
);

export function ContentEditorDrawer() {
  const { editorOpen, closeEditor, editorInitialTab } = useEditMode();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          editorOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeEditor}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 ${
          editorOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Content Manager</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Edit, add or remove content</p>
            </div>
          </div>
          <button
            onClick={closeEditor}
            className="p-2 rounded-xl text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {editorOpen && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
              }
            >
              <ContentManager initialSubTab={editorInitialTab as any} />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}
