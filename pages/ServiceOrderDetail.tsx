import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckSquare, Camera, PenTool, Save, Wand2, Plus, Trash2, X, Package, FileCheck, RotateCcw, DollarSign, Clock, Calendar } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { OSStatus, ServiceOrder, PartUsed, PartCatalogItem, OSPhoto } from '../types';
import { generateOSReportSummary } from '../services/geminiService';
import { supabase } from '../supabaseClient';

// Mock Catalog Data (Keep as constant for simplicity in both modes)
const MOCK_CATALOG: PartCatalogItem[] = [
  { id: 'p1', name: 'Termostato Digital', reference: 'TERM-001', price: 45.50, stock: 10 },
  { id: 'p2', name: 'Compressor 1/2HP', reference: 'COMP-12', price: 250.00, stock: 3 },
  { id: 'p3', name: 'Gás Refrigerante R404A (kg)', reference: 'GAS-404', price: 80.00, stock: 50 },
  { id: 'p4', name: 'Bomba de Água', reference: 'PUMP-H2O', price: 120.00, stock: 5 },
  { id: 'p5', name: 'Vedante Porta', reference: 'VED-09', price: 35.00, stock: 15 },
];

const ServiceOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'pecas' | 'fotos' | 'finalizar'>('info');
  const [isDemo, setIsDemo] = useState(false);
  
  // Data State
  const [os, setOs] = useState<ServiceOrder | null>(null);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [photos, setPhotos] = useState<OSPhoto[]>([]);
  
  // Form State
  const [notes, setNotes] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [showPartModal, setShowPartModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const checkDemo = localStorage.getItem('demo_session') === 'true';
    setIsDemo(checkDemo);
    fetchOSDetails(checkDemo);
  }, [id]);

  const fetchOSDetails = async (demoMode: boolean) => {
    setLoading(true);
    
    if (demoMode) {
      // MOCK DATA for Demo
      await new Promise(r => setTimeout(r, 500));
      setOs({
        id: id || '1',
        code: 'OS-2024-055',
        client_id: 'cli-1',
        description: 'Máquina de gelo não está a fazer cubos. Cliente reporta barulho estranho.',
        type: 'avaria' as any,
        status: OSStatus.ATRIBUIDA,
        priority: 'alta',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        client: {
          id: 'cli-1',
          name: 'Hotel Baía Azul',
          address: 'Av. Marginal 123, Lisboa',
          contact_person: 'Sr. Silva',
          email: 'admin@baiaazul.pt',
          phone: '912345678',
          type: 'Hotel'
        },
        equipment: {
          id: 'eq-1',
          client_id: 'cli-1',
          brand: 'Hoshizaki',
          model: 'IM-45CNE',
          serial_number: 'L00543',
          type: 'Máquina de Gelo',
          status: 'ativo'
        }
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch OS Header
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`*, client:clients(*), equipment:equipments(*)`)
        .eq('id', id)
        .single();

      if (osError) throw osError;
      setOs(osData);
      if (osData.resolution_notes) setNotes(osData.resolution_notes);
      if (osData.client_signature) setSignature(osData.client_signature);
      
      // 2. Fetch Parts (Assumes table 'service_order_parts')
      const { data: partsData } = await supabase
        .from('service_order_parts')
        .select('*')
        .eq('os_id', id);
      
      if (partsData) setPartsUsed(partsData);

      // 3. Fetch Photos (Assumes table 'service_order_photos')
      const { data: photosData } = await supabase
        .from('service_order_photos')
        .select('*')
        .eq('os_id', id);
        
      if (photosData) setPhotos(photosData);

    } catch (error) {
      console.error("Error fetching OS:", error);
      alert("Erro ao carregar dados da OS. Verifique se a base de dados foi inicializada.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar detalhes da OS...</div>;
  if (!os) return <div className="p-8 text-center text-red-500">Ordem de Serviço não encontrada.</div>;

  // --- Helpers ---
  const getStatusLabel = (status: string) => {
    switch (status) {
      case OSStatus.ABERTA: return 'Aberta';
      case OSStatus.ATRIBUIDA: return 'Atribuída';
      case OSStatus.EM_EXECUCAO: return 'Em Execução';
      case OSStatus.PAUSA: return 'Pausa';
      case OSStatus.FINALIZADA: return 'Finalizada';
      case OSStatus.FATURADA: return 'Faturada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OSStatus.EM_EXECUCAO: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OSStatus.FINALIZADA: return 'bg-green-100 text-green-800 border-green-200';
      case OSStatus.FATURADA: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OSStatus.PAUSA: return 'bg-orange-100 text-orange-800 border-orange-200';
      case OSStatus.ATRIBUIDA: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- Handlers ---

  const handleUpdateStatus = async (newStatus: OSStatus) => {
    setActionLoading(true);
    const prevStatus = os.status;
    const now = new Date().toISOString();
    
    const updates: Partial<ServiceOrder> = { status: newStatus };
    if (newStatus === OSStatus.EM_EXECUCAO && !os.start_time) updates.start_time = now;
    if (newStatus === OSStatus.FINALIZADA) {
      updates.end_time = now;
      updates.resolution_notes = notes;
      updates.client_signature = signature || undefined;
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

  const handleStartOS = () => handleUpdateStatus(OSStatus.EM_EXECUCAO);
  const handlePauseOS = () => handleUpdateStatus(OSStatus.PAUSA);
  
  const handleReopenOS = () => {
    if (confirm("Tem a certeza que deseja reabrir esta Ordem de Serviço?")) {
      handleUpdateStatus(OSStatus.EM_EXECUCAO);
    }
  };

  const handleInvoiceOS = () => {
    if (confirm("Marcar esta OS como Faturada? Esta ação é irreversível pelo técnico.")) {
      handleUpdateStatus(OSStatus.FATURADA);
    }
  };

  const handleFinish = async () => {
    if (!notes) {
      alert("Por favor, preencha o relatório técnico antes de finalizar.");
      setActiveTab('finalizar');
      return;
    }
    if (!signature && !isDemo) {
      if(!confirm("Não recolheu a assinatura do cliente. Deseja finalizar mesmo assim?")) return;
    }
    await handleUpdateStatus(OSStatus.FINALIZADA);
    alert('Ordem de Serviço Finalizada com sucesso!');
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
      // Save to Supabase
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
      // Remove from Supabase (assuming 'id' matches DB primary key or we handle it via reference/os_id lookup if strictly relational)
      // Note: In a strict relational model, we'd need the real DB ID. 
      // For this example, we optimistically assume we can delete by matching properties or the ID if it was fetched from DB.
      try {
        await supabase.from('service_order_parts').delete().eq('id', id); // Logic assumes ID is correct
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
          
          // UI Optimistic Update
          const newPhotoMock: OSPhoto = {
            id: Math.random().toString(),
            os_id: os?.id || '',
            url: base64, // Display base64 immediately
            type: 'geral',
            created_at: new Date().toISOString()
          };
          setPhotos([...photos, newPhotoMock]);

          // Real Upload
          if (!isDemo && os) {
            try {
              // 1. Upload to Storage (Simplistic implementation)
              const fileName = `${os.id}/${Date.now()}_${file.name}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('os-photos') // Bucket must exist
                .upload(fileName, file);

              let publicUrl = base64; // Fallback to base64 if storage fails or not configured
              
              if (!uploadError && uploadData) {
                 const { data: { publicUrl: url } } = supabase.storage.from('os-photos').getPublicUrl(fileName);
                 publicUrl = url;
              }

              // 2. Save metadata to DB
              await supabase.from('service_order_photos').insert({
                os_id: os.id,
                url: publicUrl,
                type: 'geral'
              });

            } catch (err) {
              console.warn("Storage upload failed (bucket might be missing), saved locally only.", err);
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
    
    // Calculate simple duration if possible
    let duration = 'N/A';
    if (os?.start_time) {
      const start = new Date(os.start_time).getTime();
      const end = os.end_time ? new Date(os.end_time).getTime() : Date.now();
      const diffHrs = ((end - start) / 3600000).toFixed(1);
      duration = `${diffHrs} horas`;
    }

    const summary = await generateOSReportSummary(
        os?.description || '',
        notes || 'Reparação efetuada.',
        partsNames,
        duration 
    );
    setGeneratedSummary(summary);
    setNotes(summary);
    setIsGenerating(false);
  };

  const isReadOnly = os.status === OSStatus.FINALIZADA || os.status === OSStatus.FATURADA;

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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{os.code}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(os.status)}`}>
                {getStatusLabel(os.status)}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{os.client?.name} - {os.equipment?.type}</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
            
            {/* ACTION BUTTONS */}
            
            {(os.status === OSStatus.ABERTA || os.status === OSStatus.ATRIBUIDA) && (
              <button 
                onClick={handleStartOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'A processar...' : <><Play size={18} className="mr-2" /> Iniciar OS</>}
              </button>
            )}

            {os.status === OSStatus.PAUSA && (
              <button 
                onClick={handleStartOS}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
              >
                 {actionLoading ? 'A processar...' : <><Play size={18} className="mr-2" /> Retomar OS</>}
              </button>
            )}

            {os.status === OSStatus.EM_EXECUCAO && (
              <>
                <button 
                  onClick={handlePauseOS}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none flex items-center justify-center bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <Pause size={18} className="mr-2" /> Pausa
                </button>
                <button 
                  onClick={() => setActiveTab('finalizar')}
                  className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <CheckSquare size={18} className="mr-2" /> Finalizar
                </button>
              </>
            )}

            {os.status === OSStatus.FINALIZADA && (
              <>
                <button 
                  onClick={handleReopenOS}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none flex items-center justify-center border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={18} className="mr-2" /> Reabrir
                </button>
                <button 
                  onClick={handleInvoiceOS}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <DollarSign size={18} className="mr-2" /> Faturar
                </button>
              </>
            )}

            {os.status === OSStatus.FATURADA && (
               <div className="flex items-center text-purple-700 font-bold px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                 <FileCheck size={18} className="mr-2" /> Faturada
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white mb-6 rounded-t-lg">
        {['info', 'pecas', 'fotos', 'finalizar'].map((tab) => (
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
            {tab === 'finalizar' && 'Relatório'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        
        {/* TAB: INFO */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-6">
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
             
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-4">Problema Reportado</h3>
                  <p className="text-gray-700 bg-red-50 p-4 rounded-lg border border-red-100 text-sm leading-relaxed">
                    {os.description}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                   <h3 className="font-semibold text-gray-900 mb-4">Tempos</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Início</span>
                        <div className="flex items-center font-medium">
                          <Clock size={16} className="mr-2 text-green-600" />
                          {os.start_time ? new Date(os.start_time).toLocaleString() : '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Fim</span>
                        <div className="flex items-center font-medium">
                          <Calendar size={16} className="mr-2 text-blue-600" />
                          {os.end_time ? new Date(os.end_time).toLocaleString() : '-'}
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

        {/* TAB: FINALIZAR */}
        {activeTab === 'finalizar' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
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
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[150px] p-3 border disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Descreva o trabalho realizado, anomalias encontradas e recomendações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {generatedSummary && !isReadOnly && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  * Resumo gerado automaticamente. Verifique antes de guardar.
                </div>
              )}
            </div>

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
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center text-lg disabled:opacity-70 transition-all"
              >
                {actionLoading ? 'A finalizar...' : <><Save size={24} className="mr-2" /> Finalizar Ordem de Serviço</>}
              </button>
            )}
            
            {os.status === OSStatus.FINALIZADA && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium">
                Esta Ordem de Serviço foi finalizada. Pode agora emitir a fatura.
              </div>
            )}
            
            {os.status === OSStatus.FATURADA && (
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 font-medium">
                Esta Ordem de Serviço já foi faturada e arquivada.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrderDetail;