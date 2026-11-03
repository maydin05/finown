import React from "react";
import { Icon } from "./Icon";
import { formatMoneyTR } from "../../utils";

export function MonthHeader({
  title,
  viewDate,
  prevMonth,
  nextMonth,
  onThisMonth,
  label,
  amount,
  secondary = [],
}) {
  const now = new Date();
  const showReset = Boolean(onThisMonth) && (viewDate.getFullYear() !== now.getFullYear() || viewDate.getMonth() !== now.getMonth());
  return (
    <>
      <div className={`page-title compact-month-heading${showReset ? " has-month-reset" : ""}`}>
        <h1>{title}</h1>
        {showReset && <button className="this-month-button" onClick={onThisMonth}>Bu aya dön</button>}
        <div className="month-selector">
          <button
            className="icon-button"
            onClick={prevMonth}
            aria-label="Önceki ay"
          >
            <Icon name="chevron-left" size={19} />
          </button>
          <div>
            <h2>{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
            <span>{viewDate.getFullYear()}</span>
          </div>
          <button
            className="icon-button"
            onClick={nextMonth}
            aria-label="Sonraki ay"
          >
            <Icon name="chevron-right" size={19} />
          </button>
        </div>
      </div>
      <section className="monthly-summary compact-month-summary" aria-label={`${title} aylık özeti`}>
        <p>{label}</p>
        <strong>₺{formatMoneyTR(amount)}</strong>
        {secondary.length > 0 && (
          <dl>
            {secondary.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>₺{formatMoneyTR(item.amount)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}

export function FilterTabs({ items, value, onChange }) {
  return (
    <div className="line-tabs page-tabs">
      {items.map((item) => (
        <button
          key={item.value}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count != null && (
            <span className="tab-count">{item.count}</span>
          )}
          {item.amount != null && (
            <span className="tab-amount">₺{formatMoneyTR(item.amount)}</span>
          )}
        </button>
      ))}
    </div>
  );
}
