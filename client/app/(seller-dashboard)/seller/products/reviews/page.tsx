import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';

export default function SellerProductReviewsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">Product Reviews</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-800 bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">#</th>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Rating</th>
                <th className="px-6 py-4 font-bold">Comment</th>
                <th className="px-6 py-4 font-bold">Published</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
              <tr>
                <td colSpan={6} className="px-6 py-20 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Frown className="w-12 h-12 mb-4 text-slate-400" strokeWidth={1.5} />
                    <p className="text-lg font-medium text-slate-600">Nothing found</p>
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
