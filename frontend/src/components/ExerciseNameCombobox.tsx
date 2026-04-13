import { suggestExercises } from "@/lib/exercise-library";
import { useId, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
};

export function ExerciseNameCombobox({
  value,
  onChange,
  placeholder,
  id: idProp,
}: Props) {
  const genId = useId();
  const id = idProp ?? genId;
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => suggestExercises(value), [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 180);
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className="focus-ring mt-3 w-full rounded-2xl border border-black/10 bg-surface px-3 py-3 text-base font-semibold text-ink placeholder:text-neutral-400"
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-2xl border border-black/10 bg-white py-1 shadow-lg"
        >
          {suggestions.map((ex) => (
            <li key={ex.name} role="presentation">
              <button
                type="button"
                role="option"
                className="focus-ring w-full px-3 py-2.5 text-left text-sm text-ink hover:bg-surface"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(ex.name);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{ex.name}</span>
                <span className="ml-2 text-xs text-neutral-500">{ex.group}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
