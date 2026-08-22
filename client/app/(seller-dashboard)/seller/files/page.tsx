"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trash2, Frown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { sellerAuthFetch, useSellerSession } from '@/lib/seller-auth-client';
import { toast } from 'sonner';

interface SellerFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
  createdAt: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function SellerFilesPage() {
  const { data: sessionData, isPending } = useSellerSession();
  const [files, setFiles] = useState<SellerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionData?.seller) {
      fetchFiles();
    }
  }, [sessionData]);

  const fetchFiles = async () => {
    try {
      const response = await sellerAuthFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/files`
      );
      const data = await response.json();

      if (response.ok && data.files) {
        setFiles(data.files);
      } else {
        toast.error(data.error || 'Failed to load files');
      }
    } catch (error) {
      toast.error('Network error while loading files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    // Validate size (5MB limit)
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} exceeds the 5MB limit.`);
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await sellerAuthFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/files`,
          {
            method: 'POST',
            body: JSON.stringify({
              base64: base64Data,
              name: file.name,
              type: file.type,
              size: file.size,
            }),
          }
        );

        const data = await response.json();
        if (response.ok && data.file) {
          toast.success('File uploaded successfully');
          setFiles(prev => [data.file, ...prev]);
        } else {
          toast.error(data.error || 'Failed to upload file');
        }
        setUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
    } catch (error) {
      toast.error('An error occurred during upload');
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeletingId(id);
    try {
      const response = await sellerAuthFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seller/files/${id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success('File deleted successfully');
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete file');
      }
    } catch (error) {
      toast.error('Network error while deleting file');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const isImage = (type: string | null, url: string) => {
    if (type && type.startsWith('image/')) return true;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Uploaded Files</h1>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden mb-6">
        <CardContent className="p-0">
          <div
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-lg m-4 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-600">Uploading file...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-medium text-slate-800 mb-1">Click or drag file to this area to upload</h3>
                <p className="text-sm text-slate-500 mb-4">Support for images and documents (Max size: 5MB).</p>
                <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-100">
                  Select File
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">Your Files</CardTitle>
        </CardHeader>

        {loading || isPending ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-24 bg-slate-50/50">
            <Frown className="w-12 h-12 text-slate-400 mb-3" strokeWidth={1.5} />
            <p className="text-lg text-slate-600 font-medium">Nothing found</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div key={file.id} className="group relative border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                  {isImage(file.type, file.url) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-16 h-16 text-slate-300" strokeWidth={1} />
                  )}

                  {/* Delete overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      disabled={deletingId === file.id}
                      onClick={() => handleDelete(file.id)}
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500 uppercase">
                      {file.type?.split('/')[1] || 'FILE'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
