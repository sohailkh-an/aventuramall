import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';

export default function ProductQueriesPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Card className="border-none shadow-sm bg-white overflow-hidden mt-2">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">Product Queries</CardTitle>
        </CardHeader>

        {/* Table Container for horizontal scrolling on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800">#</th>
                <th className="px-6 py-4 font-bold text-slate-800">User Name</th>
                <th className="px-6 py-4 font-bold text-slate-800">Product Name</th>
                <th className="px-6 py-4 font-bold text-slate-800">Question</th>
                <th className="px-6 py-4 font-bold text-slate-800">Reply</th>
                <th className="px-6 py-4 font-bold text-slate-800">Status</th>
                <th className="px-6 py-4 font-bold text-slate-800 text-right">Options</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="p-0">
                  <div className="w-full flex flex-col items-center justify-center py-24 bg-slate-50/50">
                    <Frown className="w-12 h-12 text-slate-400 mb-3" strokeWidth={1.5} />
                    <p className="text-lg text-slate-600 font-medium">Nothing found</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
