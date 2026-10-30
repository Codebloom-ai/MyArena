import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  X, 
  Printer, 
  Sparkles,
  Download
} from 'lucide-react';

interface FormalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const FormalReportModal: React.FC<FormalReportModalProps> = ({
  isOpen,
  onClose,
  reportContent,
  isLoading,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RAPPORT_SECURITE_MYARENA_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport d'Incident de Sécurité - MyArena</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 24px; font-size: 13px; color: #111; }
            </style>
          </head>
          <body>${reportContent.replace(/</g, '&lt;')}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-black/[0.1] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-white/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#2F6BFF] border border-blue-100">
              <FileText className="w-5 h-5 text-[#2F6BFF]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                Rapport Officiel de Sécurité (Français)
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6BFF] border border-blue-200">
                  Préfecture & Délégué
                </span>
              </h3>
              <p className="text-xs text-[#526071]">
                Rédigé automatiquement d'après les incidents consolidés en temps réel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526071] hover:text-[#111827] hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-[#111827] leading-relaxed bg-neutral-50/60 select-text">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#526071]">
              <div className="w-8 h-8 border-2 border-black/[0.1] border-t-[#2F6BFF] rounded-full animate-spin" />
              <p className="text-sm font-sans font-medium text-[#111827]">
                Rédaction du rapport officiel en cours...
              </p>
              <p className="text-xs font-sans text-[#526071]">
                Synthèse sectorielle et mesures d'urgence
              </p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#111827] leading-relaxed bg-white p-5 rounded-2xl border border-black/[0.08] shadow-2xs">
              {reportContent}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-[#111827] text-xs font-medium border border-black/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2F6BFF]" strokeWidth={1.5} />
              <span>Régénérer</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading || !reportContent}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-[#526071] hover:text-[#111827] text-xs font-medium border border-black/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading || !reportContent}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-[#526071] hover:text-[#111827] text-xs font-medium border border-black/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Télécharger .txt</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading || !reportContent}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'bg-[#2F6BFF] hover:bg-[#1E56E8] text-white shadow-md shadow-blue-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copié dans le presse-papier</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le rapport</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white hover:bg-neutral-50 text-[#526071] text-xs font-medium border border-black/[0.1] transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
