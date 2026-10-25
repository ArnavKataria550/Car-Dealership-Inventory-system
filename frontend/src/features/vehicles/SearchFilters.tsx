import { CATEGORIES, CATEGORY_LABELS } from '../../api/vehicles';
import { TextField } from '../../components/ui/TextField';
import type { FilterField, FilterValues } from './useInventoryFilters';

interface SearchFiltersProps {
  values: FilterValues;
  errors: Partial<Record<'minPrice' | 'maxPrice', string>>;
  isFiltering: boolean;
  onChange: (field: FilterField, value: string) => void;
  onClear: () => void;
}

/** Search panel: make/model text, price range in dollars and category chips. */
export function SearchFilters({
  values,
  errors,
  isFiltering,
  onChange,
  onClear,
}: SearchFiltersProps) {
  const field = (name: FilterField) => ({
    value: values[name],
    onChange: (event: { target: { value: string } }) => onChange(name, event.target.value),
  });

  return (
    <div
      role="search"
      aria-label="Search vehicles"
      className="block rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Make" placeholder="e.g. Toyota" autoComplete="off" {...field('make')} />
        <TextField label="Model" placeholder="e.g. Camry" autoComplete="off" {...field('model')} />
        <TextField
          label="Min price"
          placeholder="Any"
          inputMode="decimal"
          error={errors.minPrice}
          {...field('minPrice')}
        />
        <TextField
          label="Max price"
          placeholder="Any"
          inputMode="decimal"
          error={errors.maxPrice}
          {...field('maxPrice')}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <CategoryChip selected={values.category === ''} onClick={() => onChange('category', '')}>
          All
        </CategoryChip>
        {CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            selected={values.category === category}
            onClick={() => onChange('category', category)}
          >
            {CATEGORY_LABELS[category]}
          </CategoryChip>
        ))}

        {isFiltering && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 underline-offset-4 transition hover:text-ink-950 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition duration-200 ${
        selected
          ? 'bg-ink-950 text-paper shadow-sm'
          : 'bg-stone-100 text-ink-800 hover:-translate-y-px hover:bg-stone-200'
      }`}
    >
      {children}
    </button>
  );
}
