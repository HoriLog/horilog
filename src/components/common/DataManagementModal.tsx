import React, { useState } from 'react';
import {
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Database,
  Truck,
  Package,
  Users,
  FileText,
} from 'lucide-react';
import { TangramModal } from '../tangram/TangramModal';
import { TangramButton } from '../tangram/TangramButton';
import { OperationalStorage } from '../../services/storageService';
import { importVehicles, importTeam, importShipments } from '../../services/csvImport';
import { importRoutesCsv } from '../../services/api/deliveries';
import { importRoutePlanningCsv, importLoadingEventsCsv, importCrewScheduleCsv } from '../../services/api/tourPlanning';
import { importInvoicesCsv } from '../../services/api/invoices';
import { downloadFile } from '../../utils/csv';

export interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'templates' | 'backup'>('import');
  const [importCategory, setImportCategory] = useState<
    'vehicles' | 'deliveries' | 'team' | 'shipments' | 'route-planning' | 'loading-events' | 'crew-schedule' | 'invoices'
  >('vehicles');
  const [csvContent, setCsvContent] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stats = {
    vehicles: OperationalStorage.getVehicles().length,
    deliveries: OperationalStorage.getDeliveries().length,
    incidents: OperationalStorage.getIncidents().length,
    team: OperationalStorage.getTeamMembers().length,
    shipments: OperationalStorage.getShipments().length,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const processCsvImport = async () => {
    if (!csvContent.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, selecione um arquivo ou cole o conteúdo CSV.' });
      return;
    }
    try {
      let count = 0;
      let rejected: Array<{ line: number; reason: string }> = [];

      if (importCategory === 'vehicles') {
        const current = OperationalStorage.getVehicles();
        const res = importVehicles(csvContent, new Set(current.map((v) => v.plate)));
        OperationalStorage.setVehicles([...res.items, ...current]);
        count = res.items.length;
        rejected = res.rejected;
      } else if (importCategory === 'deliveries') {
        const res = await importRoutesCsv(csvContent);
        count = res.deliveriesImported;
        rejected = res.rejected;
        setFeedback({
          type: count > 0 ? 'success' : 'error',
          message: `${res.toursImported} rota(s) e ${res.deliveriesImported} parada(s) importadas.${
            rejected.length
              ? ` ${rejected.length} linha(s) ignorada(s): ` +
                rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
                (rejected.length > 3 ? '…' : '')
              : ''
          }`,
        });
        if (count > 0) {
          setCsvContent('');
          onDataChanged();
        }
        return;
      } else if (importCategory === 'team') {
        const current = OperationalStorage.getTeamMembers();
        const keys = new Set(current.map((m) => m.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() + '|' + m.role));
        const res = importTeam(csvContent, keys);
        OperationalStorage.setTeamMembers([...res.items, ...current]);
        count = res.items.length;
        rejected = res.rejected;
      } else if (importCategory === 'route-planning') {
        const res = await importRoutePlanningCsv(csvContent);
        rejected = res.rejected;
        setFeedback({
          type: res.updated + res.inserted > 0 ? 'success' : 'error',
          message: `${res.updated} rota(s) atualizada(s), ${res.inserted} rota(s) nova(s) criada(s) a partir do planejamento.${
            rejected.length
              ? ` ${rejected.length} linha(s) ignorada(s): ` +
                rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
                (rejected.length > 3 ? '…' : '')
              : ''
          }`,
        });
        if (res.updated + res.inserted > 0) setCsvContent('');
        onDataChanged();
        return;
      } else if (importCategory === 'loading-events') {
        const res = await importLoadingEventsCsv(csvContent);
        rejected = res.rejected;
        setFeedback({
          type: res.inserted > 0 ? 'success' : 'error',
          message: `${res.inserted} evento(s) de carregamento importado(s).${
            rejected.length
              ? ` ${rejected.length} linha(s) ignorada(s): ` +
                rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
                (rejected.length > 3 ? '…' : '')
              : ''
          }`,
        });
        if (res.inserted > 0) setCsvContent('');
        onDataChanged();
        return;
      } else if (importCategory === 'crew-schedule') {
        const res = await importCrewScheduleCsv(csvContent);
        rejected = res.rejected;
        setFeedback({
          type: res.updated + res.inserted > 0 ? 'success' : 'error',
          message: `${res.updated} rota(s) com tripulação atualizada, ${res.inserted} rota(s) nova(s) criada(s).${
            rejected.length
              ? ` ${rejected.length} linha(s) ignorada(s): ` +
                rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
                (rejected.length > 3 ? '…' : '')
              : ''
          }`,
        });
        if (res.updated + res.inserted > 0) setCsvContent('');
        onDataChanged();
        return;
      } else if (importCategory === 'invoices') {
        const res = await importInvoicesCsv(csvContent);
        rejected = res.rejected;
        setFeedback({
          type: res.invoicesImported > 0 ? 'success' : 'error',
          message: `${res.invoicesImported} nota(s) fiscal(is) e ${res.itemsImported} item(ns) importados.${
            rejected.length
              ? ` ${rejected.length} linha(s) ignorada(s): ` +
                rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
                (rejected.length > 3 ? '…' : '')
              : ''
          }`,
        });
        if (res.invoicesImported > 0) setCsvContent('');
        onDataChanged();
        return;
      } else {
        const current = OperationalStorage.getShipments();
        const res = importShipments(csvContent, new Set(current.map((s) => s.id)));
        OperationalStorage.setShipments([...res.items, ...current]);
        count = res.items.length;
        rejected = res.rejected;
      }

      const detail = rejected.length
        ? ` ${rejected.length} linha(s) ignorada(s): ` +
          rejected.slice(0, 3).map((r) => `linha ${r.line} (${r.reason})`).join('; ') +
          (rejected.length > 3 ? '…' : '')
        : '';
      setFeedback({
        type: count > 0 ? 'success' : 'error',
        message: `${count} registro(s) importado(s).${detail} Campos ausentes na planilha ficam como "não informado".`,
      });
      if (count > 0) {
        setCsvContent('');
        onDataChanged();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao processar o arquivo CSV. Verifique o cabeçalho e o separador.' });
    }
  };

  const handleDownloadTemplate = (
    cat: 'vehicles' | 'deliveries' | 'team' | 'shipments' | 'route-planning' | 'loading-events' | 'crew-schedule' | 'invoices'
  ) => {
    let csv = '';
    let filename = '';

    if (cat === 'vehicles') {
      csv = 'Placa,Modelo,Tipo,Motorista,Telefone,Localizacao\nBRA-4E29,Volvo FH 540,Carreta 9 Eixos,João da Silva,(11) 98765-4321,Horizonte Cajamar - SP\n';
      filename = 'modelo_veiculos_horizonte.csv';
    } else if (cat === 'deliveries') {
      csv =
        'tour_display_id;tour_date;distribution_center_id;driver_name;truck_license_plate;poc_external_id;poc_name;critical_poc;status;trip_start_timestamp;trip_end_timestamp;visit_order;delivery_window;within_radius;skipped_reason;out_of_radius_reason;actual_delivery_time;arrived_at;finished_at;last_reason_rescheduled;total_delivered_vol;total_refused_vol;total_delivered_weight_kilograms;total_refused_weight_kilograms;tour_status\n' +
        '438739;2026-09-24;0598;Joao Pedro Silva;RUY0H47;88092;Jacira Soares;true;CONCLUDED;2026-09-24T11:05:15.759Z;2026-09-24T16:01:14.676Z;1;;true;;;1140;2026-09-24T11:26:25.924Z;2026-09-24T11:43:43.428Z;;0.3434;0;55.65;0;CONCLUDED\n';
      filename = 'modelo_entregas_rotas_horizonte.csv';
    } else if (cat === 'team') {
      csv = 'Nome,Cargo,Telefone,PlacaVeiculo,Turno\nLucas Silva,Motorista Titular,(11) 99887-1122,BRA-4E29,Turno A (05h - 14h)\n';
      filename = 'modelo_equipes_horizonte.csv';
    } else if (cat === 'shipments') {
      csv = 'Codigo,NFe,Cliente,Origem,Destino,Peso\nREM-1001,NFe-99210,Atacadão S/A,CD Cajamar/SP,CD Curitiba/PR,32.000 kg\n';
      filename = 'modelo_remessas_horizonte.csv';
    } else if (cat === 'route-planning') {
      csv =
        'MAPA;Placa;Motorista;Classificação;KM Prev.;Tempo Prev. (+almoço);Total de caixas;% Ocupação Caixas;Total peso;% Ocupação Peso;% Tempo;% Eficiência;Cidades +Entregas;Data Entrega\n' +
        '438739;RUY0H47;202;Padrao;25.56;6:37:00;53.15;75.92;1415;97.01;100;97.01;CARUARU (28);9/24/2026\n';
      filename = 'modelo_planejamento_rota_horizonte.csv';
    } else if (cat === 'loading-events') {
      csv =
        'Mapa;Fase;DtOper;HrOper;Usuario;Lacre-1;Lacre-2;Lacre-3;Lacre-4;Conferente;KmAtual\n' +
        '438739;Carregado;9/24/2026;4:36;WMS;254;254;0;0;0;65219\n';
      filename = 'modelo_carregamento_wms_horizonte.csv';
    } else if (cat === 'crew-schedule') {
      csv =
        'Data;Mapa;Placa;Regiao Entrega;Superv. Rota;Nome Superv. Rota;Motorista;Nome Motorista;Ajudante 1;Nome Ajudante 1;Ajudante 2;Nome Ajudante 2\n' +
        '9/24/2026;438739;RUY0H47;;7;VANs;202;JOAO PEDRO SILVA;;;;\n';
      filename = 'modelo_escala_equipe_horizonte.csv';
    } else if (cat === 'invoices') {
      csv = 'Este arquivo é gerado por exportação direta do sistema de faturamento — sem modelo simplificado. Use o export original.';
      filename = 'notas_fiscais_use_export_original.txt';
    }

    downloadFile(filename, '\uFEFF' + csv);
  };

  const handleExportBackup = () => {
    const json = OperationalStorage.exportAll();
    downloadFile(`horizonte_dados_operacionais_${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!confirm('Restaurar o backup substitui os registros das coleções presentes no arquivo. Continuar?')) return;
      const ok = OperationalStorage.importAll(String(ev.target?.result ?? ''));
      setFeedback(ok ? { type: 'success', message: 'Backup restaurado.' } : { type: 'error', message: 'Arquivo de backup inválido.' });
      if (ok) onDataChanged();
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja limpar todos os registros operacionais? Esta ação não pode ser desfeita.')) {
      OperationalStorage.clearAll();
      setFeedback({ type: 'success', message: 'Todos os registros foram removidos. O sistema está limpo para nova entrada de dados reais.' });
      onDataChanged();
    }
  };

  return (
    <TangramModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestão de Dados Reais da Operação"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Current Operational Data Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1E2D72]" />
            <div>
              <div className="font-bold text-[#1E2D72] text-base">{stats.vehicles}</div>
              <div className="text-[11px] text-slate-500">Veículos</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#1E2D72]" />
            <div>
              <div className="font-bold text-[#1E2D72] text-base">{stats.deliveries}</div>
              <div className="text-[11px] text-slate-500">Entregas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E2D72]" />
            <div>
              <div className="font-bold text-[#1E2D72] text-base">{stats.team}</div>
              <div className="text-[11px] text-slate-500">Equipe</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1E2D72]" />
            <div>
              <div className="font-bold text-[#1E2D72] text-base">{stats.shipments}</div>
              <div className="text-[11px] text-slate-500">Remessas</div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2 px-3 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#1E2D72] text-[#1E2D72]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Importar CSV / Planilha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`pb-2 px-3 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'border-[#1E2D72] text-[#1E2D72]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Modelos de Planilha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-3 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#1E2D72] text-[#1E2D72]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backup & Limpeza
          </button>
        </div>

        {activeTab === 'import' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Tipo de Dados para Importar:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'vehicles', label: 'Veículos / Frota' },
                  { id: 'deliveries', label: 'Entregas (rotas do BEES)' },
                  { id: 'route-planning', label: 'Planejamento de Rota (Mapa)' },
                  { id: 'loading-events', label: 'Carregamento (WMS)' },
                  { id: 'crew-schedule', label: 'Escala de Equipe' },
                  { id: 'invoices', label: 'Notas Fiscais' },
                  { id: 'team', label: 'Motoristas / Equipes' },
                  { id: 'shipments', label: 'Remessas de Carga' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setImportCategory(item.id as any)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      importCategory === item.id
                        ? 'bg-[#1E2D72] text-white border-[#1E2D72]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload or Text Paste */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Selecione o arquivo CSV ou cole o conteúdo:
              </label>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#1E2D72] border border-[#BFDBFE] font-bold text-xs hover:bg-[#DBEAFE] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#F39818]" />
                  <span>Escolher Arquivo .csv</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">ou cole diretamente abaixo:</span>
              </div>

              <textarea
                rows={5}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Exemplo: Placa,Modelo,Tipo,Motorista,Telefone,Localizacao..."
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#1E2D72]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <TangramButton variant="outline" size="sm" onClick={onClose}>
                Fechar
              </TangramButton>
              <TangramButton
                variant="primary"
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={processCsvImport}
              >
                Importar Dados Reais
              </TangramButton>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Baixe os modelos oficiais formatados para alimentar o ERP com os dados da sua frota e operação:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1E2D72]">Frota de Veículos</div>
                  <div className="text-[11px] text-slate-500">Placas, modelos, categorias</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('vehicles')}
                  className="flex items-center gap-1 text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F39818]" />
                  <span>Baixar CSV</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1E2D72]">Notas & Entregas Last-Mile</div>
                  <div className="text-[11px] text-slate-500">NFe, CTe, clientes, valores</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('deliveries')}
                  className="flex items-center gap-1 text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F39818]" />
                  <span>Baixar CSV</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1E2D72]">Motoristas & Equipes</div>
                  <div className="text-[11px] text-slate-500">Escalas, telefones, turnos</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('team')}
                  className="flex items-center gap-1 text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F39818]" />
                  <span>Baixar CSV</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1E2D72]">Cargas & Remessas</div>
                  <div className="text-[11px] text-slate-500">Origens, destinos, SLA</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('shipments')}
                  className="flex items-center gap-1 text-xs font-bold text-[#1E2D72] hover:bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F39818]" />
                  <span>Baixar CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#1E2D72]">Exportar Backup Operacional</div>
                <div className="text-[11px] text-slate-500">
                  Baixe todos os dados cadastrados em formato JSON seguro
                </div>
              </div>
              <TangramButton
                variant="primary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportBackup}
              >
                Exportar JSON
              </TangramButton>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#1E2D72]">Restaurar Backup</div>
                <div className="text-[11px] text-slate-500">Carrega um arquivo JSON exportado por este sistema</div>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E2D72] bg-[#EFF6FF] border border-[#BFDBFE] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher JSON</span>
                <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            <div className="p-3 bg-red-50/70 rounded-xl border border-red-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-red-700">Limpar Todos os Registros</div>
                <div className="text-[11px] text-red-600">
                  Remove todos os dados para recomeçar o cadastro do zero
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-white border border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Dados</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </TangramModal>
  );
};
