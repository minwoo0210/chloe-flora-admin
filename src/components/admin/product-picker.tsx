'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from '@/lib/api-client';
import type { ProductWithCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface ProductPickerProps {
  value: string | null;
  onChange: (productId: string, product: ProductWithCategory) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export function ProductPicker({
  value,
  onChange,
  excludeIds = [],
  placeholder = '选择商品',
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProductWithCategory | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiClient
      .get<{ items: ProductWithCategory[] }>('/admin/products?pageSize=50&status=active')
      .then((res) => setProducts(res.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (value && products.length > 0 && !selected) {
      setSelected(products.find((p) => p.id === value) ?? null);
    }
  }, [value, products, selected]);

  const candidates = products.filter((p) => !excludeIds.includes(p.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{selected.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {formatCurrency(selected.price)}
              </span>
            </span>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted" />
            <CommandInput placeholder="搜索在售商品…" className="border-0 focus-visible:ring-0" />
          </div>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
              </div>
            ) : (
              <>
                <CommandEmpty>未找到商品</CommandEmpty>
                <CommandGroup>
                  {candidates.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        setSelected(p);
                        onChange(p.id, p);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === p.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="ml-2 text-xs text-muted">
                        {p.categories?.name ?? ''} · {formatCurrency(p.price)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
