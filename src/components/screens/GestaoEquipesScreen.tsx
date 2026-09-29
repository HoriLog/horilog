import React, { useState } from 'react';
import { TeamMemberSchedule } from '../../types';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { updateTeamMember } from '../../services/api/teamMembers';
import { useToast } from '../../hooks/useToast';
import { downloadFile, toCsv } from '../../utils/csv';
import { NO_DATA, initials, orDash } from '../../utils/format';
import { TangramCard } from '../tangram/TangramCard';
import { TangramBadge } from '../tangram/TangramBadge';
import { TangramButton } from '../tangram/TangramButton';
import {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Shuffle,
  ShieldCheck,
  UserPlus,
  Phone,
  X,
  FileCheck,
} from 'lucide-react';

export const GestaoEquipesScreen: React.FC = () => {
  const { teamMembers, loading: teamMembersLoading } = useTeamMembers();
  const [selectedMemberForSwap, setSelectedMemberForSwap] = useState<TeamMemberSchedule | null>(null);
  const [swapTargetMemberId, setSwapTargetMemberId] = useState<string>('');
  const [actionSuccessMsg, showToast] = useToast(4000);
  const [filterRole, setFilterRole] = useState('todos');

  const filteredMembers = teamMembers.filter((m) => {
    if (filterRole === 'todos') return true;
    return m.role.includes(filterRole);
  });

  const handleSwapPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForSwap || !swapTargetMemberId) return;

    const targetMember = teamMembers.find((m) => m.id === swapTargetMemberId);
    if (!targetMember) return;

    const label = (m: TeamMemberSchedule) => `${m.name} (${m.role})`;
    const a = selectedMemberForSwap;

    try {
      await Promise.all([
        updateTeamMember(a.id, { pairedWith: label(targetMember) }),
        updateTeamMember(targetMember.id, { pairedWith: label(a) }),
        ...teamMembers
          .filter(
            (m) =>
              m.id !== a.id &&
              m.id !== targetMember.id &&
              (m.pairedWith === label(a) || m.pairedWith === label(targetMember))
          )
          .map((m) => updateTeamMember(m.id, { pairedWith: null })),
      ]);
      showToast(`Rodízio efetuado: ${selectedMemberForSwap.name} agora está pareado com ${targetMember.name}!`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao registrar rodízio.');
    }
    setSelectedMemberForSwap(null);
    setSwapTargetMemberId('');
  };

  const handleRegisterMandatoryRest = async (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    try {
      await updateTeamMember(memberId, {
        continuousDrivingHours: '0h 00m',
        journeyStatus: 'Pausa Obrigatória',
      });
      showToast(`Pausa obrigatória de 30min registrada para ${member?.name}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao registrar pausa.');
    }
  };

  const scored = teamMembers.filter((m) => typeof m.complianceScore === 'number');
  const legalComplianceAvg = scored.length
    ? `${Math.round(scored.reduce((acc, m) => acc + (m.complianceScore as number), 0) / scored.length)}%`
    : '—';
  const crewPlates = new Set(teamMembers.map((m) => m.assignedPlate).filter(Boolean)).size;
  const reserveDrivers = teamMembers.filter((m) => m.role === 'Motorista Reserva').length;

  const handleExport = () => {
    const rows = filteredMembers.map((m) => [
      m.name, m.role, m.assignedPlate, m.currentRoute, m.shift, m.drivingHoursToday,
      m.continuousDrivingHours, m.dailyOvertimeHours, m.journeyStatus, m.phone,
    ]);
    downloadFile(
      `escala_equipes_${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(['Nome', 'Cargo', 'Placa', 'Rota', 'Turno', 'Jornada hoje', 'Direção contínua', 'HE', 'Status jornada', 'Telefone'], rows)
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006C49] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE]">
              Horizonte Equipes
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E2D72] tracking-tight">
              Gestão de Equipes • Jornada, Rodízio e Escala
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Operações Horizonte Logística • Controle da Lei do Motorista (Lei 13.103), formação de duplas e escalas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Exportar Escala (CSV)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Conformidade Legal</span>
            <ShieldCheck className="w-4 h-4 text-[#006C49]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#006C49]">{legalComplianceAvg}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Média dos registros com medição</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Veículos com Equipe</span>
            <Users className="w-4 h-4 text-[#004AC6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1C30]">{crewPlates}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Placas com profissional alocado</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Próximos do Limite (5h30)</span>
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#D97706]">
            {teamMembers.filter((m) => m.journeyStatus === 'Atenção Limite Legal').length}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Exige parada para descanso</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between text-[#737686] text-xs font-semibold mb-1">
            <span>Motoristas Reserva CD</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB]">{reserveDrivers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cadastrados como reserva</div>
        </div>
      </div>

      {/* Main Container */}
      <TangramCard
        title="Quadro Operacional de Escalas e Jornada de Trabalho"
        subtitle="Monitoramento individual de horas de volante e composição de duplas"
      >
        {/* Role Filters */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos os Profissionais' },
              { id: 'Motorista', label: 'Motoristas' },
              { id: 'Ajudante', label: 'Ajudantes de Carga' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterRole === tab.id
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {filteredMembers.length} profissionais listados
          </span>
        </div>

        {/* Team Members List */}
        <div className="divide-y divide-[#F1F5F9]">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Col 1: Member profile and pairing */}
                <div className="flex items-start gap-3 min-w-70">
                  <div className="w-12 h-12 rounded-full bg-[#EFF4FF] text-[#004AC6] font-bold text-sm flex items-center justify-center border-2 border-white shadow-xs shrink-0">
                    {initials(member.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0B1C30]">{member.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {member.role}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      Veículo: <strong className="font-mono text-slate-800">{member.assignedPlate || NO_DATA}</strong>
                      {member.cnhCategory && ` • CNH Cat. ${member.cnhCategory}`}
                    </div>

                    {member.pairedWith && (
                      <div className="text-[11px] text-[#004AC6] font-semibold mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Pareado com: {member.pairedWith}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2: Legal Journey Monitor (Lei 13.103) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Direção Contínua
                    </span>
                    <div
                      className={`font-black text-sm mt-0.5 ${
                        member.journeyStatus === 'Atenção Limite Legal'
                          ? 'text-rose-600'
                          : 'text-[#0B1C30]'
                      }`}
                    >
                      {orDash(member.continuousDrivingHours)}
                    </div>
                    <span className="text-[9px] text-slate-400">Limite legal: 5h 30m</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Jornada Hoje / HE
                    </span>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">
                      {orDash(member.drivingHoursToday)}
                    </div>
                    <span className="text-[9px] text-slate-500">
                      HE: {orDash(member.dailyOvertimeHours)}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Status da Jornada
                    </span>
                    <div className="mt-1">
                      {member.journeyStatus === 'Em Direção Normal' && (
                        <TangramBadge variant="success">Direção Normal</TangramBadge>
                      )}
                      {member.journeyStatus === 'Atenção Limite Legal' && (
                        <TangramBadge variant="danger">Próximo do Limite</TangramBadge>
                      )}
                      {member.journeyStatus === 'Pausa Obrigatória' && (
                        <TangramBadge variant="info">Pausa de 30m</TangramBadge>
                      )}
                      {member.journeyStatus === 'Descanso Interjornada' && (
                        <TangramBadge variant="neutral">Interjornada 11h</TangramBadge>
                      )}
                      {member.journeyStatus === 'Folga Semanal' && (
                        <TangramBadge variant="neutral">Folga Semanal</TangramBadge>
                      )}
                      {!member.journeyStatus && <span className="text-slate-400">{NO_DATA}</span>}
                    </div>
                  </div>
                </div>

                {/* Col 3: Weekly Work Scale Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Escala Semanal ({member.shift ?? NO_DATA})
                  </span>
                  <div className="flex items-center gap-1">
                    {(member.weeklyScale ?? []).length === 0 && (
                      <span className="text-[11px] text-slate-400">{NO_DATA}</span>
                    )}
                    {(member.weeklyScale ?? []).map((day, idx) => (
                      <div
                        key={idx}
                        className={`w-7 h-7 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
                          day.status === 'Trabalho'
                            ? 'bg-[#EFF4FF] text-[#004AC6]'
                            : day.status === 'Folga'
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-emerald-100 text-[#006C49]'
                        }`}
                        title={`${day.day}: ${day.status}`}
                      >
                        <span>{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 4: Operational Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMemberForSwap(member)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004AC6] hover:bg-[#EFF4FF] border border-[#BFDBFE] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Realizar rodízio de dupla"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Rodízio
                  </button>

                  {member.journeyStatus === 'Atenção Limite Legal' && (
                    <button
                      type="button"
                      onClick={() => handleRegisterMandatoryRest(member.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Acionar Pausa 30m
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </TangramCard>

      {/* Modal: Rodízio de Equipe / Trocar Dupla */}
      {selectedMemberForSwap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSwapPair}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-[#004AC6]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Rodízio de Equipe & Troca de Dupla
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForSwap(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#0B1C30]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Profissional Selecionado:
                </span>
                <div className="font-bold text-sm text-[#0B1C30] mt-0.5">
                  {selectedMemberForSwap.name} ({selectedMemberForSwap.role})
                </div>
                <div className="text-slate-500 mt-0.5">
                  Atualmente pareado com: {selectedMemberForSwap.pairedWith || 'Nenhum'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Selecione o Novo Parceiro de Rota para a Dupla:
                </label>
                <select
                  required
                  value={swapTargetMemberId}
                  onChange={(e) => setSwapTargetMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-[#004AC6] focus:outline-hidden"
                >
                  <option value="">-- Escolha um colaborador --</option>
                  {teamMembers
                    .filter((m) => m.id !== selectedMemberForSwap.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role}){m.currentRoute ? ` - Rota: ${m.currentRoute}` : ''}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  O rodízio periódico evita sobrecarga muscular e fadiga em rotas com descarga manual intensiva.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForSwap(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#004AC6] hover:bg-[#003899] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Confirmar Rodízio de Dupla
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
