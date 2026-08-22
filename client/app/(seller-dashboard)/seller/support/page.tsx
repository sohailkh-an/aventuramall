import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown, Plus } from 'lucide-react';

export default function SupportTicketPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Support Ticket</h1>

      {/* Create Ticket Card */}
      <div className="flex justify-center mb-10">
        <button className="group outline-none">
          <Card className="w-[300px] md:w-[400px] border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white py-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-600 text-white flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <Plus className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <span className="text-blue-500 font-medium text-lg">Create a Ticket</span>
            </div>
          </Card>
        </button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">Tickets</CardTitle>
        </CardHeader>

        {/* Table Container for horizontal scrolling on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800">Ticket ID</th>
                <th className="px-6 py-4 font-bold text-slate-800">Sending Date</th>
                <th className="px-6 py-4 font-bold text-slate-800">Subject</th>
                <th className="px-6 py-4 font-bold text-slate-800">Status</th>
                <th className="px-6 py-4 font-bold text-slate-800 text-right">Options</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="p-0">
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
