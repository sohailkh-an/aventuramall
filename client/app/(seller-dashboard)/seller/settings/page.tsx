"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sellerAuthFetch, useSellerSession } from '@/lib/seller-auth-client';
import { toast } from 'sonner';
import { ExternalLink, Upload, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShopSettingsPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = useSellerSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopLogo: '',
    shopPhone: '',
    shopAddress: '',
    metaTitle: '',
    metaDescription: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !sessionData?.seller) {
      router.push('/seller/login');
    }
  }, [isPending, sessionData, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await sellerAuthFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/settings`
        );
        const data = await response.json();

        if (response.ok && data.settings) {
          setFormData({
            shopName: data.settings.shopName || '',
            shopLogo: data.settings.shopLogo || '',
            shopPhone: data.settings.shopPhone || '',
            shopAddress: data.settings.shopAddress || '',
            metaTitle: data.settings.metaTitle || '',
            metaDescription: data.settings.metaDescription || '',
          });
        } else {
          toast.error(data.error || 'Failed to load settings');
        }
      } catch (error) {
        toast.error('Network error while loading settings');
      } finally {
        setLoading(false);
      }
    };

    if (sessionData?.seller) {
      fetchSettings();
    }
  }, [sessionData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, shopLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await sellerAuthFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/settings`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success('Shop settings updated successfully');
      } else {
        toast.error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="p-4 md:p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Shop Settings</h1>
        <Link
          href={`/shop/${formData.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium transition-colors"
          target="_blank"
        >
          (Visit Shop)
          <ExternalLink className="w-3 h-3 ml-1" />
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">

              {/* Shop Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-slate-700 md:text-right">
                  Shop Name<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="md:col-span-3">
                  <Input
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="shop name"
                    required
                    className="max-w-2xl"
                  />
                </div>
              </div>

              {/* Shop Logo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pt-2">
                <label className="text-sm font-medium text-slate-700 md:text-right mt-2">
                  Shop Logo
                </label>
                <div className="md:col-span-3">
                  <div className="flex items-center gap-4">
                    {formData.shopLogo ? (
                      <div className="relative w-16 h-16 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                        <img
                          src={formData.shopLogo}
                          alt="Shop Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Store className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 max-w-xl">
                      <div className="flex">
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-r-none border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium z-10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse
                        </Button>
                        <div className="flex-1 border border-l-0 border-slate-300 rounded-r-md px-3 py-2 text-sm text-slate-500 bg-white flex items-center truncate">
                          {formData.shopLogo ? "Image Selected" : "Choose File"}
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Phone */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
                <label className="text-sm font-medium text-slate-700 md:text-right">
                  Shop Phone
                </label>
                <div className="md:col-span-3">
                  <Input
                    name="shopPhone"
                    value={formData.shopPhone}
                    onChange={handleInputChange}
                    placeholder="Phone"
                    className="max-w-2xl"
                  />
                </div>
              </div>

              {/* Shop Address */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
                <label className="text-sm font-medium text-slate-700 md:text-right">
                  Shop Address <span className="text-red-500">*</span>
                </label>
                <div className="md:col-span-3">
                  <Input
                    name="shopAddress"
                    value={formData.shopAddress}
                    onChange={handleInputChange}
                    placeholder="Address"
                    required
                    className="max-w-2xl"
                  />
                </div>
              </div>

              {/* Meta Title */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
                <label className="text-sm font-medium text-slate-700 md:text-right">
                  Meta Title<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="md:col-span-3">
                  <Input
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Meta Title"
                    required
                    className="max-w-2xl"
                  />
                </div>
              </div>

              {/* Meta Description */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pt-2">
                <label className="text-sm font-medium text-slate-700 md:text-right mt-2">
                  Meta description<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="md:col-span-3">
                  <Textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder=""
                    required
                    className="max-w-2xl min-h-[120px] resize-y"
                  />
                </div>
              </div>

            </div>
          </CardContent>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
