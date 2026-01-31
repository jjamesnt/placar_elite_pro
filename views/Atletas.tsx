
import React, { useState } from 'react';
import { Player } from '../types';

interface AtletasProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

const Atletas: React.FC<AtletasProps> = ({ players, setPlayers }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

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
      setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
      setPlayerToDelete(null);
    }
  };

  return (
    <>
      <div className="w-full p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center text-gray-100">Gestão de Atletas</h1>
        
        <div className="bg-gray-800/50 rounded-2xl p-4">
            <h2 className="text-xl font-semibold text-green-400 mb-3">Adicionar Novo Atleta</h2>
            <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nome do Atleta"
                className="flex-1 p-2 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-transform active:scale-95 text-lg shadow-lg">
                Salvar Atleta
              </button>
            </form>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-4">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3">Atletas Cadastrados</h2>
          <ul className="space-y-2 pr-2">
            {players.map(player => (
              <li key={player.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                <span className="text-base text-white">{player.name}</span>
                <div className="space-x-3">
                  <button onClick={() => setEditingPlayer(player)} className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold">Editar</button>
                  <button onClick={() => setPlayerToDelete(player)} className="text-red-500 hover:text-red-400 text-sm font-semibold">Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Editar Atleta</h2>
            <input
              type="text"
              value={editingPlayer.name}
              onChange={(e) => setEditingPlayer(p => p ? {...p, name: e.target.value} : null)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
            />
            <div className="flex gap-4">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">Cancelar</button>
              <button onClick={handleUpdatePlayer} className="flex-1 p-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {playerToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPlayerToDelete(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h2>
            <p className="text-gray-300 mb-4">Tem certeza que deseja excluir o atleta <span className="font-bold text-red-400">{playerToDelete.name}</span>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-4">
              <button onClick={() => setPlayerToDelete(null)} className="flex-1 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">Cancelar</button>
              <button onClick={handleConfirmDelete} className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Atletas;
