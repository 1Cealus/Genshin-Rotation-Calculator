import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export const AdminPage = ({ newsItems }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddNews = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== 'Admin123') { 
            setError('Incorrect admin password.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'news'), {
                title,
                content: content.replace(/\n/g, '<br />'), 
                date: Timestamp.now()
            });
            setTitle('');
            setContent('');
        } catch (err) {
            console.error(err);
            setError('Failed to post news.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteNews = async (id) => {
        if(window.confirm("Are you sure you want to delete this news item?")) {
            try {
                 await deleteDoc(doc(db, 'news', id));
            } catch(err) {
                console.error(err);
                alert("Failed to delete news item.");
            }
        }
    }

    return (
        <div className="container mx-auto px-4 lg:px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Admin Panel - Manage News</h1>
                
                <form onSubmit={handleAddNews} className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)] space-y-4 mb-8">
                    <h2 className="text-xl font-semibold">Post New Update</h2>
                     {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Content (HTML allowed)</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} required rows="5" className="w-full bg-transparent border-2 border-[var(--color-border-primary)] rounded-md p-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent transition-colors duration-200"></textarea>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Admin Password</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Posting...' : 'Post News'}
                    </button>
                </form>

                <div className="space-y-4">
                     <h2 className="text-xl font-semibold">Existing News Items</h2>
                     {newsItems && newsItems.map(item => (
                         <div key={item.id} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold">{item.title}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">{new Date(item.date.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDeleteNews(item.id)} className="btn btn-danger">Delete</button>
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};
