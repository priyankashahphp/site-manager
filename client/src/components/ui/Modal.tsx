import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blueprint-950/40 p-4">
      <div className="w-full max-w-md rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-concrete-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-concrete-900">{title}</h2>
          <button onClick={onClose} className="text-concrete-400 hover:text-concrete-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
