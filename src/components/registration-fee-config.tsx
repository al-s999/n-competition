"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Calendar } from "lucide-react";

export interface PricingTier {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  price: string;
}

export interface RegistrationFeeConfig {
  category: string;
  subject: string;
  tiers: PricingTier[];
}

interface RegistrationFeeConfigProps {
  categories: string[];
  subjects: string[];
  isSplitBySubject: boolean;
  value: RegistrationFeeConfig[];
  onChange: (value: RegistrationFeeConfig[]) => void;
}

export function RegistrationFeeManager({
  categories,
  subjects,
  isSplitBySubject,
  value,
  onChange
}: RegistrationFeeConfigProps) {
  
  const getCombinations = () => {
    if (categories.length === 0) return [];
    if (isSplitBySubject && subjects.length > 0) {
      return categories.flatMap(c => subjects.map(s => ({ category: c, subject: s })));
    }
    return categories.map(c => ({ category: c, subject: "All Subjects" }));
  };

  const combinations = getCombinations();

  // Initialize configurations if missing
  React.useEffect(() => {
    const existingMap = new Map();
    value.forEach(v => existingMap.set(`${v.category}-${v.subject}`, v));
    
    let hasChanges = false;
    const newConfigs: RegistrationFeeConfig[] = combinations.map(combo => {
      const key = `${combo.category}-${combo.subject}`;
      if (existingMap.has(key)) {
        return existingMap.get(key);
      }
      hasChanges = true;
      return {
        category: combo.category,
        subject: combo.subject,
        tiers: []
      };
    });

    // Only update if combinations changed to prevent infinite loops
    if (hasChanges || newConfigs.length !== value.length) {
      onChange(newConfigs);
    }
  }, [categories, subjects, isSplitBySubject]);

  const addTier = (index: number) => {
    const newConfigs = [...value];
    newConfigs[index].tiers.push({
      id: Math.random().toString(36).substr(2, 9),
      name: "Early Bird",
      startDate: "",
      endDate: "",
      price: ""
    });
    onChange(newConfigs);
  };

  const removeTier = (configIndex: number, tierIndex: number) => {
    const newConfigs = [...value];
    newConfigs[configIndex].tiers.splice(tierIndex, 1);
    onChange(newConfigs);
  };

  const updateTier = (configIndex: number, tierIndex: number, field: keyof PricingTier, val: string) => {
    const newConfigs = [...value];
    if (field === 'price') {
      const numericString = val.replace(/\D/g, "");
      if (!numericString) {
        newConfigs[configIndex].tiers[tierIndex].price = "";
      } else {
        newConfigs[configIndex].tiers[tierIndex].price = parseInt(numericString, 10).toLocaleString('id-ID');
      }
    } else {
      newConfigs[configIndex].tiers[tierIndex][field] = val;
    }
    onChange(newConfigs);
  };

  if (combinations.length === 0) {
    return (
      <div className="text-sm text-zinc-500 bg-zinc-50 dark:bg-[#121212] p-4 rounded-lg border border-zinc-200 dark:border-white/10">
        Please add categories (and subjects if split) to configure dynamic pricing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {value.map((config, cIdx) => (
        <div key={`${config.category}-${config.subject}`} className="bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="bg-white dark:bg-[#1a1a1a] p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-900 dark:text-white">{config.category}</span>
              {config.subject !== "All Subjects" && (
                <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                  {config.subject}
                </Badge>
              )}
            </div>
            <Button type="button" onClick={() => addTier(cIdx)} variant="outline" size="sm" className="h-8 bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20 hover:bg-[#00e599]/20">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Pricing Tier
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            {config.tiers.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-2">No dynamic pricing configured. The default registration fee will be used.</p>
            ) : (
              config.tiers.map((tier, tIdx) => (
                <div key={tier.id} className="flex flex-col xl:flex-row gap-3 items-end bg-white dark:bg-black/20 p-3 rounded-lg border border-zinc-200 dark:border-white/10">
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-xs text-zinc-500">Tier Name</Label>
                    <Input 
                      value={tier.name} 
                      onChange={(e) => updateTier(cIdx, tIdx, 'name', e.target.value)} 
                      placeholder="e.g. Early Bird"
                      className="h-9 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-xs text-zinc-500">Start Date</Label>
                    <Input 
                      type="date"
                      value={tier.startDate} 
                      onChange={(e) => updateTier(cIdx, tIdx, 'startDate', e.target.value)} 
                      className="h-9 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-xs text-zinc-500">End Date</Label>
                    <Input 
                      type="date"
                      value={tier.endDate} 
                      onChange={(e) => updateTier(cIdx, tIdx, 'endDate', e.target.value)} 
                      className="h-9 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <Label className="text-xs text-zinc-500">Price (Rp)</Label>
                    <Input 
                      value={tier.price} 
                      onChange={(e) => updateTier(cIdx, tIdx, 'price', e.target.value)} 
                      placeholder="e.g. 50.000"
                      className="h-9 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 font-semibold text-[#00e599]"
                    />
                  </div>
                  <Button type="button" onClick={() => removeTier(cIdx, tIdx)} variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
