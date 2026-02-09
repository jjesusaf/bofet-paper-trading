"use client";

import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { useDictionary } from "@/providers/dictionary-provider";
import { cn } from "@/utils/classNames";

interface CategoryTabsProps {
  activeCategory: CategoryId;
  onCategoryChange: (categoryId: CategoryId) => void;
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const { dict } = useDictionary();

  // Get translated label for a category
  const getCategoryLabel = (categoryId: CategoryId): string => {
    const categoryTranslation = (dict.exploreMarkets?.categories as any)?.[categoryId];
    if (categoryTranslation) {
      return categoryTranslation;
    }
    // Fallback to the label from CATEGORIES constant
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.label || categoryId;
  };

  return (
    <div className="flex items-center gap-6 mb-0 overflow-x-auto custom-scrollbar pb-2">
      <div className="flex items-center gap-6 shrink-0">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "text-sm font-medium transition-all duration-200 whitespace-nowrap pb-1 border-b-2 border-transparent cursor-pointer",
              activeCategory === category.id
                ? "text-gray-900 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {getCategoryLabel(category.id)}
          </button>
        ))}
      </div>
    </div>
  );
}

