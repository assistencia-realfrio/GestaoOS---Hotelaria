import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckSquare, Camera, PenTool, Save, Wand2, Plus, Trash2, X, Package, FileCheck, RotateCcw, DollarSign, Clock, Calendar, Timer, History, Lock, FileText, Download, AlertTriangle, ArrowLeft, Ban } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { OSStatus, ServiceOrder, PartUsed, PartCatalogItem, OSPhoto, TimeEntry, Store } from '../types';
import { generateOSReportSummary } from '../services/geminiService';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock Catalog Data (Keep as constant for simplicity in both modes)
const MOCK_CATALOG: PartCatalogItem[] = [
  { id: 'p1', name: 'Termostato Digital', reference: 'TERM-001', price: 45.50, stock: 10 },
  { id: 'p2', name: 'Compressor 1/2HP', reference: 'COMP-12', price: 250.00, stock: 3 },
  { id: 'p3', name: 'Gás Refrigerante R404A (kg)', reference: 'GAS-404', price: 80.00, stock: 50 },
  { id: 'p4', name: 'Bomba de Água', reference: 'PUMP-H2O', price: 120.00, stock: 5 },
  { id: 'p5', name: 'Vedante Porta', reference: 'VED-09', price: 35.00, stock: 15 },
];

const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const ServiceOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'pecas' | 'fotos' | 'tempo' | 'finalizar'>('info');
  const [isDemo, setIsDemo] = useState(false);
  
  // Data State
  const [os, setOs] = useState<ServiceOrder | null>(null);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [photos, setPhotos] = useState<OSPhoto[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  
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
    const checkDemo = localStorage.getItem('demo_session') === 'true';
    setIsDemo(checkDemo);
    fetchOSDetails(checkDemo);
  }, [id]);

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

  const fetchOSDetails = async (demoMode: boolean) => {
    setLoading(true);
    
    if (demoMode) {
      // MOCK DATA for Demo
      await new Promise(r => setTimeout(r, 500));
      setOs({
        id: id || '1',
        code: 'CR-20241026-001', // New code format
        client_id: 'cli-1',
        description: 'Máquina de gelo não está a fazer cubos, faz barulho estranho.',
        type: 'avaria' as any,
        status: OSStatus.ATRIBUIDA, // Default to ATRIRIBUIDA for demo
        priority: 'alta',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        scheduled_date: new Date().toISOString().split('T')[0],
        store_id: MOCK_STORES[0].id, store: MOCK_STORES[0], // Add store info
        client: {
          id: 'cli-1',
          name: 'Hotel Baía Azul',
          address: 'Av. Marginal 123, Lisboa',
          contact_person: 'Sr. Silva',
          email: 'admin@baiaazul.pt',
          phone: '912345678',
          type: 'Hotel',
          store_id: MOCK_STORES[0].id
        },
        equipment: {
          id: 'eq-1',
          client_id: 'cli-1',
          brand: 'Hoshizaki',
          model: 'IM-45CNE',
          serial_number: 'L00543',
          type: 'Máquina de Gelo',
          status: 'ativo',
          store_id: MOCK_STORES[0].id
        }
      });
      // Mock Time Entries
      setTimeEntries([
        { id: 't1', os_id: id || '1', start_time: new Date(Date.now() - 7200000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString(), duration_minutes: 60, description: 'Diagnóstico inicial' }
      ]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch OS Header
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`*, client:clients(*), equipment:equipments(*), store:stores(name, short_code)`) // Fetch store details, include short_code
        .eq('id', id)
        .single();

      if (osError) throw osError;
      setOs(osData);
      if (osData.resolution_notes) setNotes(osData.resolution_notes);
      if (osData.internal_notes) setInternalNotes(osData.internal_notes);
      if (osData.client_signature) setSignature(osData.client_signature);
      
      // 2. Fetch Parts
      const { data: partsData } = await supabase.from('service_order_parts').select('*').eq('os_id', id);
      if (partsData) setPartsUsed(partsData);

      // 3. Fetch Photos
      const { data: photosData } = await supabase.from('service_order_photos').select('*').eq('os_id', id);
      if (photosData) setPhotos(photosData);

      // 4. Fetch Time Entries
      const { data: timeData } = await supabase.from('os_tempo').select('*').eq('os_id', id).order('start_time', { ascending: false });
      if (timeData) {
        setTimeEntries(timeData);
        // Check for active timer
        const active = timeData.find((t: TimeEntry) => !t.end_time);
        if (active) setActiveTimerEntry(active);
      }

    } catch (error) {
      console.error("Error fetching OS:", error);
      alert("Erro ao carregar dados da OS.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar detalhes da OS...</div>;
  if (!os) return <div className="p-8 text-center text-red-500">Ordem de Serviço não encontrada.</div>;

  // --- Helpers ---
  const getStatusLabel = (status: OSStatus) => {
    switch (status) {
      case OSStatus.POR_INICIAR: return 'Por Iniciar';
      case OSStatus.ATRIBUIDA: return 'Atribuída';
      case OSStatus.INICIADA: return 'Iniciada';
      case OSStatus.PAUSA: return 'Pausa';
      case OSStatus.PARA_ORCAMENTO: return 'Para Orçamento';
      case OSStatus.ORCAMENTO_ENVIADO: return 'Orçamento Enviado';
      case OSStatus.AGUARDA_PECAS: return 'Aguarda Peças';
      case OSStatus.PECAS_RECEBIDAS: return 'Peças Recebidas';
      case OSStatus.CONCLUIDA: return 'Concluída';
      case OSStatus.FATURADA: return 'Faturada';
      case OSStatus.CANCELADA: return 'Cancelada';
      default: return status;
    }
  };

  const getStatusColor = (status: OSStatus) => {
    switch (status) {
      case OSStatus.POR_INICIAR: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OSStatus.ATRIBUIDA: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case OSStatus.INICIADA: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OSStatus.PAUSA: return 'bg-orange-100 text-orange-800 border-orange-200';
      case OSStatus.PARA_ORCAMENTO: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OSStatus.ORCAMENTO_ENVIADO: return 'bg-pink-100 text-pink-800 border-pink-200';
      case OSStatus.AGUARDA_PECAS: return 'bg-red-100 text-red-800 border-red-200';
      case OSStatus.PECAS_RECEBIDAS: return 'bg-teal-100 text-teal-800 border-teal-200';
      case OSStatus.CONCLUIDA: return 'bg-green-100 text-green-800 border-green-200';
      case OSStatus.FATURADA: return 'bg-gray-200 text-gray-800 border-gray-300'; // Faturada pode ser mais neutra
      case OSStatus.CANCELADA: return 'bg-gray-300 text-gray-700 border-gray-400';
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
  
  const handleStartTimer = async () => {
    if (activeTimerEntry) return;

    const newEntry: TimeEntry = {
      id: isDemo ? Math.random().toString() : '', // Placeholder for demo
      os_id: os.id,
      start_time: new Date().toISOString(),
      end_time: null,
      description: 'Trabalho em execução'
    };

    if (isDemo) {
      setActiveTimerEntry(newEntry);
      setTimeEntries([newEntry, ...timeEntries]);
      handleUpdateStatus(OSStatus.INICIADA); // Auto update status
      return;
    }

    try {
      const { data, error } = await supabase.from('os_tempo').insert({
        os_id: os.id,
        start_time: newEntry.start_time,
        description: newEntry.description
      }).select().single();

      if (error) throw error;
      setActiveTimerEntry(data);
      setTimeEntries([data, ...timeEntries]);
      handleUpdateStatus(OSStatus.INICIADA);
    } catch (e) {
      console.error("Erro ao iniciar timer:", e);
      alert("Erro ao iniciar contagem de tempo.");
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimerEntry) return;

    const endTime = new Date().toISOString();
    const startTime = new Date(activeTimerEntry.start_time);
    const durationMinutes = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 60000);

    if (isDemo) {
      const updatedEntry = { ...activeTimerEntry, end_time: endTime, duration_minutes: durationMinutes };
      setActiveTimerEntry(null);
      setTimeEntries(timeEntries.map(t => t.id === activeTimerEntry.id ? updatedEntry : t));
      return;
    }

    try {
      const { error } = await supabase.from('os_tempo').update({
        end_time: endTime,
        duration_minutes: durationMinutes
      }).eq('id', activeTimerEntry.id);

      if (error) throw error;
      
      // Refresh list
      const { data } = await supabase.from('os_tempo').select('*').eq('os_id', os.id).order('start_time', { ascending: false });
      if (data) setTimeEntries(data);
      setActiveTimerEntry(null);

    } catch (e) {
      console.error("Erro ao parar timer:", e);
      alert("Erro ao parar contagem de tempo.");
    }
  };

  const handleManualTimeAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd) return;

    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    
    if (end <= start) {
      alert("A hora de fim deve ser superior à hora de início.");
      return;
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    if (isDemo) {
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
      return;
    }

    try {
      const { data, error } = await supabase.from('os_tempo').insert({
        os_id: os.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: durationMinutes,
        description: 'Registo manual'
      }).select().single();

      if (error) throw error;
      setTimeEntries([data, ...timeEntries]);
      setManualStart('');
      setManualEnd('');
    } catch (e) {
      console.error("Erro ao adicionar tempo:", e);
      alert("Erro ao registar tempo.");
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!confirm("Tem a certeza que deseja apagar este registo de tempo?")) return;

    if (isDemo) {
      setTimeEntries(timeEntries.filter(t => t.id !== entryId));
      return;
    }

    try {
      const { error } = await supabase.from('os_tempo').delete().eq('id', entryId);
      if (error) throw error;
      setTimeEntries(timeEntries.filter(t => t.id !== entryId));
    } catch (e) {
      alert("Erro ao apagar registo.");
    }
  };

  const totalMinutes = timeEntries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // --- PDF Generation ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const companyLogo = 'https://via.placeholder.com/100x40?text=Logo'; // Placeholder logo URL

    // This function needs to be declared before it's called
    const finalizePdf = () => {
      // OS Code
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(os.code, 150, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(new Date().toLocaleDateString(), 150, 26);

      // Client Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Cliente', 20, 50);
      doc.setLineWidth(0.5);
      doc.line(20, 52, 190, 52);
      
      doc.setFontSize(10);
      doc.text(`Nome: ${os.client?.name || ''}`, 20, 60);
      doc.text(`Morada: ${os.client?.address || ''}`, 20, 66);
      doc.text(`Contacto: ${os.client?.contact_person || ''} (${os.client?.phone || ''})`, 20, 72);
      if (os.store) {
        doc.text(`Loja: ${os.store.name}`, 20, 78);
      }

      // Equipment Info
      doc.setFontSize(12);
      doc.text('Equipamento', 110, 50);
      doc.line(110, 52, 190, 52); // Only partial line visual
      
      doc.setFontSize(10);
      doc.text(`Tipo: ${os.equipment?.type || ''}`, 110, 60);
      doc.text(`Marca/Modelo: ${os.equipment?.brand || ''} ${os.equipment?.model || ''}`, 110, 66);
      doc.text(`Nº Série: ${os.equipment?.serial_number || ''}`, 110, 72);

      let currentY = 85;

      // Description
      doc.setFontSize(11);
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, 170, 8, 'F');
      doc.text('Problema Reportado', 22, currentY + 6);
      currentY += 12;
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(os.description, 170);
      doc.text(descLines, 20, currentY);
      currentY += (descLines.length * 5) + 5;

      // Resolution
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

      // Parts Table
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

      // Time Table
      if (timeEntries.length > 0) {
          doc.setFontSize(11);
          doc.text('Registo de Tempos', 20, currentY);
          currentY += 2;

          const timeBody = timeEntries.map(t => [
              new Date(t.start_time).toLocaleDateString(),
              new Date(t.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
              t.end_time ? new Date(t.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-',
              t.duration_minutes ? `${t.duration_minutes} min` : '-'
          ]);

          autoTable(doc, {
              startY: currentY,
              head: [['Data', 'Início', 'Fim', 'Duração']],
              body: timeBody,
              theme: 'plain',
              styles: { fontSize: 9 }
          });
          // @ts-ignore
          currentY = doc.lastAutoTable.finalY + 10;
      }

      // Totals
      const totalParts = partsUsed.reduce((acc, p) => acc + (p.price * p.quantity), 0);
      
      doc.setFontSize(10);
      doc.text(`Total Peças: ${totalParts.toFixed(2)}€`, 140, currentY);
      doc.text(`Total Horas: ${totalHours}h`, 140, currentY + 5);

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
      } else {
          doc.text('Assinatura não recolhida.', 20, currentY);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Página ${i} de ${pageCount} - Gerado por GestãoOS`, 100, 290, { align: 'center' });
      }

      doc.save(`Relatorio_${os.code}.pdf`);
    };

    // Company Header
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add logo
    if (companyLogo) {
      const img = new Image();
      img.src = companyLogo;
      img.onload = () => {
        doc.addImage(img, 'PNG', 15, 10, 30, 12); // Adjust position and size as needed
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text('Relatório de Serviço Técnico', 15, 28);
        finalizePdf();
      };
      img.onerror = () => {
        console.warn("Failed to load company logo for PDF. Proceeding without it.");
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Hotelaria Assist', 20, 20);
        doc.setFontSize(10);
        doc.text('Relatório de Serviço Técnico', 20, 28);
        finalizePdf();
      };
    } else {
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text('Hotelaria Assist', 20, 20);
      doc.setFontSize(10);
      doc.text('Relatório de Serviço Técnico', 20, 28);
      finalizePdf();
    }
  };

  // --- Handlers ---

  const handleUpdateStatus = async (newStatus: OSStatus) => {
    setActionLoading(true);
    const prevStatus = os.status;
    const now = new Date().toISOString();
    
    const updates: Partial<ServiceOrder> = { status: newStatus };
    if (newStatus === OSStatus.INICIADA && !os.start_time) updates.start_time = now;
    if (newStatus === OSStatus.CONCLUIDA) {
      updates.end_time = now;
      updates.resolution_notes = notes;
      updates.internal_notes = internalNotes; // Save internal notes on finish
      updates.client_signature = signature || undefined;
      updates.scheduled_date = os.scheduled_date; // Ensure scheduled date is saved
      
      // Stop timer if running when finishing
      if (activeTimerEntry) {
         await handleStopTimer();
      }
    } else {
        // Save internal notes on other status changes too, just in case
        updates.internal_notes = internalNotes;
    }

    if (newStatus === OSStatus.PAUSA && activeTimerEntry) {
      await handleStopTimer();
    }

    setOs({ ...os, ...updates });

    if (!isDemo) {
      try {
        const { error } = await supabase.from('service_orders').update(updates).eq('id', os.id);
        if (error) throw error;
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Erro ao sincronizar estado.");
        setOs({ ...os, status: prevStatus });
      }
    } else {
      await new Promise(r => setTimeout(r, 600));
    }
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

    if (!isDemo) {
      try {
        const { error } = await supabase.from('service_orders').update(updates).eq('id', os.id);
        if (error) throw error;
        alert("Alterações guardadas.");
      } catch (err) {
        console.error("Error saving:", err);
        alert("Erro ao guardar alterações.");
      }
    } else {
      await new Promise(r => setTimeout(r, 500));
      alert("Alterações guardadas (Demo).");
    }
    setActionLoading(false);
  };

  const handleStartOS = () => handleUpdateStatus(OSStatus.INICIADA);
  const handlePauseOS = () => handleUpdateStatus(OSStatus.PAUSA);
  
  const handleReopenOS = () => {
    if (confirm("Tem a certeza que deseja reabrir esta Ordem de Serviço?")) {
      handleUpdateStatus(OSStatus.INICIADA);
    }
  };

  const handleInvoiceOS = () => {
    if (confirm("Marcar esta OS como Faturada? Esta ação é irreversível pelo técnico.")) {
      handleUpdateStatus(OSStatus.FATURADA);
    }
  };

  const handleCancelOS = () => {
    if (confirm("Tem a certeza que deseja CANCELAR esta Ordem de Serviço? Esta ação não pode ser desfeita.")) {
      handleUpdateStatus(OSStatus.CANCELADA);
    }
  };

  const handleFinish = async () => {
    if (!notes || notes.trim() === '') {
      alert("Por favor, preencha o relatório técnico antes de finalizar.");
      setActiveTab('finalizar');
      return;
    }
    // Validation for date removed
    if (!signature && !isDemo) {
      if(!confirm("Não recolheu a assinatura do cliente. Deseja finalizar mesmo assim?")) return;
    }
    await handleUpdateStatus(OSStatus.CONCLUIDA);
    alert('Ordem de Serviço Concluída com sucesso!');
  };

  // --- Parts Logic ---
  const handleAddPart = async (catalogItem: PartCatalogItem, qty: number) => {
    const newPart: PartUsed = {
      id: Math.random().toString(36).substr(2, 9),
      part_id: catalogItem.id,
      name: catalogItem.name,
      reference: catalogItem.reference,
      quantity: qty,
      price: catalogItem.price
    };

    setPartsUsed([...partsUsed, newPart]);
    setShowPartModal(false);

    if (!isDemo && os) {
      try {
         await supabase.from('service_order_parts').insert({
           os_id: os.id,
           part_id: catalogItem.id,
           name: catalogItem.name,
           reference: catalogItem.reference,
           quantity: qty,
           price: catalogItem.price
         });
      } catch (e) { console.error("Error saving part", e); }
    }
  };

  const handleRemovePart = async (id: string) => {
    const partToRemove = partsUsed.find(p => p.id === id);
    setPartsUsed(partsUsed.filter(p => p.id !== id));

    if (!isDemo && partToRemove) {
      try {
        await supabase.from('service_order_parts').delete().eq('id', id);
      } catch (e) { console.error("Error deleting part", e); }
    }
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

          if (!isDemo && os) {
            try {
              const fileName = `${os.id}/${Date.now()}_${file.name}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('os-photos')
                .upload(fileName, file);

              let publicUrl = base64;
              
              if (!uploadError && uploadData) {
                 const { data: { publicUrl: url } } = supabase.storage.from('os-photos').getPublicUrl(fileName);
                 publicUrl = url;
              }

              await supabase.from('service_order_photos').insert({
                os_id: os.id,
                url: publicUrl,
                type: 'geral'
              });

            } catch (err) {
              console.warn("Storage upload failed, saved locally only.", err);
            }
          }
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

  const isReadOnly = os.status === OSStatus.CONCLUIDA || os.status === OSStatus.FATURADA || os.status === OSStatus.CANCELADA;

  // Validation Check
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
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {MOCK_CATALOG.map(item => (
                <div key={item.id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">Ref: {item.reference} | Stock: {item.stock}</div>
                    <div className="text-sm font-semibold text-blue-600">{item.price.toFixed(2)}€</div>
                  </div>
                  <button 
                    onClick={() => handleAddPart(item, 1)}
                    className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with Sticky Actions */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6 sticky top-0 z-10 border-b border-gray-200 transition-all">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3">
             <button
               onClick={() => navigate(-1)}
               className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
               title="Voltar"
             >
               <ArrowLeft size={24} />
             </button>
             <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{os.code}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(os.status)}`}>
                    {getStatusLabel(os.status)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {os.client?.name} - {os.equipment?.type}
                  {os.store && <span className="ml-2 text-gray-400">({os.store.name})</span>}
                </p>
             </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
            
            {/* Start OS Button */}
            {(os.status === OSStatus.POR_INICIAR || os.status === OSStatus.ATRIBUIDA || os.status === OSStatus.PAUSA) && !isReadOnly && (
              <button 
                onClick={handleStartOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'A processar...' : <><Play size={18} className="mr-2" /> {os.status === OSStatus.PAUSA ? 'Retomar OS' : 'Iniciar OS'}</>}
              </button>
            )}

            {/* Pause OS Button */}
            {os.status === OSStatus.INICIADA && !isReadOnly && (
              <button 
                onClick={handlePauseOS}
                className="flex-1 md:flex-none flex items-center justify-center bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Pause size={18} className="mr-2" /> Pausa
              </button>
            )}

            {/* Finish OS Button */}
            {(os.status === OSStatus.INICIADA || os.status === OSStatus.PAUSA || os.status === OSStatus.ATRIBUIDA) && !isReadOnly && (
              <button 
                onClick={() => setActiveTab('finalizar')}
                className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <CheckSquare size={18} className="mr-2" /> Finalizar
              </button>
            )}

            {/* Download PDF Button */}
            {(os.status === OSStatus.CONCLUIDA || os.status === OSStatus.FATURADA) && (
              <button 
                onClick={handleDownloadPDF}
                className="flex-1 md:flex-none flex items-center justify-center bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                title="Descarregar Relatório PDF"
              >
                <Download size={18} className="mr-2 text-red-600" /> PDF
              </button>
            )}

            {/* Reopen OS Button */}
            {os.status === OSStatus.CONCLUIDA && (
              <button 
                onClick={handleReopenOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={18} className="mr-2" /> Reabrir
              </button>
            )}

            {/* Invoice OS Button */}
            {os.status === OSStatus.CONCLUIDA && (
              <button 
                onClick={handleInvoiceOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <DollarSign size={18} className="mr-2" /> Faturar
              </button>
            )}

            {/* Cancel OS Button */}
            {!isReadOnly && os.status !== OSStatus.CANCELADA && (
              <button 
                onClick={handleCancelOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Ban size={18} className="mr-2" /> Cancelar
              </button>
            )}

            {/* Faturada / Cancelada Display */}
            {os.status === OSStatus.FATURADA && (
               <div className="flex items-center text-gray-700 font-bold px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                 <FileCheck size={18} className="mr-2" /> Faturada
               </div>
            )}
            {os.status === OSStatus.CANCELADA && (
               <div className="flex items-center text-red-700 font-bold px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                 <Ban size={18} className="mr-2" /> Cancelada
               </div>
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
                   {/* Date Field Moved Here */}
                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista / Agendada</label>
                    <div className="relative max-w-sm">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={os.scheduled_date ? os.scheduled_date.split('T')[0] : ''}
                        onChange={(e) => setOs({...os, scheduled_date: e.target.value})}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                        className={`
                          w-full pl-10 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 p-2 text-sm
                        `}
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
                     {os.store && (
                       <div className="flex justify-between border-t border-gray-100 pt-3 mt-3">
                          <span className="text-gray-500">Loja</span> 
                          <span className="font-medium text-right">{os.store.name}</span>
                       </div>
                     )}
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
                <div className="flex justify-end pt-4 border-t mt-4">
                  <div className="text-lg font-bold text-gray-900">
                    Total: {partsUsed.reduce((acc, p) => acc + (p.price * p.quantity), 0).toFixed(2)}€
                  </div>
                </div>
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
                    {!isReadOnly && (
                      <button 
                        onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))} // Optimistic delete
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    )}
                 </div>
               ))}
               
               {photos.length === 0 && isReadOnly && (
                 <div className="col-span-full text-center text-gray-500 py-8">Nenhuma foto registada.</div>
               )}
             </div>
          </div>
        )}

        {/* TAB: TEMPOS (New) */}
        {activeTab === 'tempo' && (
          <div className="space-y-6">
            
            {/* Active Timer Card */}
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
                 <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                   Total: {totalHours}h ({totalMinutes} min)
                 </span>
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
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                             <span>{new Date(entry.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             <span>➔</span>
                             <span>{entry.end_time ? new Date(entry.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Em curso...'}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className={`font-bold ${!entry.end_time ? 'text-green-600 animate-pulse' : 'text-gray-700'}`}>
                           {entry.end_time ? `${entry.duration_minutes} min` : 'A decorrer'}
                         </span>
                         {!isReadOnly && entry.end_time && (
                           <button 
                             onClick={() => handleDeleteTimeEntry(entry.id)}
                             className="text-gray-400 hover:text-red-500 transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>
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

              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Trabalho</label>
              <textarea 
                className={`
                  w-full border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[150px] p-3 
                  disabled:bg-gray-50 disabled:text-gray-500
                  ${!notes.trim() && !isReadOnly ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Descreva o trabalho realizado, anomalias encontradas e recomendações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {!notes.trim() && !isReadOnly && (
                 <span className="text-xs text-red-500 mt-1 block">O relatório técnico é obrigatório.</span>
              )}
              {generatedSummary && !isReadOnly && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  * Resumo gerado automaticamente. Verifique antes de guardar.
                </div>
              )}
            </div>

            {/* Internal Notes Section - NEW */}
            <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <Lock size={16} className="mr-2"/> Notas Internas (Privado)
                </h3>
                <p className="text-xs text-yellow-700 mb-3">
                  Informações visíveis apenas para a equipa técnica e backoffice. Não partilhado com o cliente.
                </p>
                <textarea 
                  className="w-full border-yellow-300 bg-white rounded-lg shadow-sm focus:ring-yellow-500 focus:border-yellow-500 min-h-[100px] p-3 border disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Códigos de acesso, dificuldades técnicas, notas sobre o cliente..."
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
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" id="confirm" className="rounded text-blue-600" disabled={isReadOnly} defaultChecked={isReadOnly} />
                <label htmlFor="confirm">Confirmo que o serviço foi realizado satisfatoriamente.</label>
              </div>
            </div>

            {!isReadOnly && (
              <button 
                onClick={handleFinish}
                disabled={actionLoading || !isFormValid}
                className={`
                  w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-all
                  ${!isFormValid ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-blue-700'}
                `}
                title={!isFormValid ? "Preencha o relatório para finalizar" : "Finalizar OS"}
              >
                {actionLoading ? 'A finalizar...' : <><Save size={24} className="mr-2" /> Finalizar Ordem de Serviço</>}
              </button>
            )}
            
            {os.status === OSStatus.CONCLUIDA && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium">
                Esta Ordem de Serviço foi concluída. Pode agora emitir a fatura.
              </div>
            )}
            
            {os.status === OSStatus.FATURADA && (
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium">
                Esta Ordem de Serviço já foi faturada e arquivada.
              </div>
            )}

            {os.status === OSStatus.CANCELADA && (
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium">
                Esta Ordem de Serviço foi cancelada.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrderDetail;