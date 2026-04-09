import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserLicense } from '../types';
import { 
  UsersIcon, 
  UserPlusIcon, 
  Trash2Icon, 
  MailIcon, 
  ShieldCheckIcon,
  CrownIcon,
  CircleIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon
} from '../components/icons';

interface ClubManagementProps {
  userId?: string;
  ownerLicense: UserLicense;
  onRefresh: () => void;
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
}

const ClubManagement: React.FC<ClubManagementProps> = ({ ownerLicense, onRefresh, showAlert, showConfirm }) => {
  const [members, setMembers] = useState<UserLicense[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('club_id', ownerLicense.user_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Inscrição Realtime para atualizações na lista de membros do clube
    const channel = supabase
      .channel(`club-members-${ownerLicense.user_id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_licenses', 
          filter: `club_id=eq.${ownerLicense.user_id}` 
        },
        () => {
          fetchMembers(); // Recarrega para garantir consistência após mudança externa
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerLicense]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    
    const emailLower = newMemberEmail.toLowerCase().trim();
    const limit = ownerLicense.club_members_limit || 0;
    
    if (members.length >= limit) {
      setErrorMessage(`Limite de membros atingido (${limit}).`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    if (members.find(m => m.email === emailLower)) {
      setErrorMessage("Este usuário já é um colaborador.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setActionLoading('add');
    try {
      // 1. Procurar o usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('user_licenses')
        .select('id, user_id, club_id, email')
        .eq('email', emailLower)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        setErrorMessage("Usuário não encontrado.");
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }

      if (userData.club_id) {
        setErrorMessage("Já pertence a outro clube.");
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }

      if (userData.user_id === ownerLicense.user_id) {
        setErrorMessage("Você é o dono.");
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }

      // Optimistic Update
      const optimisticMember = { ...userData, club_id: ownerLicense.user_id } as UserLicense;
      setMembers(prev => [...prev, optimisticMember]);

      // 2. Vincular ao clube
      const { error: updateError } = await supabase
        .from('user_licenses')
        .update({ 
          club_id: ownerLicense.user_id,
          expires_at: ownerLicense.expires_at, 
          is_active: true
        })
        .eq('id', userData.id);

      if (updateError) {
        // Rollback
        setMembers(prev => prev.filter(m => m.id !== userData.id));
        throw updateError;
      }

      setNewMemberEmail('');
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const executeRemove = async () => {
        const removedMember = members.find(m => m.id === memberId);
        
        // Optimistic Update
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setActionLoading(memberId);
        
        try {
          const { error } = await supabase
            .from('user_licenses')
            .update({ 
              club_id: null,
              is_active: false
            })
            .eq('id', memberId);

          if (error) {
            // Rollback
            if (removedMember) setMembers(prev => [...prev, removedMember]);
            throw error;
          }
          onRefresh();
        } catch (err: any) {
          setErrorMessage(err.message);
        } finally {
          setActionLoading(null);
        }
    };

    if (showConfirm) {
        showConfirm(
            'Remover Colaborador',
            'Tem certeza que deseja remover este membro? Ele perderá o acesso vinculado ao seu plano imediatamente.',
            executeRemove,
            'danger',
            'trash'
        );
    } else {
        executeRemove();
    }
  };

  const limit = ownerLicense.club_members_limit || 0;
  const remainingSlots = Math.max(0, limit - members.length);
  const usagePercentage = limit > 0 ? (members.length / limit) * 100 : 0;

  const filteredMembers = members.filter(m => 
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Estilo Elite */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10" />
        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
              <CrownIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Painel do Clube</h1>
              <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em] mt-1">Gestão de Colaboradores</p>
            </div>
          </div>
          <p className="text-white/30 text-xs font-medium max-w-sm">Gerencie o acesso de seus professores e árbitros. Eles compartilharão os recursos e a validade do seu plano.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border border-white/5 p-5 rounded-[2rem] text-center min-w-[120px]">
              <p className="text-2xl font-black text-white">{members.length}</p>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Membros</p>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-[2rem] text-center min-w-[120px]">
              <p className="text-2xl font-black text-indigo-400">{remainingSlots}</p>
              <p className="text-[8px] font-black text-indigo-400/40 uppercase tracking-widest mt-1">Vagas Livres</p>
            </div>
          </div>
          
          {/* Barra de Progresso Capacity */}
          <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
              style={{ width: `${Math.min(100, usagePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Adicionar Membro */}
      <div className="bg-[#090e1a]/80 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <UserPlusIcon className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Adicionar Colaborador</h2>
          {errorMessage && (
            <span className="ml-auto text-[8px] font-black text-rose-500 animate-pulse uppercase tracking-widest">
              {errorMessage}
            </span>
          )}
        </div>
        
        <form onSubmit={handleAddMember} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MailIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="email" 
              placeholder="e-mail do colaborador..."
              value={newMemberEmail}
              onChange={e => setNewMemberEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm font-bold placeholder:text-white/10 outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMemberEmail || actionLoading === 'add'}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {actionLoading === 'add' ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <><PlusIcon className="w-4 h-4" /> Vincular ao Clube</>}
          </button>
        </form>
      </div>

      {/* Lista de Membros */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sua Equipe</h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-[8px] font-black text-indigo-500/60 border border-indigo-500/10 uppercase">Limite: {limit}</span>
          </div>
          
          {/* Filtro de Busca Operacional */}
          <div className="relative w-full sm:w-64 group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#090e1a]/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold text-white placeholder:text-white/10 outline-none focus:border-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/10">
            <Loader2Icon className="w-10 h-10 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Carregando membros...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem] space-y-4">
            <UsersIcon className="w-12 h-12 text-white/5 mx-auto" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum colaborador vinculado ainda</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center bg-white/[0.02] border border-white/5 rounded-[3rem]">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum resultado para "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.map(m => (
              <div key={m.id} className="group bg-[#090e1a]/80 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between gap-6 transition-all hover:border-indigo-500/20">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{m.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CircleIcon className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                      <p className="text-[8px] font-black text-white/20 uppercase">Acesso Ativo</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleRemoveMember(m.id)}
                  disabled={!!actionLoading}
                  className="w-11 h-11 bg-white/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2Icon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ClubManagement;
