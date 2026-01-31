
import React from 'react';

interface StoryPreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({ imageUrl, onClose }) => {
  const handleShare = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'story_ranking_do_dia.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ranking do Dia - Placar Elite Pro',
          text: 'Confira os resultados de hoje!',
        });
      } else {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = 'story_ranking_do_dia.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = 'story_ranking_do_dia.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-4 w-full max-w-md flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white text-center flex-shrink-0 mb-4">Story do Dia</h2>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <img src={imageUrl} alt="Story com o ranking do dia" className="w-full h-auto" />
        </div>
        <div className="flex gap-4 flex-shrink-0 pt-4">
          <button onClick={onClose} className="flex-1 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">Fechar</button>
          <button onClick={handleShare} className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Compartilhar</button>
        </div>
      </div>
    </div>
  );
};

export default StoryPreviewModal;
