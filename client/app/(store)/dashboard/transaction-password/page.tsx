"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function TransactionPasswordPage() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res: any = await apiClient.get("/api/users/me");
        setHasPassword(res.data.hasTransactionPassword);
      } catch (error) {
        toast.error("Failed to fetch user data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      await apiClient.put("/api/users/me/transaction-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Transaction password updated successfully!");
      setHasPassword(true);
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update transaction password");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Transaction Password</h1>
        <p className="text-slate-500 mt-1">Manage your transaction password used for secure checkouts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{hasPassword ? "Update Password" : "Set Password"}</CardTitle>
          <CardDescription>
            {hasPassword 
              ? "Enter your current transaction password to update it." 
              : "Set a new transaction password to secure your future purchases."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  {...form.register("currentPassword")} 
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.currentPassword.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="••••••••" 
                {...form.register("newPassword")} 
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                {...form.register("confirmPassword")} 
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
              {form.formState.isSubmitting ? "Saving..." : "Save Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
