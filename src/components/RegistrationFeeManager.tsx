import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface PricingTier {
  name: string;
  startDate: string;
  endDate: string;
  price: number;
}

export interface RegistrationFeeConfig {
  category: string;
  subject: string;
  tiers: PricingTier[];
}

interface Props {
  categories: string[];
  subjects: string[];
  isSplitBySubject: boolean;
  value: RegistrationFeeConfig[];
  onChange: (value: RegistrationFeeConfig[]) => void;
}

export function RegistrationFeeManager({ categories, subjects, isSplitBySubject, value, onChange }: Props) {
  // Generate required combinations
  const getRequiredCombinations = () => {
    if (categories.length === 0) return [];
    if (isSplitBySubject && subjects.length > 0) {
      return categories.flatMap(c => subjects.map(s => ({ category: c, subject: s })));
    }
    return categories.map(c => ({ category: c, subject: "" }));
  };

  const requiredCombinations = getRequiredCombinations();

  // Initialize missing combinations
  React.useEffect(() => {
    let hasChanges = false;
    const newValue = [...value];

    requiredCombinations.forEach(combo => {
      const exists = newValue.find(v => v.category === combo.category && v.subject === combo.subject);
      if (!exists) {
        newValue.push({
          category: combo.category,
          subject: combo.subject,
          tiers: [{ name: "Normal", startDate: "", endDate: "", price: 0 }]
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChange(newValue);
    }
  }, [categories, subjects, isSplitBySubject]);

  const updateTier = (configIndex: number, tierIndex: number, field: keyof PricingTier, val: any) => {
    const newValue = [...value];
    newValue[configIndex].tiers[tierIndex] = {
      ...newValue[configIndex].tiers[tierIndex],
      [field]: val
    };
    onChange(newValue);
  };

  const addTier = (configIndex: number) => {
    const newValue = [...value];
    newValue[configIndex].tiers.push({ name: "Early Bird", startDate: "", endDate: "", price: 0 });
    onChange(newValue);
  };

  const removeTier = (configIndex: number, tierIndex: number) => {
    const newValue = [...value];
    newValue[configIndex].tiers.splice(tierIndex, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-6">
      {value.map((config, configIndex) => {
        // Only show if it's currently a valid combination
        const isValid = requiredCombinations.some(c => c.category === config.category && c.subject === config.subject);
        if (!isValid) return null;

        const title = config.subject ? `${config.category} - ${config.subject}` : config.category;

        return (
          <div key={`${config.category}-${config.subject}`} className="bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-3">
              <Label className="text-[#00e599] text-sm uppercase font-bold tracking-wider">{title}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTier(configIndex)}
                className="h-8 border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
              </Button>
            </div>

            <div className="space-y-4">
              {config.tiers.map((tier, tierIndex) => (
                <div key={tierIndex} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white dark:bg-[#121212] p-4 rounded-lg border border-zinc-100 dark:border-white/5 shadow-inner relative group">
                  
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Tier Name</Label>
                    <Input 
                      placeholder="e.g. Early Bird" 
                      value={tier.name}
                      onChange={(e) => updateTier(configIndex, tierIndex, 'name', e.target.value)}
                      className="bg-zinc-50 dark:bg-[#1a1a1a] h-9 text-xs border-zinc-200 dark:border-white/10"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Start Date</Label>
                    <Input 
                      type="date"
                      value={tier.startDate}
                      onChange={(e) => updateTier(configIndex, tierIndex, 'startDate', e.target.value)}
                      className="bg-zinc-50 dark:bg-[#1a1a1a] h-9 text-xs border-zinc-200 dark:border-white/10"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">End Date</Label>
                    <Input 
                      type="date"
                      value={tier.endDate}
                      onChange={(e) => updateTier(configIndex, tierIndex, 'endDate', e.target.value)}
                      className="bg-zinc-50 dark:bg-[#1a1a1a] h-9 text-xs border-zinc-200 dark:border-white/10"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Price (Rp)</Label>
                    <Input 
                      type="text"
                      placeholder="Rp..."
                      value={tier.price > 0 ? tier.price.toLocaleString('id-ID') : ""}
                      onChange={(e) => {
                        const numericString = e.target.value.replace(/\D/g, "");
                        const val = numericString ? parseInt(numericString, 10) : 0;
                        updateTier(configIndex, tierIndex, 'price', val);
                      }}
                      className="bg-zinc-50 dark:bg-[#1a1a1a] h-9 text-xs border-zinc-200 dark:border-white/10 text-[#00e599] font-bold"
                    />
                  </div>

                  {config.tiers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTier(configIndex, tierIndex)}
                      className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
