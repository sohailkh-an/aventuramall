import React from "react";
import { TopBar } from "./TopBar";
import { MainHeader } from "./MainHeader";
import { NavMenu } from "./NavMenu";
import { apiClient } from "@/lib/api";
import { NavbarScrollWrapper } from "./NavbarScrollWrapper";

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
    <NavbarScrollWrapper>
      <TopBar />
      <MainHeader />
      <NavMenu categories={categories} />
    </NavbarScrollWrapper>
  );
}

