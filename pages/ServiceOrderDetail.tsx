import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckSquare, Camera, PenTool, Save, Wand2, Plus, Trash2, X, Package, FileCheck, RotateCcw, DollarSign, Clock, Calendar, Timer, History, Lock, FileText, Download, AlertTriangle, ArrowLeft, ChevronDown } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { OSStatus, ServiceOrder, PartUsed, PartCatalogItem, OSPhoto, TimeEntry, OSType } from '../types';
import { generateOSReportSummary } from '../services/geminiService';
import { mockData } from '../services/mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ServiceOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'pecas' | 'fotos' | 'tempo' | 'finalizar'>('info');
  
  // Data State
  const [os, setOs] = useState<ServiceOrder | null>(null);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [photos, setPhotos] = useState<OSPhoto[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [catalog, setCatalog] = useState<PartCatalogItem[]>([]);
  
  // Form State
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  
  // Time Tracking State
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [activeTimerEntry, setActiveTimerEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showPartModal, setShowPartModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOSDetails();
  }, [id]);

  useEffect(() => {
    // Load catalog when modal is opened or component mounts
    const loadCatalog = async () => {
      const data = await mockData.getCatalog();
      setCatalog(data);
    };
    loadCatalog();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (activeTimerEntry && !activeTimerEntry.end_time) {
      const startTime = new Date(activeTimerEntry.start_time).getTime();
      
      timerIntervalRef.current = window.setInterval(() => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimerEntry]);

  const fetchOSDetails = async () => {
    setLoading(true);
    
    if (id) {
        const osData = await mockData.getServiceOrderById(id);
        if (osData) {
            setOs(osData);
            setNotes(osData.resolution_notes || '');
            setInternalNotes(osData.internal_notes || '');
            if (osData.client_signature) setSignature(osData.client_signature);
            
            // Fetch parts
            const parts = await mockData.getOSParts(id);
            setPartsUsed(parts);
        }
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar detalhes da OS...</div>;
  if (!os) return <div className="p-8 text-center text-red-500">Ordem de Serviço não encontrada.</div>;

  // --- Helpers ---
  const getStatusLabel = (status: string) => {
    switch (status) {
      case OSStatus.POR_INICIAR: return 'Por Iniciar';
      case OSStatus.INICIADA: return 'Iniciada';
      case OSStatus.PARA_ORCAMENTO: return 'Para Orçamento';
      case OSStatus.ORCAMENTO_ENVIADO: return 'Orçamento Enviado';
      case OSStatus.AGUARDA_PECAS: return 'Aguarda Peças';
      case OSStatus.PECAS_RECEBIDAS: return 'Peças Recebidas';
      case OSStatus.CONCLUIDA: return 'Concluída';
      case OSStatus.CANCELADA: return 'Cancelada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OSStatus.POR_INICIAR: return 'bg-gray-100 text-gray-700 border-gray-200';
      case OSStatus.INICIADA: return 'bg-blue-50 text-blue-700 border-blue-200';
      case OSStatus.PARA_ORCAMENTO: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case OSStatus.ORCAMENTO_ENVIADO: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case OSStatus.AGUARDA_PECAS: return 'bg-orange-50 text-orange-700 border-orange-200';
      case OSStatus.PECAS_RECEBIDAS: return 'bg-teal-50 text-teal-700 border-teal-200';
      case OSStatus.CONCLUIDA: return 'bg-green-50 text-green-700 border-green-200';
      case OSStatus.CANCELADA: return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Time Tracking Handlers ---
  
  const handleStartTimer = () => {
    if (activeTimerEntry) return;

    const newEntry: TimeEntry = {
      id: Math.random().toString(),
      os_id: os.id,
      start_time: new Date().toISOString(),
      end_time: null,
      description: 'Trabalho em execução'
    };

    setActiveTimerEntry(newEntry);
    setTimeEntries([newEntry, ...timeEntries]);
    handleUpdateStatus(OSStatus.INICIADA);
  };

  const handleStopTimer = () => {
    if (!activeTimerEntry) return;

    const endTime = new Date().toISOString();
    const startTime = new Date(activeTimerEntry.start_time);
    const durationMinutes = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 60000);

    const updatedEntry = { ...activeTimerEntry, end_time: endTime, duration_minutes: durationMinutes };
    setActiveTimerEntry(null);
    setTimeEntries(timeEntries.map(t => t.id === activeTimerEntry.id ? updatedEntry : t));
  };

  const handleManualTimeAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd) return;

    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    
    if (end <= start) {
      alert("A hora de fim deve ser superior à hora de início.");
      return;
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    const newEntry: TimeEntry = {
      id: Math.random().toString(),
      os_id: os.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
      description: 'Registo manual'
    };
    setTimeEntries([newEntry, ...timeEntries]);
    setManualStart('');
    setManualEnd('');
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    if (!confirm("Tem a certeza que deseja apagar este registo de tempo?")) return;
    setTimeEntries(timeEntries.filter(t => t.id !== entryId));
  };

  const totalMinutes = timeEntries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // --- PDF Generation (Same logic) ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Real Frio', 20, 20);
    doc.setFontSize(10);
    doc.text('Relatório de Serviço Técnico', 20, 28);
    
    doc.setFontSize(16);
    doc.text(os.code, 150, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(new Date().toLocaleDateString(), 150, 26);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('Cliente', 20, 50);
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);
    
    doc.setFontSize(10);
    doc.text(`Nome: ${os.client?.name || ''}`, 20, 60);
    doc.text(`Morada: ${os.client?.address || ''}`, 20, 66);

    doc.setFontSize(12);
    doc.text('Equipamento', 110, 50);
    doc.line(110, 52, 190, 52); 
    
    doc.setFontSize(10);
    doc.text(`Tipo: ${os.equipment?.type || ''}`, 110, 60);
    doc.text(`Marca/Modelo: ${os.equipment?.brand || ''} ${os.equipment?.model || ''}`, 110, 66);

    let currentY = 85;

    doc.setFontSize(11);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, currentY, 170, 8, 'F');
    doc.text('Problema Reportado', 22, currentY + 6);
    currentY += 12;
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(os.description, 170);
    doc.text(descLines, 20, currentY);
    currentY += (descLines.length * 5) + 5;

    if (notes) {
      doc.setFontSize(11);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, 170, 8, 'F');
      doc.text('Relatório Técnico', 22, currentY + 6);
      currentY += 12;
      doc.setFontSize(10);
      const resLines = doc.splitTextToSize(notes, 170);
      doc.text(resLines, 20, currentY);
      currentY += (resLines.length * 5) + 10;
    }

    if (partsUsed.length > 0) {
      doc.setFontSize(11);
      doc.text('Materiais', 20, currentY);
      currentY += 2;
      
      const partsBody = partsUsed.map(p => [
        p.reference, 
        p.name, 
        p.quantity.toString(), 
        `${p.price.toFixed(2)}€`, 
        `${(p.price * p.quantity).toFixed(2)}€`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Ref', 'Designação', 'Qtd', 'Preço Unit.', 'Total']],
        body: partsBody,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] }
      });
      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Totals
    const totalParts = partsUsed.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    
    doc.setFontSize(10);
    doc.text(`Total Peças: ${totalParts.toFixed(2)}€`, 140, currentY);

    // Signature
    currentY += 20;
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }

    if (signature) {
        doc.text('Assinatura do Cliente:', 20, currentY);
        try {
            doc.addImage(signature, 'PNG', 20, currentY + 5, 60, 30);
        } catch (e) {
            doc.text('(Erro ao carregar imagem)', 20, currentY + 15);
        }
    }

    doc.save(`Relatorio_${os.code}.pdf`);
  };

  // --- Handlers ---

  const handleUpdateStatus = async (newStatus: OSStatus) => {
    
    if (newStatus === OSStatus.CONCLUIDA) {
       if (!notes || notes.trim() === '') {
          alert("Por favor, preencha o relatório técnico antes de alterar para Concluída.");
          setActiveTab('finalizar');
          return;
       }
    }

    setActionLoading(true);
    const now = new Date().toISOString();
    
    const updates: Partial<ServiceOrder> = { status: newStatus };
    if (newStatus === OSStatus.INICIADA && !os.start_time) updates.start_time = now;
    if (newStatus === OSStatus.CONCLUIDA) {
      updates.end_time = now;
      updates.resolution_notes = notes;
      updates.internal_notes = internalNotes;
      updates.client_signature = signature || undefined;
      
      if (activeTimerEntry) {
         handleStopTimer();
      }
    } else {
        updates.internal_notes = internalNotes;
    }

    setOs({ ...os, ...updates });
    await mockData.updateServiceOrder(os.id, updates);
    
    setActionLoading(false);
  };

  const handleSaveProgress = async () => {
    setActionLoading(true);
    const updates = {
      resolution_notes: notes,
      internal_notes: internalNotes,
      scheduled_date: os.scheduled_date
    };

    setOs({ ...os, ...updates });
    await mockData.updateServiceOrder(os.id, updates);
    alert("Alterações guardadas (Local).");
    setActionLoading(false);
  };

  const handleFinish = async () => {
    await handleUpdateStatus(OSStatus.CONCLUIDA);
    alert('Ordem de Serviço Concluída!');
  };

  // --- Parts Logic ---
  const handleAddPart = async (catalogItem: PartCatalogItem, qty: number) => {
    const newPart: PartUsed = {
      id: '', // ID will be assigned by mock helper
      part_id: catalogItem.id,
      name: catalogItem.name,
      reference: catalogItem.reference,
      quantity: qty,
      price: catalogItem.price
    };

    await mockData.addOSPart(os.id, newPart);
    const updatedParts = await mockData.getOSParts(os.id);
    setPartsUsed(updatedParts);
    setShowPartModal(false);
  };

  const handleRemovePart = async (id: string) => {
    await mockData.removeOSPart(id);
    setPartsUsed(partsUsed.filter(p => p.id !== id));
  };

  // --- Photo Logic ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const base64 = ev.target.result as string;
          
          const newPhotoMock: OSPhoto = {
            id: Math.random().toString(),
            os_id: os?.id || '',
            url: base64,
            type: 'geral',
            created_at: new Date().toISOString()
          };
          setPhotos([...photos, newPhotoMock]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Summary
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const partsNames = partsUsed.map(p => `${p.quantity}x ${p.name}`);
    
    const summary = await generateOSReportSummary(
        os?.description || '',
        notes || 'Reparação efetuada.',
        partsNames,
        `${totalHours} horas` 
    );
    setGeneratedSummary(summary);
    setNotes(summary);
    setIsGenerating(false);
  };

  const isReadOnly = os.status === OSStatus.CONCLUIDA || os.status === OSStatus.CANCELADA;
  const isFormValid = notes.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      
      {/* --- Parts Modal --- */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Catálogo de Peças</h3>
              <button onClick={() => setShowPartModal(false)}><X size={24} className="text-gray-500" /></button>
            </div>
            
            {/* Search Input for Catalog */}
            <div className="p-4 border-b bg-gray-50">
               <input 
                 type="text" 
                 placeholder="Pesquisar peça..."
                 className="w-full border p-2 rounded-lg text-sm"
                 onChange={(e) => {
                   // This is a quick filter for the modal only
                   // In a real big app, we might want state for this
                   const term = e.target.value.toLowerCase();
                   const items = document.querySelectorAll('.catalog-item');
                   items.forEach((item: any) => {
                     const text = item.textContent.toLowerCase();
                     item.style.display = text.includes(term) ? 'flex' : 'none';
                   });
                 }}
               />
            </div>

            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {catalog.map(item => (
                <div key={item.id} className="catalog-item border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">Ref: {item.reference} | Stock: {item.stock}</div>
                    <div className="text-sm font-semibold text-blue-600">{item.price.toFixed(2)}€</div>
                  </div>
                  <button 
                    onClick={() => handleAddPart(item, 1)}
                    disabled={item.stock <= 0}
                    className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
              {catalog.length === 0 && <p className="text-center text-gray-500">Catálogo vazio.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6 sticky top-0 z-10 border-b border-gray-200 transition-all">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1">
             <button
               onClick={() => navigate(-1)}
               className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
               title="Voltar"
             >
               <ArrowLeft size={24} />
             </button>
             <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 mr-2">{os.code}</h1>
                  
                  {/* Status Dropdown */}
                  <div className="relative inline-block">
                    <select
                      value={os.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as OSStatus)}
                      disabled={actionLoading}
                      className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(os.status)}`}
                    >
                      {Object.values(OSStatus).map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1.5 pointer-events-none opacity-60" />
                  </div>

                </div>
                <p className="text-gray-500 text-sm mt-1">{os.client?.name} - {os.equipment?.type}</p>
             </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
            {(os.status === OSStatus.CONCLUIDA) && (
              <button 
                onClick={handleDownloadPDF}
                className="flex-1 md:flex-none flex items-center justify-center bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                title="Descarregar Relatório PDF"
              >
                <Download size={18} className="mr-2 text-red-600" /> PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white mb-6 rounded-t-lg">
        {['info', 'pecas', 'fotos', 'tempo', 'finalizar'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`
              px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center flex-shrink-0
              ${activeTab === tab 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
          >
            {tab === 'info' && 'Detalhes'}
            {tab === 'pecas' && <>Peças <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 rounded-full text-xs">{partsUsed.length}</span></>}
            {tab === 'fotos' && <>Fotos <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 rounded-full text-xs">{photos.length}</span></>}
            {tab === 'tempo' && 'Tempos'}
            {tab === 'finalizar' && 'Relatório'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        
        {/* TAB: INFO */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center"><Calendar size={18} className="mr-2"/> Agendamento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista</label>
                          <input
                              type="date"
                              value={os.scheduled_date ? (os.scheduled_date.includes('T') ? os.scheduled_date.split('T')[0] : os.scheduled_date) : ''}
                              readOnly={isReadOnly}
                              disabled={isReadOnly}
                              className="w-full border rounded-lg shadow-sm border-gray-300 p-2 text-sm disabled:bg-gray-100"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Prevista</label>
                          <input
                              type="time"
                              value={(os.scheduled_date && os.scheduled_date.includes('T')) ? os.scheduled_date.split('T')[1].substring(0, 5) : ''}
                              readOnly={isReadOnly}
                              disabled={isReadOnly}
                              className="w-full border rounded-lg shadow-sm border-gray-300 p-2 text-sm disabled:bg-gray-100"
                          />
                      </div>
                  </div>
                </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                   <h3 className="font-semibold text-gray-900 flex items-center"><PenTool size={18} className="mr-2"/> Equipamento</h3>
                   <div className="text-sm space-y-3">
                     <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Equipamento</span> 
                        <span className="font-medium text-right">{os.equipment?.type}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Marca / Modelo</span> 
                        <span className="font-medium text-right">{os.equipment?.brand} {os.equipment?.model}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Nº Série</span> 
                        <span className="font-medium text-right">{os.equipment?.serial_number}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Localização</span> 
                        <span className="font-medium text-right">{os.client?.address}</span>
                     </div>
                   </div>
                 </div>
             </div>
             
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-4">Problema Reportado</h3>
                  <p className="text-gray-700 bg-red-50 p-4 rounded-lg border border-red-100 text-sm leading-relaxed">
                    {os.description}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                   <h3 className="font-semibold text-gray-900 mb-4">Resumo Global</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Total Peças</span>
                        <div className="flex items-center font-medium text-lg">
                          {partsUsed.length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Total Horas</span>
                        <div className="flex items-center font-medium text-lg">
                          <Clock size={16} className="mr-2 text-blue-600" />
                          {totalHours} h
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB: PECAS */}
        {activeTab === 'pecas' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900">Peças e Materiais Aplicados</h3>
              <button 
                onClick={() => setShowPartModal(true)}
                disabled={isReadOnly}
                className="flex items-center text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} className="mr-1" /> Adicionar
              </button>
            </div>

            {partsUsed.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma peça adicionada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partsUsed.map((part) => (
                  <div key={part.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{part.name}</p>
                      <p className="text-xs text-gray-500">Ref: {part.reference} | Qtd: {part.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-700">{(part.price * part.quantity).toFixed(2)}€</span>
                      {!isReadOnly && (
                        <button onClick={() => handleRemovePart(part.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FOTOS */}
        {activeTab === 'fotos' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {!isReadOnly && (
                 <label className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors">
                   <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                   <Camera size={32} className="text-gray-400 mb-2" />
                   <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                 </label>
               )}
               
               {photos.map((photo) => (
                 <div key={photo.id} className="aspect-square relative group bg-gray-100 rounded-lg overflow-hidden border">
                    <img src={photo.url} alt="OS Foto" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* TAB: TEMPOS */}
        {activeTab === 'tempo' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Timer className="mr-2 text-blue-600" size={20} />
                Cronómetro
              </h3>
              
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                <div className="text-5xl font-mono font-bold text-slate-800 tracking-wider mb-2">
                  {formatDuration(elapsedSeconds)}
                </div>
                <span className="text-sm text-gray-500">Tempo decorrido atual</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!activeTimerEntry ? (
                  <button 
                    onClick={handleStartTimer}
                    disabled={isReadOnly}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:opacity-50"
                  >
                    <Play size={20} className="mr-2 fill-current" /> Iniciar Contagem
                  </button>
                ) : (
                  <button 
                    onClick={handleStopTimer}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Pause size={20} className="mr-2 fill-current" /> Parar Contagem
                  </button>
                )}
              </div>
            </div>

            {/* Manual Entry */}
            {!isReadOnly && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="mr-2 text-gray-600" size={20} />
                  Adicionar Tempo Manual
                </h3>
                <form onSubmit={handleManualTimeAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      className="w-full border-gray-300 rounded-lg p-2 text-sm border focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fim</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      className="w-full border-gray-300 rounded-lg p-2 text-sm border focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700"
                  >
                    Adicionar Registo
                  </button>
                </form>
              </div>
            )}

            {/* Log History */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-gray-900 flex items-center">
                   <History className="mr-2 text-gray-600" size={20} />
                   Registos de Tempo
                 </h3>
               </div>
               
               {timeEntries.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 text-sm">Nenhum registo de tempo.</div>
               ) : (
                 <div className="space-y-3">
                   {timeEntries.map((entry) => (
                     <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                       <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(entry.start_time).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                             {entry.duration_minutes ? `${entry.duration_minutes} min` : 'Em curso'}
                          </div>
                       </div>
                       {!isReadOnly && (
                        <button onClick={() => handleDeleteTimeEntry(entry.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                       )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* TAB: FINALIZAR */}
        {activeTab === 'finalizar' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-semibold text-gray-900">Relatório Técnico</h3>
                 {!isReadOnly && (
                   <button 
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="flex items-center text-xs font-medium bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 disabled:opacity-50 transition-colors"
                   >
                     <Wand2 size={14} className="mr-1.5" />
                     {isGenerating ? 'A gerar...' : 'Gerar Resumo com IA'}
                   </button>
                 )}
              </div>

              <textarea 
                className="w-full border rounded-lg shadow-sm p-3 border-gray-300"
                placeholder="Descreva o trabalho realizado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                rows={6}
              />
            </div>

            <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <Lock size={16} className="mr-2"/> Notas Internas
                </h3>
                <textarea 
                  className="w-full border-yellow-300 bg-white rounded-lg p-3 border"
                  placeholder="Notas privadas..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
            </div>
            
            {!isReadOnly && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProgress}
                  disabled={actionLoading}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Save size={16} className="mr-2" />
                  Guardar Rascunho
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Assinatura do Cliente</h3>
              {!isReadOnly ? (
                <SignatureCanvas 
                  onSave={(data) => setSignature(data)}
                  onClear={() => setSignature(null)}
                />
              ) : (
                <div className="h-32 bg-gray-50 border rounded flex flex-col items-center justify-center text-gray-400 italic">
                  {os.client_signature ? (
                    <img src={os.client_signature} alt="Assinatura" className="h-full object-contain" />
                  ) : (
                    <span>Assinatura não disponível</span>
                  )}
                </div>
              )}
            </div>

            {!isReadOnly && (
              <button 
                onClick={handleFinish}
                disabled={actionLoading || !isFormValid}
                className={`
                  w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-all
                  ${!isFormValid ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-blue-700'}
                `}
              >
                {actionLoading ? 'A finalizar...' : <><Save size={24} className="mr-2" /> Finalizar Ordem de Serviço</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrderDetail;