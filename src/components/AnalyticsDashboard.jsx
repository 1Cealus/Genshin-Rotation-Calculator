import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ELEMENT_COLORS = {
  pyro: '#ff7755',
  hydro: '#5599ff',
  dendro: '#99ff55',
  electro: '#cc77ff',
  anemo: '#77ffcc',
  cryo: '#77ccff',
  geo: '#ffcc55',
  physical: '#dddddd',
  default: '#8884d8'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.name || label;
    // Access the full data from the payload to show both metrics
    const totalDamage = data.total;
    const dps = data.dps;

    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg text-sm">
        <p className="label text-white font-bold capitalize">{`${name}`}</p>
        <p className="text-gray-300">Total Damage: <span className="text-cyan-400 font-mono">{totalDamage.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></p>
        <p className="text-gray-300">DPS: <span className="text-cyan-400 font-mono">{dps.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></p>
      </div>
    );
  }
  return null;
};

const AnalyticsDashboard = ({ analyticsData }) => {
    const { 
        characterMetrics = {}, 
        elementMetrics = {}, 
        sourceMetrics = [] 
    } = analyticsData || {};

    // Chart data is now permanently calculated based on DPS
    const [characterPieData, elementPieData, sourceBarData] = useMemo(() => {
        const charData = Object.entries(characterMetrics).map(([name, values]) => ({ name, value: values.dps, ...values }));
        const elemData = Object.entries(elementMetrics).map(([name, values]) => ({ name, value: values.dps, ...values }));
        // Sort the source breakdown by DPS as well
        const srcData = sourceMetrics.map(source => ({ ...source, value: source.dps })).sort((a, b) => b.dps - a.dps);
        
        return [charData, elemData, srcData];
    }, [characterMetrics, elementMetrics, sourceMetrics]);
    
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/60 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Character DPS Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={characterPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                                {characterPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name.toLowerCase()] || ELEMENT_COLORS.default} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(value) => <span className="text-gray-300 capitalize">{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-800/60 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Element DPS Distribution</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={elementPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                                {elementPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name.toLowerCase()] || ELEMENT_COLORS.default} />)}
                            </Pie>
                             <Tooltip content={<CustomTooltip />} />
                             <Legend formatter={(value) => <span className="text-gray-300 capitalize">{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-gray-800/60 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Damage by Character (DPS)</h3>
                <ResponsiveContainer width="100%" height={Math.max(120, characterPieData.length * 60)}>
                    <BarChart data={characterPieData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                        <XAxis type="number" stroke="#9ca3af" domain={[0, 'dataMax']} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                        <Bar dataKey="value" barSize={30}>
                             {characterPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name.toLowerCase()] || ELEMENT_COLORS.default} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-gray-800/60 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Damage Source Breakdown (DPS)</h3>
                <ResponsiveContainer width="100%" height={Math.max(200, sourceBarData.length * 50)}>
                    <BarChart data={sourceBarData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                        <XAxis type="number" stroke="#9ca3af" domain={[0, 'dataMax']} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={200} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                        <Bar dataKey="value" barSize={25}>
                             {sourceBarData.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.element.toLowerCase()] || ELEMENT_COLORS.default} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;