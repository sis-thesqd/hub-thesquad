"use client";

import { useState } from "react";
import type { FormState } from "../types";
import { emptyForm } from "../constants";

export const useModalState = () => {
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editPageOpen, setEditPageOpen] = useState(false);
    const [inlineFolderOpen, setInlineFolderOpen] = useState(false);
    const [inlineFolderForm, setInlineFolderForm] = useState<FormState>(emptyForm);
    const [inlineFolderLocation, setInlineFolderLocation] = useState<string>("");

    const [folderForm, setFolderForm] = useState<FormState>(emptyForm);
    const [pageForm, setPageForm] = useState<FormState>(emptyForm);
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

    return {
        createFolderOpen,
        setCreateFolderOpen,
        createPageOpen,
        setCreatePageOpen,
        editFolderOpen,
        setEditFolderOpen,
        editPageOpen,
        setEditPageOpen,
        inlineFolderOpen,
        setInlineFolderOpen,
        inlineFolderForm,
        setInlineFolderForm,
        inlineFolderLocation,
        setInlineFolderLocation,
        folderForm,
        setFolderForm,
        pageForm,
        setPageForm,
        createFolderParentId,
        setCreateFolderParentId,
    };
};
