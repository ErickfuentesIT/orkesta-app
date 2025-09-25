import { useMemo } from "react";

export default function StaggerButton({
  id,
  text = "Label",
  delay = 50,
  className = "",
  onChange,
}) {
  function handleSearch(e) {
    onChange(e.target.value);
  }
  const chars = useMemo(() => Array.from(text), [text]);
  return (
    <div className={`form-control ${className}`}>
      <input
        id={id}
        type="text"
        required
        placeholder=" "
        autoComplete="off"
        onChange={handleSearch}
      />

      <label htmlFor={id} style={{ "--delay": `${delay}ms` }}>
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            style={{
              transitionDelay: `calc(var(--i) * var(--delay))`,
              "--i": i,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </label>
    </div>
  );
}
