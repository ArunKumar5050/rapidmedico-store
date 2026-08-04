import { create } from 'zustand';
import { KycDocument } from '../types/models';
import { KycDocumentType } from '../types/enums';

interface KycState {
  documents: Record<string, KycDocument>;
  currentWizardStep: number;
  setDocuments: (docs: KycDocument[]) => void;
  updateDocument: (docType: KycDocumentType, docData: KycDocument) => void;
  setCurrentWizardStep: (step: number) => void;
}

export const useKycStore = create<KycState>((set) => ({
  documents: {},
  currentWizardStep: 0,
  setDocuments: (docs) =>
    set({
      documents: docs.reduce((acc, doc) => {
        acc[doc.type] = doc;
        return acc;
      }, {} as Record<string, KycDocument>),
    }),
  updateDocument: (docType, docData) =>
    set((state) => ({
      documents: { ...state.documents, [docType]: docData },
    })),
  setCurrentWizardStep: (currentWizardStep) => set({ currentWizardStep }),
}));
