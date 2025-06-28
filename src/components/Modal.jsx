import React from 'react';

export const Modal = ({ isOpen, title, message, onConfirm, onCancel, type }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md text-white border-2 border-slate-700 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white">{title || 'Confirmation'}</h3>
                <p className="text-slate-300 text-sm">{message}</p>
                <div className="flex justify-end gap-3 mt-4">
                    {type === 'confirm' && (
                        <button onClick={onCancel} className="btn btn-secondary">
                            Cancel
                        </button>
                    )}
                    <button onClick={onConfirm} className="btn btn-primary">
                        {type === 'confirm' ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};