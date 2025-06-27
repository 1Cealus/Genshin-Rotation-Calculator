import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { ActionTray } from '../components/ActionTray';
import { BulkEditPanel } from '../components/BulkEditPanel';
import { BuildEditorModal } from '../components/BuildEditorModal';
import { ActionControlPanel } from '../components/ActionControlPanel';
import { characterData } from '../data/character_database';

export const CalculatorPage = ({
    team, handleTeamChange, setEditingBuildFor,
    enemyKey, setEnemyKey, user,
    onExport, onImport, onClearAll,
    presetName, setPresetName, savedPresets,
    onSavePreset, onLoadPreset, onDeletePreset,
    rotation, rotationDuration, setRotationDuration,
    mainView, setMainView,
    activeActionTray, setActiveActionTray,
    editingActionId, setEditingActionId,
    editingBuildFor,
    selectedActionIds, setSelectedActionIds,
    showBulkEdit, setShowBulkEdit,
    calculationResults, analyticsData, rotationSummary,
    activeTeam,
    handleAddFromNotation, handleAddSingleAction,
    handleActionRepeatChange, handleDuplicateAction,
    handleActionSelect, handleBulkApplyBuffs,
    updateCharacterBuild, handleUpdateAction, handleRemoveAction,
    characterBuilds,
}) => {
    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);
    
    if (!user) {
        return <div className="text-center p-10">Loading user data...</div>;
    }

    return (
        <div className="flex max-w-[1700px] mx-auto p-4 gap-6 h-[calc(100vh-65px)]">
            <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
                <Sidebar
                    user={user} 
                    team={team} handleTeamChange={handleTeamChange} setEditingBuildFor={setEditingBuildFor}
                    enemyKey={enemyKey} setEnemyKey={setEnemyKey}
                    presetName={presetName} setPresetName={setPresetName} savedPresets={savedPresets}
                    onSavePreset={onSavePreset} onLoadPreset={onLoadPreset} onDeletePreset={onDeletePreset}
                    onExport={onExport} onImport={onImport} onClearAll={onClearAll}
                />
            </div>
            <main className="flex-grow bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-primary)] flex flex-col gap-6">
                <div className="border-b-2 border-[var(--color-border-primary)] flex-shrink-0">
                    <button onClick={() => setMainView('rotation')} className={`px-6 py-3 text-sm font-semibold transition-colors ${mainView === 'rotation' ? 'text-white border-b-2 border-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>Rotation</button>
                    <button onClick={() => setMainView('analytics')} className={`px-6 py-3 text-sm font-semibold transition-colors ${mainView === 'analytics' ? 'text-white border-b-2 border-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>Analytics</button>
                </div>
                {mainView === 'rotation' ? (
                    <div className="flex flex-col gap-6 flex-grow min-h-0">
                        <div className="bg-transparent flex flex-col flex-grow min-h-0">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h2 className="text-2xl font-semibold text-white">Rotation Builder ({rotation.length})</h2>
                                <div className="flex items-center gap-2">
                                    {selectedActionIds.length > 0 ? (<button onClick={() => setShowBulkEdit(true)} className="btn btn-secondary">Bulk Edit ({selectedActionIds.length})</button>) : (<><span className='text-sm text-[var(--color-text-secondary)] mr-2'>Add:</span>{activeTeam.map(c => (
                                        // FIXED: Reworked the "Add" buttons to be more distinct
                                        <button 
                                            key={c} 
                                            onClick={() => setActiveActionTray(activeActionTray === c ? null : c)} 
                                            className={`btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5 transition-colors ${activeActionTray === c ? 'bg-[var(--color-accent-primary)] text-white' : ''}`}
                                        >
                                            <img src={characterData[c].iconUrl} alt={characterData[c].name} className="w-5 h-5 rounded-full" />
                                            {characterData[c].name.split(' ')[0]}
                                        </button>
                                    ))} </>)}
                                </div>
                            </div>
                            {activeActionTray && (<div className="flex-shrink-0"><ActionTray charKey={activeActionTray} onAddNotation={handleAddFromNotation} onAddSingle={handleAddSingleAction} onClose={() => setActiveActionTray(null)} /></div>)}
                            <div className="space-y-2 mt-4 overflow-y-auto pr-2 flex-grow">
                                {rotation.map(action => {
                                    const result = calculationResults.find(res => res.actionId === action.id);
                                    const damage = result?.damage || { avg: 0, crit: 0, nonCrit: 0 };
                                    const char = characterData[action.characterKey];
                                    const totalDamageForAction = (damage.avg || 0) * (action.repeat || 1);
                                    const isSelected = selectedActionIds.includes(action.id);
                                    return (
                                        <div 
                                            key={action.id} 
                                            onClick={() => handleActionSelect(action.id)}
                                            className={`p-3 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer border ${isSelected ? 'bg-[var(--color-border-primary)] border-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-border-primary)] border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 flex-grow min-w-0">
                                                <img src={char.iconUrl} alt={char.name} className="w-10 h-10 rounded-full shrink-0" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/2d3748/e2e8f0?text=??'; }} />
                                                <div>
                                                    <p className="font-semibold truncate">{char.name} - <span className="text-[var(--color-accent-primary)]">{char?.talents?.[action.talentKey]?.name || 'Unknown Action'}</span></p>
                                                    <div className="flex gap-4 text-xs text-brand-text-light mt-1">
                                                        <span>Crit: <span className="text-white font-mono">{(damage.crit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                                        <span>Non-Crit: <span className="text-white font-mono">{(damage.nonCrit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-brand-text-light">x</span>
                                                <input type="number" min="1" value={action.repeat || 1} onChange={(e) => handleActionRepeatChange(action.id, e.target.value)} className="w-12 text-center" />
                                            </div>
                                            <div className="text-right shrink-0 w-28">
                                                <p className="font-bold text-xl text-white">{totalDamageForAction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                <p className="text-xs text-brand-text-light">Avg: {(damage.avg || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1 shrink-0">
                                                <button onClick={() => handleDuplicateAction(action.id)} className="btn btn-secondary text-xs py-1 px-3">Dup</button>
                                                <button onClick={() => setEditingActionId(action.id)} className="btn btn-secondary text-xs py-1 px-3">Edit</button>
                                                <button onClick={() => handleRemoveAction(action.id)} className="btn btn-danger text-xs py-1 px-3">Del</button>
                                            </div>
                                        </div>
                                    )
                                })}
                                {rotation.length === 0 && <p className="text-center text-brand-text-light py-8">No actions in rotation. Add characters to the team and click their name above to start.</p>}
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-primary)] p-4 rounded-lg flex-shrink-0 border border-[var(--color-border-primary)]"><div className="flex justify-around items-center"><div className="text-center"><p className="text-brand-text-light text-sm">Total Rotation Damage</p><p className="text-3xl font-bold text-[var(--color-accent-primary)]">{rotationSummary.totalDamage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div><div className='flex items-center gap-2'><span className='text-brand-text-light text-sm'>Duration (s):</span><input type="number" value={rotationDuration} onChange={e => setRotationDuration(parseFloat(e.target.value) || 1)} className="w-20 text-center" /></div><div className="text-center"><p className="text-brand-text-light text-sm">DPS</p><p className="text-3xl font-bold text-white">{rotationSummary.dps.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div></div></div>
                    </div>
                ) : (
                    <div className="flex-grow min-h-0 overflow-y-auto pr-2">
                        <AnalyticsDashboard analyticsData={analyticsData} />
                    </div>
                )}
            </main>
            {editingBuildFor && characterBuilds[editingBuildFor] && <BuildEditorModal charKey={editingBuildFor} build={characterBuilds[editingBuildFor]} updateBuild={updateCharacterBuild} onClose={() => setEditingBuildFor(null)} />}
            {editingAction && <ActionControlPanel action={editingAction} team={activeTeam} characterBuilds={characterBuilds} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)} />}
            {showBulkEdit && <BulkEditPanel rotation={rotation} selectedActionIds={selectedActionIds} onBulkApplyBuffs={handleBulkApplyBuffs} onClose={() => { setShowBulkEdit(false); setSelectedActionIds([]) }} team={activeTeam} characterBuilds={characterBuilds} />}
        </div>
    )
}
