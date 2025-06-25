import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define colors for elements for consistent charting
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
    // FIX: For Pie charts, the label is inside payload[0].payload.name
    // For Bar charts, the label is in the 'label' prop. We prioritize the pie chart's payload.
    const name = payload[0].payload.name || label;
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg">
        <p className="label text-white font-bold capitalize">{`${name}`}</p>
        <p className="intro text-cyan-400">{`Damage : ${payload[0].value.toLocaleString(undefined, {maximumFractionDigits: 0})}`}</p>
      </div>
    );
  }
  return null;
};

const AnalyticsDashboard = ({ analyticsData }) => {
    const { characterDps, elementDps, sourceDps } = analyticsData;

    // Convert data for Pie charts
    const characterPieData = Object.entries(characterDps).map(([name, value]) => ({ name, value }));
    const elementPieData = Object.entries(elementDps).map(([name, value]) => ({ name, value }));
    
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Don't render labels for tiny slices
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Character DPS Pie Chart */}
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

                {/* Element DPS Pie Chart */}
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

            {/* Character DPS Bar Chart */}
            <div className="bg-gray-800/60 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Character DPS</h3>
                <ResponsiveContainer width="100%" height={characterPieData.length * 60}>
                    <BarChart data={characterPieData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                        <Bar dataKey="value" barSize={30}>
                             {characterPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name.toLowerCase()] || ELEMENT_COLORS.default} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

             {/* Source DPS Bar Chart */}
            <div className="bg-gray-800/60 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Damage Source Breakdown</h3>
                <ResponsiveContainer width="100%" height={sourceDps.length * 50}>
                    <BarChart data={sourceDps} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                        <XAxis type="number" stroke="#9ca3af" />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={200} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                        <Bar dataKey="value" barSize={25}>
                             {sourceDps.map((entry, index) => <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.element.toLowerCase()] || ELEMENT_COLORS.default} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
