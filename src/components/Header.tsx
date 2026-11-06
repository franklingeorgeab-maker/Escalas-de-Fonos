import React from 'react';
import { Plus, Building2, Zap, UserPlus } from 'lucide-react';

interface HeaderProps {
  onOpenNewShiftModal: () => void;
  onOpenFixedScheduleModal: () => void;
  onOpenTemporaryShiftModal: () => void;
  onOpenAddCollaboratorModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewShiftModal,
  onOpenFixedScheduleModal,
  onOpenTemporaryShiftModal,
  onOpenAddCollaboratorModal,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Nome: Escalas */}
          <span className="text-base font-bold text-slate-900 tracking-tight">
            Escalas
          </span>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            {/* Botão: Incluir Colaborador */}
            <button
              onClick={onOpenAddCollaboratorModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors whitespace-nowrap border border-teal-300 shadow-xs"
              title="Cadastrar novo fonoaudiólogo no sistema com cor personalizada"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-700" />
              <span>Incluir Colaborador</span>
            </button>

            {/* Opção de alocar em escala avulsa */}
            <button
              onClick={onOpenTemporaryShiftModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors whitespace-nowrap border border-amber-300 shadow-xs"
              title="Alocar profissional avulso (1 dia)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Avulso</span>
            </button>

            {/* Item para definir escala fixa por empresa */}
            <button
              onClick={onOpenFixedScheduleModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap border border-slate-200"
              title="Definir escala fixa semanal por empresa e alocar profissionais"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Escala Fixa por Empresa</span>
            </button>

            {/* Botão: Nova Escala */}
            <button
              onClick={onOpenNewShiftModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Escala</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
