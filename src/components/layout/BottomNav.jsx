import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";

export const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = [
    ["/", "layout-grid", "Özet", "overview"],
    ["/expenses", "receipt", "Ödemeler", "payments"],
    ["/incomes", "arrow-up-right", "Gelir", "income"],
    ["/subscriptions", "repeat", "Abonelik", "subscriptions"],
    ["/banks", "landmark", "Bankalar", "banks"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Ana gezinme">
      {links.map(([path, icon, label, tone]) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          aria-current={pathname === path ? "page" : undefined}
          className={`tone-${tone} ${pathname === path ? "active" : ""}`}
        >
          <Icon name={icon} size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};
