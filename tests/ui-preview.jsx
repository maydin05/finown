// Development-only component harness. All records below are synthetic; no login or API writes.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Overview from "../src/pages/Overview";
import Incomes from "../src/pages/Incomes";
import Subscriptions from "../src/pages/Subscriptions";
import Banks from "../src/pages/Banks";
import { Header } from "../src/components/layout/Header";
import { BottomNav } from "../src/components/layout/BottomNav";
import { BestCardsModal } from "../src/modals/BestCardsModal";
import { QuickMenu } from "../src/modals/QuickMenu";
import { legacyOwners } from "../src/domain/finance";
import { CashFlowPanel } from "../src/components/CashFlowSummary";
import Expenses from "../src/pages/Expenses";
import { DataContext } from "../src/context/store";
import { PaymentItem } from "../src/components/items/PaymentItem";
import { CardAmountModal } from "../src/modals/CardAmountModal";
import { paymentItemsForMonth } from "../src/domain/finance";
import "../src/index.css";

const products = [
  { id: 9001, type: "card", name: "Örnek kart", paymentDueDay: 5 },
];
export function Preview() {
  const [payments, setPayments] = useState([
    {
      id: 9002,
      type: "loan",
      title: "Örnek taksit",
      dueDate: "2026-11-01",
      amount: 1000,
      isPaid: false,
    },
  ]);
  const [target, setTarget] = useState(null);
  const [paymentTab, setPaymentTab] = useState("pending");
  const [viewDate, setViewDate] = useState(new Date(2026, 10, 1));
  const [lastAction, setLastAction] = useState("");
  const [incomeTab, setIncomeTab] = useState("expected");
  const [statusTracker, setStatusTracker] = useState({
    "expense_excluded:9008": true,
  });
  const [quickOpen, setQuickOpen] = useState(false);
  const [bestCards, setBestCards] = useState(null);
  const appMode = new URLSearchParams(window.location.search).has("app");
  const data = {
    banks: [
      { id: 1, name: "Örnek Banka", color: "from-green-600 to-green-800" },
    ],
    products: appMode
      ? [
          ...products.map((p) => ({
            ...p,
            bankId: 1,
            cardType: "physical",
            last4Digits: "1042",
            limit: 20000,
            cutoffDay: 25,
          })),
          {
            id: 9010,
            bankId: 1,
            type: "loan",
            name: "Örnek kredi",
            totalInstallments: 4,
            installmentAmount: 1000,
          },
        ]
      : products,
    payments: payments.map((p) =>
      p.type === "loan" ? { ...p, productId: 9010 } : p,
    ),
    expenseSources: appMode
      ? [
          {
            id: 9007,
            title: "Örnek kira",
            isDebt: true,
            endDate: "2027-01-04",
            amount: 2500,
            type: "recurring",
            startDate: "2026-01-04",
            dayOfMonth: 4,
          },
          {
            id: 9008,
            title: "Karttan takip edilen örnek gider",
            type: "market",
            amount: 100,
          },
        ]
      : [],
    statusTracker,
    subscriptionPayments: [],
    toggleTracker: async (key, current) =>
      setStatusTracker((previous) => ({ ...previous, [key]: !current })),
    editPayment: async (id, updates) =>
      setPayments((previous) =>
        previous.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      ),
    toggleSubscriptionPaid: async () => {},
    incomeSources: [
      {
        id: 9003,
        title: "Örnek gelir",
        type: "recurring",
        startDate: "2026-01-03",
        dayOfMonth: 3,
        amount: 15000,
      },
    ],
    subscriptionSources: [
      {
        id: 9004,
        title: "Örnek kart aboneliği",
        type: "recurring",
        startDate: "2026-01-02",
        dayOfMonth: 2,
        amount: 500,
        relatedCardId: 9001,
      },
    ],
  };
  data.trackerOwners = legacyOwners(data);
  const card = paymentItemsForMonth(
    payments,
    products,
    new Date(2026, 10, 1),
  ).find((item) => item.type === "card");
  const fullPage = new URLSearchParams(window.location.search).has("full");
  const openModal = (type, item) => {
    setLastAction(type);
    if (type === "card_amount") setTarget(item);
    if (type === "best_cards") setBestCards(item);
  };
  const saveAmount = (amount, dueDate) => {
    setPayments((previous) =>
      target.isVirtual
        ? [
            ...previous,
            {
              id: 9005,
              title: target.title,
              productId: target.productId,
              type: "card",
              amount: Number(amount),
              dueDate,
              isPaid: false,
            },
          ]
        : previous.map((payment) =>
            payment.id === target.id
              ? { ...payment, amount: Number(amount), dueDate }
              : payment,
          ),
    );
    setTarget(null);
  };
  if (appMode)
    return (
      <MemoryRouter>
        <DataContext.Provider value={data}>
          <div className="app-shell">
            <p className="text-xs text-center muted p-2">
              Yalnız örnek veriler · tasarım kontrolü
            </p>
            <Header
              onOpenQuickMenu={() => setQuickOpen(true)}
              onSignOut={() => setLastAction("sign_out")}
            />
            <output className="sr-only" data-testid="last-action">
              {lastAction}
            </output>
            <div className="app-content">
              <Routes>
                <Route
                  path="/"
                  element={<Overview onOpenModal={openModal} />}
                />
                <Route
                  path="/expenses"
                  element={
                    <Expenses
                      viewDate={viewDate}
                      onThisMonth={() => setViewDate(new Date())}
                      prevMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      nextMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      onOpenModal={openModal}
                      paymentTab={paymentTab}
                      setPaymentTab={setPaymentTab}
                    />
                  }
                />
                <Route
                  path="/incomes"
                  element={
                    <Incomes
                      viewDate={viewDate}
                      onThisMonth={() => setViewDate(new Date())}
                      prevMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      nextMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      onOpenModal={openModal}
                      incomeTab={incomeTab}
                      setIncomeTab={setIncomeTab}
                    />
                  }
                />
                <Route
                  path="/subscriptions"
                  element={
                    <Subscriptions
                      viewDate={viewDate}
                      onThisMonth={() => setViewDate(new Date())}
                      prevMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      nextMonth={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      onOpenModal={openModal}
                    />
                  }
                />
                <Route
                  path="/banks"
                  element={<Banks onOpenModal={openModal} />}
                />
              </Routes>
            </div>
            <BottomNav />
            {quickOpen && (
              <QuickMenu
                onClose={() => setQuickOpen(false)}
                onAction={(type) => {
                  setQuickOpen(false);
                  setLastAction(type);
                }}
              />
            )}
            {bestCards && (
              <BestCardsModal
                bestCards={bestCards}
                banks={data.banks}
                onClose={() => setBestCards(null)}
              />
            )}
            {target && (
              <CardAmountModal
                target={target}
                onClose={() => setTarget(null)}
                onSave={saveAmount}
              />
            )}
          </div>
        </DataContext.Provider>
      </MemoryRouter>
    );
  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen px-3 py-5">
      <p className="text-xs text-gray-500 mb-4">
        Geliştirme önizlemesi · yalnız örnek veriler
      </p>
      <output className="sr-only" data-testid="last-action">
        {lastAction}
      </output>
      {fullPage ? (
        <DataContext.Provider value={data}>
          <Expenses
            viewDate={viewDate}
            onThisMonth={() => setViewDate(new Date())}
            prevMonth={() =>
              setViewDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
              )
            }
            nextMonth={() =>
              setViewDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
              )
            }
            onOpenModal={openModal}
            paymentTab={paymentTab}
            setPaymentTab={setPaymentTab}
          />
        </DataContext.Provider>
      ) : (
        <>
          <CashFlowPanel
            data={data}
            today={new Date(2026, 9, 31)}
            onEnterStatement={setTarget}
          />
          <h2 className="font-bold my-4">Ekstre satırı</h2>
          <PaymentItem
            item={card}
            onEdit={setTarget}
            onCardNeedAmount={setTarget}
            onToggle={() => {}}
          />
        </>
      )}
      {target && (
        <CardAmountModal
          target={target}
          onClose={() => setTarget(null)}
          onSave={saveAmount}
        />
      )}{" "}
    </main>
  );
}
createRoot(document.getElementById("root")).render(<Preview />);
