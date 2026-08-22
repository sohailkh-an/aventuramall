"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sellerAuthFetch } from '@/lib/seller-auth-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [cashPayment, setCashPayment] = useState(false);
  const [usdtPayment, setUsdtPayment] = useState(false);
  const [usdtLink, setUsdtLink] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');

  const [email, setEmail] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await sellerAuthFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/profile`
        );
        const data = await response.json();

        if (response.ok && data.profile) {
          setName(data.profile.name || '');
          setPhone(data.profile.phone || '');
          setEmail(data.profile.email || '');
          setAvatarPreview(data.profile.avatar || null);
          setCashPayment(data.profile.cashPayment || false);
          setUsdtPayment(data.profile.usdtPayment || false);
          setUsdtLink(data.profile.usdtLink || '');
          setUsdtAddress(data.profile.usdtAddress || '');
        } else {
          toast.error(data.error || 'Failed to load profile');
        }
      } catch (error) {
        toast.error('Network error loading profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setAvatarBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        name,
        phone,
        cashPayment,
        usdtPayment,
        usdtLink,
        usdtAddress,
      };

      if (avatarBase64) payload.avatar = avatarBase64;
      if (password) payload.password = password;

      const response = await sellerAuthFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/profile`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success('Profile updated successfully');
        setPassword('');
        setConfirmPassword('');
        setAvatarBase64(null); // Clear base64 so we don't re-upload on next save
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setSavingEmail(true);
    try {
      const response = await sellerAuthFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/profile`,
        {
          method: 'PUT',
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success('Email updated successfully');
      } else {
        toast.error(data.error || 'Failed to update email');
      }
    } catch (error) {
      toast.error('Network error updating email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleVerifyEmail = () => {
    toast.success('Verification email sent! Please check your inbox.');
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Basic Info */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Your name</label>
            <div className="md:col-span-3">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Your Phone</label>
            <div className="md:col-span-3">
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your Phone" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Photo</label>
            <div className="md:col-span-3 flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <div className="flex w-full items-center">
                <Button
                  variant="secondary"
                  className="rounded-r-none border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse
                </Button>
                <div className="flex-1 border border-l-0 border-slate-200 rounded-r-md px-3 py-2 text-sm text-slate-500 bg-white h-10 flex items-center overflow-hidden">
                  {fileInputRef.current?.files?.[0]?.name || 'Choose File'}
                </div>
              </div>
              {avatarPreview && (
                <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden flex-shrink-0">
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Your Password</label>
            <div className="md:col-span-3">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Confirm Password</label>
            <div className="md:col-span-3">
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Setting */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">Payment Setting</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Cash Payment</label>
            <div className="md:col-span-3">
              <button
                className={`w-11 h-6 rounded-full transition-colors focus:outline-none relative ${cashPayment ? 'bg-blue-500' : 'bg-slate-200'}`}
                onClick={() => setCashPayment(!cashPayment)}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${cashPayment ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">USDT Payment</label>
            <div className="md:col-span-3">
              <button
                className={`w-11 h-6 rounded-full transition-colors focus:outline-none relative ${usdtPayment ? 'bg-blue-500' : 'bg-slate-200'}`}
                onClick={() => setUsdtPayment(!usdtPayment)}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${usdtPayment ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">USDT Link</label>
            <div className="md:col-span-3">
              <Input value={usdtLink} onChange={e => setUsdtLink(e.target.value)} placeholder="USDT Link" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">USDT Address</label>
            <div className="md:col-span-3">
              <Input value={usdtAddress} onChange={e => setUsdtAddress(e.target.value)} placeholder="USDT Address" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleUpdateProfile} disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update Profile
        </Button>
      </div>

      {/* Change your email */}
      <Card className="border-slate-200 shadow-sm mt-8">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">Change your email</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 md:text-right md:pr-4">Your Email</label>
            <div className="md:col-span-3 flex gap-4">
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="myemail@gmail.com" className="flex-1" />
              <Button variant="outline" onClick={handleVerifyEmail} className="border-slate-200 text-slate-700">Verify</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-10">
        <Button onClick={handleUpdateEmail} disabled={savingEmail} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
          {savingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update Email
        </Button>
      </div>

    </div>
  );
}
