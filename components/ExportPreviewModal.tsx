
import React from 'react';

interface ExportPreviewModalProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({ imageUrl, title, onClose }) => {
  const fileName = `${title.toLowerCase().replace(/ /g, '_')}_placar_elite_pro.png`;
  
  const handleShareOrDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${title} - Placar Elite Pro`,
          text: 'Confira o ranking completo!',
        });
      } else {
        // Fallback to download
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao compartilhar/baixar:', error);
      // Fallback to download on error
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-4 w-full max-w-4xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white text-center flex-shrink-0 mb-4">{title}</h2>
        <div className="flex-1 min-h-0 overflow-y-auto bg-black/20 rounded-lg p-2">
          <img src={imageUrl} alt={`Prévia da exportação do ranking: ${title}`} className="w-full h-auto" />
        </div>
        <div className="flex gap-4 flex-shrink-0 pt-4">
          <button onClick={onClose} className="flex-1 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">Fechar</button>
          <button onClick={handleShareOrDownload} className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
            {navigator.canShare ? 'Compartilhar' : 'Baixar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPreviewModal;
