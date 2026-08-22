import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';

export default function CommissionHistoryPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">Commission History</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Daterange"
              className="w-full sm:w-[250px] bg-white"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]">
              Filter
            </Button>
          </div>
        </CardHeader>

        {/* Table Container for horizontal scrolling on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800">#</th>
                <th className="px-6 py-4 font-bold text-slate-800">Order Code:</th>
                <th className="px-6 py-4 font-bold text-slate-800">Admin Commission</th>
                <th className="px-6 py-4 font-bold text-slate-800">Earning</th>
                <th className="px-6 py-4 font-bold text-slate-800">Created At</th>
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
