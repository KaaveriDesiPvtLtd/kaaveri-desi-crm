import React from 'react';
import { BarChart3, TrendingUp, IndianRupee, Package } from 'lucide-react';

const ReportCard = ({ title, description, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
        <div className={`p-3 rounded-lg w-fit mb-4 ${color}`}>
            <Icon className="text-white" size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
    </div>
);

const Reports = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
       <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Reports & Analytics</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard 
                title="Sales & Revenue" 
                description="Detailed breakdown of sales by channel and time period." 
                icon={IndianRupee} 
                color="bg-emerald-500" 
            />
            <ReportCard 
                title="Inventory Valuation" 
                description="Current stock value based on cost price vs selling price." 
                icon={Package} 
                color="bg-blue-500" 
            />
            <ReportCard 
                title="Profit Margins" 
                description="Net profit analysis after commissions and shipping costs." 
                icon={TrendingUp} 
                color="bg-purple-500" 
            />
            <ReportCard 
                title="Channel Performance" 
                description="Comparing ROI across Amazon, Swiggy, and Website." 
                icon={BarChart3} 
                color="bg-orange-500" 
            />
       </div>

       <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-500">More detailed reports coming soon...</p>
       </div>
    </div>
  );
};

export default Reports;
