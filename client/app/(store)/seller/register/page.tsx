'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/store/ImageUpload';
import { toast } from 'sonner';

const registerSellerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email address'), //the z.string.email is depricated, this is the correct way to write it according to latest documentation
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
    transactionPassword: z.string().min(6, 'Transaction password must be at least 6 characters'),
    repeatTransactionPassword: z
      .string()
      .min(6, 'Repeat transaction password must be at least 6 characters'),
    shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
    idType: z.enum(['ID_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'SOCIAL_SECURITY']),
    idFrontImage: z.string().min(1, 'ID Front image is required'),
    idBackImage: z.string().min(1, 'ID Back image is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.transactionPassword === data.repeatTransactionPassword, {
    message: 'Transaction passwords do not match',
    path: ['repeatTransactionPassword'],
  });

type RegisterSellerFormValues = z.infer<typeof registerSellerSchema>;

export default function SellerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterSellerFormValues>({
    resolver: zodResolver(registerSellerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      transactionPassword: '',
      repeatTransactionPassword: '',
      shopName: '',
      idType: 'ID_CARD',
      idFrontImage: '',
      idBackImage: '',
    },
  });

  const onSubmit = async (data: RegisterSellerFormValues) => {
    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${API_BASE}/api/seller/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle specific HTTP status codes with user-friendly messages
        switch (response.status) {
          case 400:
            // Bad Request - usually validation or duplicate email
            toast.error('Registration failed', {
              description: result.error || 'Please check your information and try again.',
            });
            break;
          case 413:
            // Content Too Large - images too large
            toast.error('Upload failed', {
              description: 'One or more images are too large. Please try uploading a smaller image.',
            });
            break;
          case 409:
            // Conflict - email already exists
            toast.error('Registration failed', {
              description: 'An account with this email already exists. Please use a different email.',
            });
            break;
          case 500:
          case 502:
          case 503:
            // Server errors
            toast.error('Server error', {
              description: 'Our servers are having issues. Please try again in a few moments.',
            });
            break;
          default:
            toast.error('Registration failed', {
              description: result.error || 'An unexpected error occurred. Please try again.',
            });
        }
      } else {
        toast.success('Shop registered successfully!', {
          description: 'Your shop is currently pending verification.',
        });
        router.push('/seller/dashboard');
      }
    } catch (error: unknown) {
      // Handle network errors and CORS issues
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof TypeError) {
        // Network error or CORS issue
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Unable to connect to the server. Please try again later.';
        }
      }

      toast.error('Connection error', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-0 max-w-3xl">
      <Card className="p-5">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register Your Shop</CardTitle>
          <CardDescription>Join as a seller and start selling your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Banner for Image Requirements */}
            {/* <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Image Upload Tips</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Upload clear photos of both sides of your ID. Images must be JPEG, PNG, or WEBP format. Blurry or invalid images may cause delays in verification.
                </p>
              </div>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={errors.name ? 'text-red-500' : ''}>
                  Full Name
                </Label>
                <Input id="name" {...register('name')} placeholder="John Doe" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={errors.email ? 'text-red-500' : ''}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className={errors.password ? 'text-red-500' : ''}>
                  Password
                </Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className={errors.confirmPassword ? 'text-red-500' : ''}
                >
                  Confirm Password
                </Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="transactionPassword"
                  className={errors.transactionPassword ? 'text-red-500' : ''}
                >
                  Transaction Password
                </Label>
                <Input
                  id="transactionPassword"
                  type="password"
                  {...register('transactionPassword')}
                />
                {errors.transactionPassword && (
                  <p className="text-sm text-red-500">{errors.transactionPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="repeatTransactionPassword"
                  className={errors.repeatTransactionPassword ? 'text-red-500' : ''}
                >
                  Repeat Transaction Password
                </Label>
                <Input
                  id="repeatTransactionPassword"
                  type="password"
                  {...register('repeatTransactionPassword')}
                />
                {errors.repeatTransactionPassword && (
                  <p className="text-sm text-red-500">{errors.repeatTransactionPassword.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shopName" className={errors.shopName ? 'text-red-500' : ''}>
                  Shop Name
                </Label>
                <Input id="shopName" {...register('shopName')} placeholder="My Awesome Shop" />
                {errors.shopName && (
                  <p className="text-sm text-red-500">{errors.shopName.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className={errors.idType ? 'text-red-500' : ''}>Identification Type</Label>
                <Controller
                  name="idType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => val && field.onChange(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ID_CARD">National ID Card</SelectItem>
                        <SelectItem value="PASSPORT">Passport</SelectItem>
                        <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                        <SelectItem value="SOCIAL_SECURITY">Social Security Card</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.idType && <p className="text-sm text-red-500">{errors.idType.message}</p>}
              </div>

              <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="idFrontImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      label="ID Front Image"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.idFrontImage?.message}
                    />
                  )}
                />

                <Controller
                  name="idBackImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      label="ID Back Image"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.idBackImage?.message}
                    />
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register Shop'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
