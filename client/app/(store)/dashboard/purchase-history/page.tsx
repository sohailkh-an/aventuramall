'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

export default function PurchaseHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res: any = await apiClient.get('/api/orders');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
      case 'PROCESSING':
        return <Package className="w-4 h-4 mr-1 text-blue-500" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4 mr-1 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 mr-1 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Purchase History</h1>
        <p className="text-slate-500 mt-1">View and track your past orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No orders found</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            You haven't placed any orders yet. Start shopping to see your history here!
          </p>
          <Link
            href="/products"
            className="bg-brand text-white px-6 py-2 rounded-md font-medium hover:bg-brand/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden shadow-sm hover:shadow transition-shadow"
            >
              <div className="bg-slate-50 border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                      Order Placed
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                      Total
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatPrice(Number(order.total))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                      Ship To
                    </p>
                    <p className="text-sm font-medium text-brand truncate max-w-[150px]">
                      {order.shippingAddress?.label || 'Home'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                    Order ID
                  </p>
                  <p className="text-sm font-mono font-medium text-slate-800">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                    <h4 className="font-medium text-slate-800 mb-4">Items</h4>
                    <div className="space-y-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-16 rounded bg-slate-100 overflow-hidden shrink-0">
                            {item.product?.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${item.product?.slug}`}
                              className="font-medium text-slate-800 hover:text-brand line-clamp-1"
                            >
                              {item.product?.name || 'Unknown Product'}
                            </Link>
                            <p className="text-sm text-slate-500 mt-1">Qty: {item.quantity}</p>
                            <p className="text-sm font-medium text-brand mt-1">
                              {formatPrice(Number(item.price))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 p-6 flex flex-col justify-center items-center text-center bg-slate-50/50">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full border ${getStatusColor(order.status)} mb-4`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="font-medium text-sm ml-1">{order.status}</span>
                    </div>
                    {/* <Link href={`/dashboard/purchase-history/${order.id}`} className="text-sm text-brand hover:underline font-medium">
                      View Order Details
                    </Link> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
