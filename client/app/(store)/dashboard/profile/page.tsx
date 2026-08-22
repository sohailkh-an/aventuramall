"use client";

import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MoreVertical } from "lucide-react";

const profileSchema = z.object({
  email: z.email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  image: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  cashPayment: z.boolean(),
  bankPayment: z.boolean(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  usdtPayment: z.boolean(),
  usdtLink: z.string().optional(),
  usdtAddress: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0 && data.password.length < 6) return false;
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["password"],
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
};

type ProfileData = ProfileFormValues & {
  phone?: string | null;
  image?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankRoutingNumber?: string | null;
  usdtLink?: string | null;
  usdtAddress?: string | null;
  hasTransactionPassword?: boolean;
};

type ApiDataResponse<T> = {
  data: T;
};

const emptyProfileValues: ProfileFormValues = {
  email: "",
  name: "",
  phone: "",
  image: "",
  password: "",
  confirmPassword: "",
  cashPayment: false,
  bankPayment: false,
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankRoutingNumber: "",
  usdtPayment: false,
  usdtLink: "",
  usdtAddress: "",
};

function mapProfileToFormValues(data?: ProfileData): ProfileFormValues {
  if (!data) return emptyProfileValues;

  return {
    email: data.email || "",
    name: data.name || "",
    phone: data.phone || "",
    image: data.image || "",
    password: "",
    confirmPassword: "",
    cashPayment: data.cashPayment || false,
    bankPayment: data.bankPayment || false,
    bankName: data.bankName || "",
    bankAccountName: data.bankAccountName || "",
    bankAccountNumber: data.bankAccountNumber || "",
    bankRoutingNumber: data.bankRoutingNumber || "",
    usdtPayment: data.usdtPayment || false,
    usdtLink: data.usdtLink || "",
    usdtAddress: data.usdtAddress || "",
  };
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["customer-profile"],
    queryFn: async () => {
      const [profileRes, addressRes] = await Promise.all([
        apiClient.get<ApiDataResponse<ProfileData>>("/api/users/me"),
        apiClient.get<ApiDataResponse<Address[]>>("/api/users/me/addresses"),
      ]);

      return {
        profile: profileRes.data,
        addresses: addressRes.data || [],
      };
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyProfileValues,
    values: mapProfileToFormValues(profileQuery.data?.profile),
    resetOptions: { keepDirtyValues: true },
  });

  const cashPayment = useWatch({ control: form.control, name: "cashPayment" });
  const bankPayment = useWatch({ control: form.control, name: "bankPayment" });
  const usdtPayment = useWatch({ control: form.control, name: "usdtPayment" });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const submitData: Partial<ProfileFormValues> = { ...values };
      delete submitData.confirmPassword;
      
      // Only send password if it was filled out
      if (!submitData.password) {
        delete submitData.password;
      }

      const res = await apiClient.patch<ApiDataResponse<ProfileData>>("/api/users/me", submitData);
      queryClient.setQueryData<{ profile: ProfileData; addresses: Address[] }>(
        ["customer-profile"],
        (current) => ({
          profile: res.data,
          addresses: current?.addresses || [],
        })
      );
      toast.success("Profile updated successfully");
      
      // Clear password fields after successful update
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"));
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="max-w-5xl">
        <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-red-600">Failed to fetch profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addresses = profileQuery.data?.addresses || [];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-normal text-slate-800">Manage Profile</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] text-slate-700 font-medium">Basic Info</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Your name</Label>
              <Input placeholder="FullName" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-red-500 col-start-2">{form.formState.errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Your Phone</Label>
              <Input placeholder="Your Phone" {...form.register("phone")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Photo</Label>
              <div className="flex w-full items-center border rounded-md overflow-hidden bg-white h-10">
                <div className="bg-slate-100 px-4 py-2 border-r text-sm text-slate-600 cursor-pointer hover:bg-slate-200 h-full flex items-center">
                  Browse
                </div>
                <div className="px-4 text-sm text-slate-400">Choose File</div>
              </div>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Your Password</Label>
              <Input type="password" placeholder="New Password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-red-500 col-start-2">{form.formState.errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6">
              <Label className="text-slate-600 font-normal">Confirm Password</Label>
              <Input type="password" placeholder="Confirm Password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && <p className="text-sm text-red-500 col-start-2">{form.formState.errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Payment Setting Section */}
        <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] text-slate-700 font-medium">Payment Setting</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-6">
              <Label className="text-slate-600 font-normal">Cash Payment</Label>
              <div className="flex justify-start">
                <Switch 
                  checked={cashPayment}
                  onCheckedChange={(val) => form.setValue("cashPayment", val, { shouldDirty: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-6">
              <Label className="text-slate-600 font-normal">Bank Payment</Label>
              <div className="flex justify-start">
                <Switch 
                  checked={bankPayment}
                  onCheckedChange={(val) => form.setValue("bankPayment", val, { shouldDirty: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Bank Name</Label>
              <Input placeholder="Bank Name" {...form.register("bankName")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Bank Account Name</Label>
              <Input placeholder="Bank Account Name" {...form.register("bankAccountName")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">Bank Account Number</Label>
              <Input placeholder="Bank Account Number" {...form.register("bankAccountNumber")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-6">
              <Label className="text-slate-600 font-normal">Bank Routing Number</Label>
              <Input placeholder="Bank Routing Number" {...form.register("bankRoutingNumber")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-6">
              <Label className="text-slate-600 font-normal">USDT Payment</Label>
              <div className="flex justify-start">
                <Switch 
                  checked={usdtPayment}
                  onCheckedChange={(val) => form.setValue("usdtPayment", val, { shouldDirty: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-4">
              <Label className="text-slate-600 font-normal">USDT Link</Label>
              <Input placeholder="USDT Link" {...form.register("usdtLink")} />
            </div>

            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-8">
              <Label className="text-slate-600 font-normal">USDT Address</Label>
              <Input placeholder="USDT Address" {...form.register("usdtAddress")} />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#E64A19] hover:bg-[#D84315] text-white">
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change your email Section */}
        <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] text-slate-700 font-medium">Change your email</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-[150px_1fr] items-center gap-6 mb-6">
              <Label className="text-slate-600 font-normal">Your Email</Label>
              <Input {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-red-500 col-start-2">{form.formState.errors.email.message}</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#E64A19] hover:bg-[#D84315] text-white">
                Update Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Address Section */}
      <Card className="rounded-md border-slate-100 shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] text-slate-700 font-medium">Address</h2>
        </div>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="border rounded-md p-4 relative bg-white shadow-sm flex flex-col justify-center min-h-[140px]">
                <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
                <div className="text-sm space-y-1 text-slate-600">
                  <p><span className="font-semibold text-slate-800">Address:</span> {address.street}</p>
                  <p><span className="font-semibold text-slate-800">Postal code:</span> {address.zip}</p>
                  <p><span className="font-semibold text-slate-800">City:</span> {address.city}</p>
                  <p><span className="font-semibold text-slate-800">State:</span> {address.state}</p>
                  <p><span className="font-semibold text-slate-800">Country:</span> {address.country}</p>
                  <p><span className="font-semibold text-slate-800">Phone:</span> {address.phone || "N/A"}</p>
                </div>
              </div>
            ))}

            <div className="border rounded-md p-4 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors min-h-[140px]">
              <Plus className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
              <span className="text-sm font-medium text-slate-600">Add New Address</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as { data?: { error?: string; message?: string }; message?: string };
  return apiError.data?.error || apiError.data?.message || apiError.message || fallback;
}
