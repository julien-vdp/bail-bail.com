"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface AddressFeature {
  properties: {
    label: string;
    city: string;
    postcode: string;
  };
}

export function AddressAutocomplete({ 
  defaultValue = "", 
  name = "shortAddress" 
}: { 
  defaultValue?: string;
  name?: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<AddressFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3 || query === defaultValue) {
      setResults([]);
      return;
    }

    const fetchAddresses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data.features || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching addresses", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceId = setTimeout(fetchAddresses, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  const handleSelect = (label: string) => {
    setQuery(label);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input 
        type="hidden" 
        name={name} 
        value={query} 
      />
      <div className="relative">
        <Input
          type="text"
          placeholder="Ex: 12 rue de la paix, Paris"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          required
          className="pl-9"
          autoComplete="off"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((feature, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-3"
              onClick={() => handleSelect(feature.properties.label)}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-slate-800">{feature.properties.label}</div>
                <div className="text-xs text-slate-500">{feature.properties.postcode} {feature.properties.city}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
