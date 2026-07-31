"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Country, State, City } from "country-state-city";
import { MapPin } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function LocationInput({ value, onChange, className }: LocationInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sync prop value to local input value on initial load or external change
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Update parent when inputValue changes
  useEffect(() => {
    if (inputValue !== value) {
      onChange(inputValue);
    }
  }, [inputValue]);

  const parts = useMemo(() => {
    // We don't want to trim end because trailing spaces matter for typing, 
    // but we can trim the parts for searching.
    return inputValue.split(",").map(p => p.trimStart());
  }, [inputValue]);

  const step = useMemo(() => {
    if (parts.length === 1) return 0; // Country
    if (parts.length === 2) return 1; // State
    if (parts.length === 3) return 2; // City
    return 3; // Done or Postal Code
  }, [parts]);

  const countryIso = useMemo(() => {
    if (step >= 1) {
      const cName = parts[0].trim();
      const c = Country.getAllCountries().find(x => x.name.toLowerCase() === cName.toLowerCase() || x.isoCode.toLowerCase() === cName.toLowerCase());
      return c ? c.isoCode : "";
    }
    return "";
  }, [step, parts]);

  const stateIso = useMemo(() => {
    if (step >= 2 && countryIso) {
      const sName = parts[1].trim();
      const s = State.getStatesOfCountry(countryIso).find(x => x.name.toLowerCase() === sName.toLowerCase() || x.isoCode.toLowerCase() === sName.toLowerCase());
      return s ? s.isoCode : "";
    }
    return "";
  }, [step, parts, countryIso]);

  // Options generation
  const options = useMemo(() => {
    let list: { value: string, label: string }[] = [];
    let query = "";

    if (step === 0) {
      list = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
      query = parts[0];
    } else if (step === 1) {
      if (countryIso) {
        list = State.getStatesOfCountry(countryIso).map(s => ({ value: s.isoCode, label: s.name }));
        if (list.length === 0) {
           // No states for this country, skip to city
        }
      }
      query = parts[1];
    } else if (step === 2) {
      if (countryIso && stateIso) {
        list = City.getCitiesOfState(countryIso, stateIso).map(city => ({ value: city.name, label: city.name }));
      }
      query = parts[2];
    }

    if (query) {
      const lower = query.trim().toLowerCase();
      list = list.filter(item => item.label.toLowerCase().includes(lower));
      
      list.sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(lower) ? -1 : 1;
        const bStarts = b.label.toLowerCase().startsWith(lower) ? -1 : 1;
        return aStarts - bStarts;
      });
    }

    return list.slice(0, 100);
  }, [step, parts, countryIso, stateIso]);

  // Removed auto-skipping useEffect that caused infinite loop

  // Fetch postal code when city is selected
  const lastCityFetch = useRef("");
  useEffect(() => {
    if (parts.length >= 3) {
      const cName = parts[0].trim();
      const sName = parts[1].trim();
      const cityName = parts[2].trim();

      // Only fetch if we just formed exactly 3 parts without trailing commas (meaning city was just selected)
      // or if we are at step 3 but without postal code yet.
      if (cityName && cName && parts.length === 3) {
         // wait for user to select from dropdown, not just typing
      }
      
      // We will trigger the fetch inside handleSelect instead to be more precise, 
      // but if we want to catch external changes, we can do it here.
    }
  }, [parts]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPostalCode = (cName: string, sName: string, cityName: string) => {
      const query = `${cityName}, ${sName}, ${cName}`;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=1`, {
         headers: { 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' }
      })
      .then(res => res.json())
      .then(data => {
        let code = "";
        if (data && data[0] && data[0].address && data[0].address.postcode) {
          code = data[0].address.postcode;
        }
        
        setInputValue(prev => {
           const p = prev.split(",");
           if (p.length === 3 || p.length === 4) {
              return `${p[0].trim()}, ${p[1].trim()}, ${p[2].trim()}${code ? `, ${code}` : ", "}`;
           }
           return prev;
        });
      })
      .catch(() => {
         setInputValue(prev => {
           const p = prev.split(",");
           if (p.length === 3 || p.length === 4) {
              return `${p[0].trim()}, ${p[1].trim()}, ${p[2].trim()}, `;
           }
           return prev;
        });
      });
  };

  const handleSelect = (item: { value: string, label: string }) => {
    if (step === 0) {
      const states = State.getStatesOfCountry(item.value);
      if (states.length === 0) {
        setInputValue(`${item.label}, , `);
      } else {
        setInputValue(`${item.label}, `);
      }
      setIsOpen(true);
    } else if (step === 1) {
      setInputValue(`${parts[0].trim()}, ${item.label}, `);
      setIsOpen(true);
    } else if (step === 2) {
      const cName = parts[0].trim();
      let sName = parts[1].trim();
      const newCity = item.label;
      
      setInputValue(`${cName}, ${sName}, ${newCity}`);
      setIsOpen(false);
      inputRef.current?.blur();
      
      // Fetch postal code
      fetchPostalCode(cName, sName, newCity);
    }
    setActiveIndex(-1);
    
    if (step < 2) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || options.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) {
        handleSelect(options[activeIndex]);
      } else if (options.length > 0) {
        handleSelect(options[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  let placeholder = "Ketik Negara, Provinsi, Kota...";
  if (step === 0) placeholder = "Ketik nama negara...";
  if (step === 1) placeholder = "Ketik nama provinsi/state...";
  if (step === 2) placeholder = "Ketik nama kota...";

  return (
    <div className={`relative w-full ${className || ''}`} ref={wrapperRef}>
      <div 
        className="flex items-center gap-1.5 p-2 min-h-10 w-full rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121212] focus-within:ring-2 focus-within:ring-[#00e599] transition-shadow cursor-text"
        onClick={() => {
           setIsOpen(true);
           inputRef.current?.focus();
        }}
      >
        <MapPin className="h-4 w-4 ml-1 text-zinc-500 shrink-0" />
        
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && step < 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {options.length > 0 ? options.map((option, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`px-4 py-2 cursor-pointer text-sm transition-colors ${
                  isActive 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {option.label}
              </div>
            );
          }) : (
            <div className="px-4 py-3 text-sm text-zinc-500 text-center">
              Tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}
