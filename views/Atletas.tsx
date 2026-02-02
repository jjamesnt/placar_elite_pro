
import React, { useState } from 'react';
import { Player } from '../types';

interface AtletasProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  deletedPlayers: Player[];
  setDeletedPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

const Atletas: React.FC<AtletasProps> = ({ players, setPlayers, deletedPlayers, setDeletedPlayers }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: String(Date.now()),
        name: newPlayerName.trim(),
      };
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPlayerName('');
    }
  };
  
  const handleUpdatePlayer = () => {
    if (!editingPlayer || !editingPlayer.name.trim()) return;
    setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? editingPlayer : p));
    setEditingPlayer(null);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      if (isPermanentDelete) {
        setDeletedPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
      } else {
        // Soft delete: move to deletedPlayers list
        setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
        setDeletedPlayers(prev => [...prev, playerToDelete].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setPlayerToDelete(null);
      setIsPermanentDelete(false);
    }
  };

  const handleRestorePlayer = (player: Player) => {
    setDeletedPlayers(prev => prev.filter(p => p.id !== player.id));
    setPlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <>
      <div className="w-full p-4 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-gray-100">Gestão de Atletas</h1>
        
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
            <h2 className="text-xl font-semibold text-green-400 mb-3">Adicionar Novo Atleta</h2>
            <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nome do Atleta"
                className="flex-1 p-2 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-transform active:scale-95 text-lg shadow-lg uppercase">
                Salvar
              </button>
            </form>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3">Atletas Ativos</h2>
          <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            {players.map(player => (
              <li key={player.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-xl border border-gray-600/20">
                <span className="text-base text-white font-medium">{player.name}</span>
                <div className="flex gap-4">
                  <button onClick={() => setEditingPlayer(player)} className="text-yellow-400 hover:text-yellow-300 text-xs font-black uppercase tracking-widest">Editar</button>
                  <button onClick={() => { setPlayerToDelete(player); setIsPermanentDelete(false); }} className="text-red-500 hover:text-red-400 text-xs font-black uppercase tracking-widest">Excluir</button>
                </div>
              </li>
            ))}
            {players.length === 0 && <p className="text-gray-500 italic text-center py-4">Nenhum atleta ativo cadastrado.</p>}
          </ul>
        </div>

        {deletedPlayers.length > 0 && (
          <div className="bg-red-900/10 rounded-2xl p-4 border border-red-500/20">
            <h2 className="text-xl font-semibold text-red-400 mb-3">Recentemente Excluídos</h2>
            <p className="text-xs text-red-300/60 mb-3 italic">Estes atletas ainda aparecem no ranking histórico até serem excluídos permanentemente.</p>
            <ul className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
              {deletedPlayers.map(player => (
                <li key={player.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded-xl border border-red-500/10">
                  <span className="text-base text-gray-400">{player.name}</span>
                  <div className="flex gap-4">
                    <button onClick={() => handleRestorePlayer(player)} className="text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-widest">Restaurar</button>
                    <button onClick={() => { setPlayerToDelete(player); setIsPermanentDelete(true); }} className="text-red-600 hover:text-red-500 text-xs font-black uppercase tracking-widest">Remover Permanente</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Editar Atleta</h2>
            <input
              type="text"
              value={editingPlayer.name}
              onChange={(e) => setEditingPlayer(p => p ? {...p, name: e.target.value} : null)}
              className="w-full p-4 bg-gray-700 text-white rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-6"
            />
            <div className="flex gap-4">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 p-4 bg-gray-600 hover:bg-gray-500 rounded-2xl font-black uppercase text-xs">Cancelar</button>
              <button onClick={handleUpdatePlayer} className="flex-1 p-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-2xl font-black uppercase text-xs">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {playerToDelete && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setPlayerToDelete(null)}>
          <div className="bg-gray-800 border border-red-500/20 rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{isPermanentDelete ? 'Atenção Total' : 'Confirmar Exclusão'}</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {isPermanentDelete 
                ? `Você está prestes a apagar permanentemente o atleta ${playerToDelete.name}. Todos os dados vinculados serão removidos do ranking. Deseja prosseguir?`
                : `Deseja mover ${playerToDelete.name} para a lixeira? Ele continuará visível no ranking histórico.`
              }
            </p>
            <div className="flex gap-4">
              <button onClick={() => setPlayerToDelete(null)} className="flex-1 p-4 bg-gray-600 hover:bg-gray-500 rounded-2xl font-black uppercase text-xs">Voltar</button>
              <button onClick={handleConfirmDelete} className={`flex-1 p-4 ${isPermanentDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-2xl font-black uppercase text-xs`}>
                {isPermanentDelete ? 'Apagar Pra Sempre' : 'Mover para Lixeira'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Atletas;
