import React, { createContext, useState, useContext } from 'react';
import { Modal } from '../components/Modal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        message: '',
        title: '',
        onConfirm: () => {},
        onCancel: () => {},
        type: 'alert', // 'alert' or 'confirm'
    });

    const showModal = ({ message, title, onConfirm, onCancel, type = 'alert' }) => {
        setModalState({
            isOpen: true,
            message,
            title,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeModal();
            },
            onCancel: () => {
                if (onCancel) onCancel();
                closeModal();
            },
            type,
        });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {}, type: 'alert' });
    };

    const value = { showModal, closeModal };

    return (
        <ModalContext.Provider value={value}>
            {children}
            <Modal {...modalState} />
        </ModalContext.Provider>
    );
};