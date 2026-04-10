
import React, { useState } from 'react';
import { Player } from '../types';
import { supabase } from '../lib/supabase';
import { LoaderIcon, PlusIcon, Trash2Icon } from '../components/icons';

interface AtletasProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  deletedPlayers: Player[];
  setDeletedPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  userId?: string;
  arenaId?: string;
  athletesLimit?: number;
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
}

const Atletas: React.FC<AtletasProps> = ({ 
  players, setPlayers, deletedPlayers, setDeletedPlayers, 
  arenaId, userId, athletesLimit, showAlert, showConfirm 
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Função para normalizar nome (remover acentos, espaços extras e minúsculas)
  const normalize = (str: string) => 
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .trim()
       .replace(/\s+/g, ' ');

  // Algoritmo de Distância de Levenshtein para medir similaridade
  const getLevenshteinDistance = (a: string, b: string) => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const isSimilar = (n1: string, n2: string) => {
    const s1 = normalize(n1);
    const s2 = normalize(n2);
    if (s1 === s2) return 'exact';
    
    // Distância curta indica nome parecido
    const dist = getLevenshteinDistance(s1, s2);
    // Se a distância for pequena em relação ao tamanho do nome
    const maxLen = Math.max(s1.length, s2.length);
    if (dist <= 2 && maxLen > 4) return 'similar';
    return 'different';
  };

  const savePlayerToDb = async (name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ 
          name, 
          arena_id: arenaId,
          user_id: userId
        }])
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        setPlayers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewPlayerName('');
      }
    } catch (err: any) {
      console.error("Erro ao salvar atleta:", err);
      if (showAlert) showAlert("Erro ao Salvar", "Não foi possível registrar o atleta: " + err.message, 'danger', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (!name || loading) return;
    
    if (!userId) {
      if (showAlert) showAlert("Sessão Expirada", "Sessão inválida. Saia e entre novamente.", 'danger', 'alert');
      return;
    }

    if (!arenaId || arenaId === 'default') {
      if (showAlert) showAlert("Arena Necessária", "Vá em CONFIGURAÇÕES e selecione um grupo primeiro.", 'warning', 'alert');
      return;
    }

    if (players.length >= (athletesLimit || 15)) {
      if (showAlert) showAlert("Limite Atingido", `Seu plano permite no máximo ${athletesLimit || 15} atletas ativos por arena.`, 'warning', 'alert');
      return;
    }

    // Verificação de nomes existentes (ativos e inativos)
    const allExisting = [...players, ...deletedPlayers];
    const exactMatch = allExisting.find(p => isSimilar(p.name, name) === 'exact');
    const similarMatch = allExisting.find(p => isSimilar(p.name, name) === 'similar');

    if (exactMatch) {
      if (showConfirm) {
        showConfirm(
          "Atleta Já Existe",
          `O nome "${name}" já está na sua lista (pode estar inativo). Deseja cadastrar novamente assim mesmo?`,
          () => savePlayerToDb(name),
          'warning',
          'alert'
        );
      } else {
        savePlayerToDb(name);
      }
      return;
    }

    if (similarMatch) {
      if (showConfirm) {
        showConfirm(
          "Nome Parecido Encontrado",
          `Já existe um atleta chamado "${similarMatch.name}". Deseja cadastrar "${name}" como um novo atleta?`,
          () => savePlayerToDb(name),
          'warning',
          'info'
        );
      } else {
        savePlayerToDb(name);
      }
      return;
    }

    savePlayerToDb(name);
  };
  
  const handleConfirmDelete = async () => {
    if (!playerToDelete || loading) return;
    setLoading(true);
    try {
      if (isPermanentDelete) {
        // Exclusão definitiva (física)
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerToDelete.id);

        if (error) {
          console.error("Erro delete físico:", error);
          throw error;
        }
        
        setDeletedPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
      } else {
        // Inativação (lógica)
        const { data, error } = await supabase
          .from('players')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', playerToDelete.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
          setDeletedPlayers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      setPlayerToDelete(null);
    } catch (err: any) {
      console.error("Erro na exclusão:", err);
      if (showAlert) showAlert("Falha na Exclusão", "Execute o comando GRANT ALL no SQL Editor do Supabase se o erro persistir: " + err.message, 'danger', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePlayer = async (player: Player) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .update({ deleted_at: null }) 
        .eq('id', player.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setDeletedPlayers(prev => prev.filter(p => p.id !== player.id));
        setPlayers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err: any) {
      if (showAlert) showAlert("Erro ao Restaurar", "Falha ao recuperar atleta: " + err.message, 'danger', 'alert');
    }
  };

  return (
    <>
      <div className="w-full p-4 flex flex-col gap-6 max-w-2xl mx-auto pb-32">
        <h1 className="text-2xl font-black text-center text-white uppercase tracking-tighter">Atletas</h1>
        
        <div className="bg-gray-900/40 backdrop-blur rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Novo Cadastro</h2>
            <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nome do Atleta"
                disabled={loading}
                className="flex-1 p-4 bg-black/40 border border-white/10 text-white rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50"
              />
              <button 
                type="submit" 
                disabled={loading || !newPlayerName.trim()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? <LoaderIcon className="w-4 h-4" /> : "Salvar Atleta"}
              </button>
            </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Ativos na Lista</h2>
            <span className="text-[9px] font-black text-white/40">{players.length} NO TOTAL</span>
          </div>
          <ul className="space-y-2">
            {players.map(player => (
              <li key={player.id} className="flex items-center justify-between bg-white/[0.03] p-5 rounded-[1.5rem] border border-white/5 group hover:bg-white/[0.06] transition-all">
                <span className="text-sm text-white font-bold">{player.name}</span>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingPlayer(player)} className="text-indigo-400 hover:text-white text-[9px] font-black uppercase tracking-widest">Editar</button>
                  <button onClick={() => { 
                    if (showConfirm) {
                      showConfirm(
                        "Inativar Atleta",
                        `Deseja tirar ${player.name} da lista principal? Ele poderá ser restaurado depois.`,
                        () => {
                          setPlayerToDelete(player);
                          setIsPermanentDelete(false);
                          // Chamada manual da confirmação para manter lógica atual do useEffect se necessário, 
                          // mas aqui podemos chamar direto a lógica de inativação se refatorarmos mais.
                          // Por agora, vamos apenas disparar o showConfirm e passar a função de inativação.
                        },
                        'warning',
                        'info'
                      );
                    } else {
                      setPlayerToDelete(player); 
                      setIsPermanentDelete(false);
                    }
                  }} className="text-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest">Inativar</button>
                </div>
              </li>
            ))}
            {players.length === 0 && <p className="text-gray-500 italic text-center py-10 text-[10px] uppercase font-black opacity-20">Nenhum atleta ativo.</p>}
          </ul>
        </div>

        {deletedPlayers.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/30 ml-2">Removidos / Inativos</h2>
            <ul className="space-y-2">
              {deletedPlayers.map(player => (
                <li key={player.id} className="flex items-center justify-between bg-black/20 p-5 rounded-[1.5rem] border border-red-500/10 grayscale opacity-40">
                  <span className="text-sm text-white/50">{player.name}</span>
                  <div className="flex gap-4">
                    <button onClick={() => handleRestorePlayer(player)} className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Restaurar</button>
                    <button onClick={() => { 
                       if (showConfirm) {
                        showConfirm(
                          "Excluir Atleta",
                          `Deseja apagar permanentemente ${player.name}? Esta ação não pode ser desfeita.`,
                          () => {
                            setPlayerToDelete(player);
                            setIsPermanentDelete(true);
                          },
                          'danger',
                          'trash'
                        );
                      } else {
                        setPlayerToDelete(player); 
                        setIsPermanentDelete(true);
                      }
                    }} className="text-red-600 text-[9px] font-black uppercase tracking-widest">Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {playerToDelete && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4" onClick={() => setPlayerToDelete(null)}>
          <div className="bg-[#090e1a] border border-red-500/20 rounded-[1.5rem] p-4 sm:p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <Trash2Icon className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mb-2 uppercase tracking-tight text-center">
              {isPermanentDelete ? 'Deletar' : 'Inativar'}?
            </h2>
            <p className="text-white/30 text-[10px] mb-6 sm:mb-8 leading-relaxed text-center font-bold uppercase tracking-widest">
              {isPermanentDelete 
                ? `Esta ação é irreversível. O atleta será apagado do banco.`
                : `O atleta sairá da lista principal, mas poderá ser restaurado.`
              }
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmDelete} disabled={loading} className="w-full p-3 sm:p-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                {loading ? "Processando..." : "Confirmar"}
              </button>
              <button onClick={() => setPlayerToDelete(null)} className="w-full p-3 sm:p-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Atletas;
