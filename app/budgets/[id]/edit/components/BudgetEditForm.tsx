"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Money } from "@/app/Money";
import { Budget, BudgetPeriod, Category } from "@prisma/client";

type Props = {
  budget: Pick<Budget, "id" | "name" | "period" | "repeat"> & {
    categories?: { id: string }[];
    value: number;
  };
  categories: Pick<Category, "id" | "parentId" | "name" | "type">[];
};

export default function BudgetEditForm({ budget, categories }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: budget.name,
    value: budget.value,
    period: budget.period as BudgetPeriod,
    repeat: budget.repeat || false,
    selectedCategories: budget.categories?.map(c => c.id) || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          value: formData.value,
          period: formData.period,
          repeat: formData.repeat,
          categoryIds: formData.selectedCategories,
        }),
      });

      if (response.ok) {
        router.push(`/budgets/${budget.id}`);
        router.refresh();
      } else {
        console.error("Failed to update budget");
      }
    } catch (error) {
      console.error("Error updating budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleCancel = () => {
    router.push(`/budgets/${budget.id}`);
  };

  return (
    <div className="min-h-full bg-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6">Edit Budget</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Budget Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Budget Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Budget Amount */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-300 mb-2">
                Budget Amount
              </label>
              <input
                type="number"
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="1000"
              />
              <div className="mt-1 text-sm text-gray-400">
                Preview: <Money value={formData.value} />
              </div>
            </div>

            {/* Period */}
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-300 mb-2">
                Period
              </label>
              <select
                id="period"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as BudgetPeriod }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            {/* Repeat */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repeat"
                checked={formData.repeat}
                onChange={(e) => setFormData(prev => ({ ...prev, repeat: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="repeat" className="ml-2 text-sm font-medium text-gray-300">
                Repeat this budget automatically
              </label>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Categories
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={formData.selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className={`ml-2 text-sm text-gray-300 ${
                        category.parentId ? 'ml-6' : ''
                      }`}
                    >
                      {category.parentId ? '└─ ' : ''}{category.name}
                      <span className="text-xs text-gray-500 ml-2">({category.type})</span>
                    </label>
                  </div>
                ))}
              </div>
              {formData.selectedCategories.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  Select at least one category for this budget
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading || formData.selectedCategories.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Updating..." : "Update Budget"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}