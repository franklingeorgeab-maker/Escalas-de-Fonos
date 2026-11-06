/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/Header';
import { QuickAvailabilityChecker } from './components/QuickAvailabilityChecker';
import { TableView } from './components/TableView';
import { SmartReallocationModal } from './components/SmartReallocationModal';
import { ShiftEditorModal } from './components/ShiftEditorModal';
import { VacationModal } from './components/VacationModal';
import { FixedScheduleModal } from './components/FixedScheduleModal';
import { TemporaryShiftModal } from './components/TemporaryShiftModal';
import { AddCollaboratorModal } from './components/AddCollaboratorModal';
import { ShiftEntry } from './types';

function AppContent() {
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftEntry | null>(null);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationTherapistId, setVacationTherapistId] = useState<string | undefined>(undefined);
  const [isFixedScheduleModalOpen, setIsFixedScheduleModalOpen] = useState(false);

  // Estado para Escala Temporária (1 dia)
  const [isTemporaryModalOpen, setIsTemporaryModalOpen] = useState(false);
  const [temporaryTherapistId, setTemporaryTherapistId] = useState<string | undefined>(undefined);
  const [temporaryDate, setTemporaryDate] = useState<string | undefined>(undefined);

  // Estado para Incluir Colaborador
  const [isAddCollaboratorModalOpen, setIsAddCollaboratorModalOpen] = useState(false);

  const { activeCoverageShift, closeCoverageModal } = useSchedule();

  const handleEditShift = (shift: ShiftEntry) => {
    setEditingShift(shift);
    setIsNewShiftModalOpen(true);
  };

  const handleOpenNewShift = (prefill?: Partial<ShiftEntry>) => {
    if (prefill) {
      setEditingShift({
        id: '',
        date: prefill.date || '',
        therapistId: prefill.therapistId || '',
        unitId: prefill.unitId || '',
        morningStart: '08:00',
        morningEnd: '12:00',
        afternoonStart: '13:00',
        afternoonEnd: '17:00',
        nightStart: '',
        nightEnd: '',
        isCoverage: false,
      });
    } else {
      setEditingShift(null);
    }
    setIsNewShiftModalOpen(true);
  };

  const handleOpenVacationModal = (therapistId?: string) => {
    setVacationTherapistId(therapistId);
    setIsVacationModalOpen(true);
  };

  const handleOpenTemporaryShiftModal = (therapistId?: string, dateStr?: string) => {
    setTemporaryTherapistId(therapistId);
    setTemporaryDate(dateStr);
    setIsTemporaryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header */}
      <Header
        onOpenNewShiftModal={handleOpenNewShift}
        onOpenFixedScheduleModal={() => setIsFixedScheduleModalOpen(true)}
        onOpenTemporaryShiftModal={() => handleOpenTemporaryShiftModal()}
        onOpenAddCollaboratorModal={() => setIsAddCollaboratorModalOpen(true)}
      />

      {/* Main Single-Screen Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* 1. Quick Availability Checker by Date & Hours */}
        <QuickAvailabilityChecker />

        {/* 2. Schedule Spreadsheet Table with Inline Editing */}
        <TableView
          onEditShift={handleEditShift}
          onOpenNewShift={handleOpenNewShift}
          onOpenVacationModal={handleOpenVacationModal}
          onOpenFixedScheduleModal={() => setIsFixedScheduleModalOpen(true)}
          onOpenTemporaryShiftModal={handleOpenTemporaryShiftModal}
          onOpenAddCollaboratorModal={() => setIsAddCollaboratorModalOpen(true)}
        />
      </main>

      {/* Modals */}
      {activeCoverageShift && (
        <SmartReallocationModal
          shift={activeCoverageShift}
          onClose={closeCoverageModal}
        />
      )}

      {isNewShiftModalOpen && (
        <ShiftEditorModal
          initialShift={editingShift}
          onClose={() => {
            setIsNewShiftModalOpen(false);
            setEditingShift(null);
          }}
        />
      )}

      {isVacationModalOpen && (
        <VacationModal
          therapistId={vacationTherapistId}
          onClose={() => {
            setIsVacationModalOpen(false);
            setVacationTherapistId(undefined);
          }}
        />
      )}

      {isFixedScheduleModalOpen && (
        <FixedScheduleModal
          onClose={() => setIsFixedScheduleModalOpen(false)}
        />
      )}

      {isTemporaryModalOpen && (
        <TemporaryShiftModal
          initialTherapistId={temporaryTherapistId}
          initialDate={temporaryDate}
          onClose={() => {
            setIsTemporaryModalOpen(false);
            setTemporaryTherapistId(undefined);
            setTemporaryDate(undefined);
          }}
        />
      )}

      {isAddCollaboratorModalOpen && (
        <AddCollaboratorModal
          onClose={() => setIsAddCollaboratorModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <AppContent />
    </ScheduleProvider>
  );
}
