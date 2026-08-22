import React from "react";
import { TopBar } from "./TopBar";
import { MainHeader } from "./MainHeader";
import { NavMenu } from "./NavMenu";
import { apiClient } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function Navbar() {
  let categories: Category[] = [];
  try {
    const res = await apiClient.get<{ data: Category[] }>("/api/categories");
    categories = res.data || [];
  } catch (error) {
    console.error("Failed to fetch categories for NavMenu:", error);
  }

  return (
    <nav className="flex flex-col w-full sticky top-0 z-40 bg-background/95 backdrop-blur-md transition-colors duration-200">
      <TopBar />
      <MainHeader />
      <NavMenu categories={categories} />
    </nav>
  );
}

