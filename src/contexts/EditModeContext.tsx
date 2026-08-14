import React, { createContext, useContext, useState } from 'react';

interface EditModeContextType {
  editMode: boolean;
  toggleEditMode: () => void;
  editorOpen: boolean;
  editorInitialTab: string | undefined;
  openEditor: (subTab?: string) => void;
  closeEditor: () => void;
}

const EditModeContext = createContext<EditModeContextType>({
  editMode: false,
  toggleEditMode: () => {},
  editorOpen: false,
  editorInitialTab: undefined,
  openEditor: () => {},
  closeEditor: () => {},
});

export const useEditMode = () => useContext(EditModeContext);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<string | undefined>(undefined);

  const toggleEditMode = () => {
    setEditMode(prev => {
      if (prev) setEditorOpen(false);
      return !prev;
    });
  };

  const openEditor = (subTab?: string) => {
    setEditorInitialTab(subTab);
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  return (
    <EditModeContext.Provider value={{ editMode, toggleEditMode, editorOpen, editorInitialTab, openEditor, closeEditor }}>
      {children}
    </EditModeContext.Provider>
  );
}
