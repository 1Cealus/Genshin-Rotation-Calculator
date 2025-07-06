import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { ActionTray } from '../components/ActionTray';
import { BulkEditPanel } from '../components/BulkEditPanel';
import { BuildEditorModal } from '../components/BuildEditorModal';
import { ActionControlPanel } from '../components/ActionControlPanel';

const DamageFormulaTooltip = ({ formula, talent, triggerRef, scrollContainerRef }) => {
    const tooltipRef = useRef(null);
    const [isAbove, setIsAbove] = useState(true);

    useLayoutEffect(() => {
        if (triggerRef.current && scrollContainerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const containerRect = scrollContainerRef.current.getBoundingClientRect();
            const tooltipHeight = tooltipRef.current.offsetHeight || 200;
            const spaceAbove = triggerRect.top - containerRect.top;
            const spaceBelow = containerRect.bottom - triggerRect.bottom;

            if (spaceAbove > tooltipHeight || spaceAbove > spaceBelow) {
                setIsAbove(true);
            } else {
                setIsAbove(false);
            }
        }
    }, [formula, triggerRef, scrollContainerRef]);
    
    if (!formula) return null;
    
    const {
        baseMultiplier, scalingStat, scalingStatValue, baseDamage,
        totalFlatDamageBonus, additiveBaseDamage, damageBonusMultiplier,
        critDmg, enemyDefMultiplier, enemyResMultiplier, amplifyingReactionMultiplier,
    } = formula;

    const formatNum = (num, digits = 0) => num.toLocaleString(undefined, {maximumFractionDigits: digits});

    const positionClasses = isAbove 
        ? 'bottom-full mb-2' 
        : 'top-full mt-2';

    return (
        <div 
            ref={tooltipRef}
            className={`absolute ${positionClasses} right-0 w-max max-w-md bg-slate-900 border-2 border-[var(--color-accent-primary)] rounded-lg p-4 text-xs shadow-2xl z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
        >
            <div className="font-mono space-y-1 text-slate-300">
                <h4 className="font-bold text-white text-sm mb-2">Damage Calculation</h4>
                <p><span className="text-cyan-400">Base Damage:</span> ({(baseMultiplier * 100).toFixed(1)}% * {formatNum(scalingStatValue)} <span className='uppercase text-gray-500'>{scalingStat}</span>) = {formatNum(baseDamage)}</p>
                <p><span className="text-cyan-400">Flat Bonuses:</span> +{formatNum(totalFlatDamageBonus)} (Shenhe/Yunjin etc.)</p>
                <p><span className="text-cyan-400">Additive Reactions:</span> +{formatNum(additiveBaseDamage)} (Aggravate/Spread)</p>
                
                <div className="border-t border-gray-700 my-1"></div>
                
                <p><span className="text-purple-400">DMG Bonus Multi:</span> x{(damageBonusMultiplier).toFixed(3)} (from {((damageBonusMultiplier - 1) * 100).toFixed(1)}% bonus)</p>
                <p><span className="text-purple-400">Crit Multi:</span> x{(1 + critDmg).toFixed(3)} (from {(critDmg * 100).toFixed(1)}% CRIT DMG)</p>
                <p><span className="text-red-400">Enemy DEF Multi:</span> x{(enemyDefMultiplier).toFixed(3)}</p>
                <p><span className="text-red-400">Enemy RES Multi:</span> x{(enemyResMultiplier).toFixed(3)}</p>
                <p><span className="text-orange-400">Vape/Melt Multi:</span> x{(amplifyingReactionMultiplier).toFixed(3)}</p>
            </div>
        </div>
    );
};

const ActionRow = ({ action, result, isSelected, onSelect, onRepeatChange, onDuplicate, onEdit, onRemove, scrollContainerRef, gameData }) => {
    const triggerRef = useRef(null);
    const { characterData } = gameData;
    
    const damage = result?.damage || { avg: 0, crit: 0, nonCrit: 0 };
    const char = characterData[action.characterKey];
    const talent = char?.talents?.[action.talentKey];
    const totalDamageForAction = (damage.avg || 0) * (action.repeat || 1);

    return (
        <div 
            onClick={() => onSelect(action.id)}
            className={`p-3 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer border ${isSelected ? 'bg-[var(--color-border-primary)] border-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-border-primary)] border-transparent'}`}
        >
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <img src={char?.iconUrl} alt={char?.name} className="w-10 h-10 rounded-full shrink-0" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/2d3748/e2e8f0?text=??'; }} />
                <div>
                    <p className="font-semibold truncate">{char?.name} - <span className="text-[var(--color-accent-primary)]">{talent?.name || 'Unknown Action'}</span></p>
                    <div className="flex gap-4 text-xs text-brand-text-light mt-1">
                        <span>Crit: <span className="text-white font-mono">{(damage.crit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                        <span>Non-Crit: <span className="text-white font-mono">{(damage.nonCrit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                    </div>
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-brand-text-light">x</span>
                <input type="number" min="1" value={action.repeat || 1} onChange={(e) => onRepeatChange(action.id, e.target.value)} className="w-12 text-center" />
            </div>
            <div className="text-right shrink-0 w-28">
                <p className="font-bold text-xl text-white">{totalDamageForAction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <div ref={triggerRef} className="flex items-center justify-end gap-1 text-xs text-brand-text-light relative group">
                    <span>Avg: {(damage.avg || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <div className='cursor-help text-gray-500'>
                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.064.293.006.399.287.47l.45.083.082.38-2.29.287zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
                    </div>
                    <DamageFormulaTooltip formula={result?.formula} talent={talent} triggerRef={triggerRef} scrollContainerRef={scrollContainerRef} />
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1 shrink-0">
                <button onClick={() => onDuplicate(action.id)} className="btn btn-secondary text-xs py-1 px-3">Dup</button>
                <button onClick={() => onEdit(action.id)} className="btn btn-secondary text-xs py-1 px-3">Edit</button>
                <button onClick={() => onRemove(action.id)} className="btn btn-danger text-xs py-1 px-3">Del</button>
            </div>
        </div>
    );
};


export const CalculatorPage = ({
    team, handleTeamChange, setEditingBuildFor,
    enemyKey, setEnemyKey, user, gameData, isAdmin, isFetchingProfile,
    onExport, onImport, onClearAll,
    presetName, setPresetName, savedPresets,
    onSavePreset, onLoadPreset, onDeletePreset, onSaveToMastersheet, onShowCreateLeaderboardModal,
    rotation, rotationDuration, setRotationDuration,
    mainView, setMainView,
    activeActionTray, setActiveActionTray,
    editingActionId, setEditingActionId,
    editingBuildFor,
    selectedActionIds, setSelectedActionIds,
    showBulkEdit, setShowBulkEdit,
    calculationResults, analyticsData, rotationSummary, handleFetchEnkaData,
    activeTeam,
    handleAddFromNotation, handleAddSingleAction,
    handleActionRepeatChange, handleDuplicateAction,
    handleActionSelect, handleBulkApplyBuffs,
    updateCharacterBuild, handleUpdateAction, handleRemoveAction,
    characterBuilds,
}) => {
    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);
    const scrollContainerRef = useRef(null);
    
    if (!user || !gameData) {
        return <div className="text-center p-10">Loading data...</div>;
    }
    
    const { characterData } = gameData;

    return (
        <div className="w-full flex max-w-[1700px] mx-auto p-4 gap-6 h-[calc(100vh-65px)]">
            <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
                <Sidebar
                    user={user} 
                    team={team} handleTeamChange={handleTeamChange} setEditingBuildFor={setEditingBuildFor}
                    enemyKey={enemyKey} setEnemyKey={setEnemyKey}
                    presetName={presetName} setPresetName={setPresetName} savedPresets={savedPresets}
                    onSavePreset={onSavePreset} onLoadPreset={onLoadPreset} onDeletePreset={onDeletePreset}
                    onExport={onExport} onImport={onImport} onClearAll={onClearAll}
                    gameData={gameData}
                    isFetchingProfile={isFetchingProfile}
                    handleFetchEnkaData={handleFetchEnkaData}
                    isAdmin={isAdmin}
                    onSaveToMastersheet={onSaveToMastersheet}
                    onShowCreateLeaderboardModal={onShowCreateLeaderboardModal}
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
                                    {selectedActionIds.length > 0 ? (
                                        <>
                                            <button onClick={() => setShowBulkEdit(true)} className="btn btn-secondary">
                                                Bulk Edit ({selectedActionIds.length})
                                            </button>
                                            <button onClick={() => setSelectedActionIds([])} className="btn btn-danger">
                                                Unselect All
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className='text-sm text-[var(--color-text-secondary)] mr-2'>Add:</span>
                                            {activeTeam.map(c => {
                                                const char = characterData[c];
                                                if (!char || !char.name) return null; 

                                                return (
                                                    <button 
                                                        key={c} 
                                                        onClick={() => setActiveActionTray(activeActionTray === c ? null : c)} 
                                                        className={`btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5 transition-colors ${activeActionTray === c ? 'bg-[var(--color-accent-primary)] text-white' : ''}`}
                                                    >
                                                        <img src={char.iconUrl} alt={char.name} className="w-5 h-5 rounded-full" />
                                                        {char.name.split(' ')[0]}
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                            {activeActionTray && (<div className="flex-shrink-0"><ActionTray charKey={activeActionTray} onAddNotation={handleAddFromNotation} onAddSingle={handleAddSingleAction} onClose={() => setActiveActionTray(null)} gameData={gameData}/></div>)}
                            <div ref={scrollContainerRef} className="space-y-2 mt-4 overflow-y-auto pr-2 flex-grow">
                                {rotation.map(action => {
                                    const result = calculationResults.find(res => res.actionId === action.id);
                                    return (
                                        <ActionRow
                                            key={action.id}
                                            action={action}
                                            result={result}
                                            isSelected={selectedActionIds.includes(action.id)}
                                            onSelect={handleActionSelect}
                                            onRepeatChange={handleActionRepeatChange}
                                            onDuplicate={handleDuplicateAction}
                                            onEdit={setEditingActionId}
                                            onRemove={handleRemoveAction}
                                            scrollContainerRef={scrollContainerRef}
                                            gameData={gameData}
                                        />
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
            {editingBuildFor && characterBuilds[editingBuildFor] && <BuildEditorModal charKey={editingBuildFor} build={characterBuilds[editingBuildFor]} updateBuild={updateCharacterBuild} onClose={() => setEditingBuildFor(null)} gameData={gameData} />}
            {editingAction && <ActionControlPanel action={editingAction} team={activeTeam} characterBuilds={characterBuilds} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)} gameData={gameData} />}
            {showBulkEdit && <BulkEditPanel rotation={rotation} selectedActionIds={selectedActionIds} onBulkApplyBuffs={handleBulkApplyBuffs} onClose={() => { setShowBulkEdit(false); setSelectedActionIds([]) }} team={activeTeam} characterBuilds={characterBuilds} gameData={gameData} />}
        </div>
    )
}