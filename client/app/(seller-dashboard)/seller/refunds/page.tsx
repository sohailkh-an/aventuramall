import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';

export default function RefundRequestsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Refund Requests</h1>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">All Refund Request</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800">#</th>
                <th className="px-6 py-4 font-bold text-slate-800">Date</th>
                <th className="px-6 py-4 font-bold text-slate-800">Order Id</th>
                <th className="px-6 py-4 font-bold text-slate-800">Product</th>
                <th className="px-6 py-4 font-bold text-slate-800">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-800">Status</th>
                <th className="px-6 py-4 font-bold text-slate-800">Reason</th>
                <th className="px-6 py-4 font-bold text-slate-800">Approval</th>
                <th className="px-6 py-4 font-bold text-slate-800">Reject</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} className="p-0">
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
