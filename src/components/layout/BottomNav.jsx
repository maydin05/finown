import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";

export const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = [
    ["/", "layout-grid", "Özet"],
    ["/expenses", "receipt", "Ödemeler"],
    ["/incomes", "arrow-up-right", "Gelir"],
    ["/subscriptions", "repeat", "Abonelik"],
    ["/banks", "landmark", "Bankalar"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Ana gezinme">
      {links.map(([path, icon, label]) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          aria-current={pathname === path ? "page" : undefined}
          className={pathname === path ? "active" : ""}
        >
          <Icon name={icon} size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};
