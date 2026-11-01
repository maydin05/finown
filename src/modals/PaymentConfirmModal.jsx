import React from "react";
import { ActionDialog } from "../components/ui/ActionDialog";
import { Icon } from "../components/ui/Icon";
import { formatMoneyTR, formatDateTR } from "../utils";

export const PaymentConfirmModal = ({
  payment,
  banks,
  products,
  onClose,
  onConfirm,
}) => {
  const product = products?.find((p) => p.id == payment?.productId);
  const bank = banks?.find((b) => b.id == product?.bankId);
  const itemDate = payment?.dueDate ? new Date(payment.dueDate) : new Date();
  const daysUntil = Math.ceil((itemDate - new Date()) / (1000 * 60 * 60 * 24));
  const isCard = payment?.type === "card" || product?.type === "card";
  const limit = product?.limit || 0;
  const amount = Number(payment?.amount) || 0;
  return (
    <ActionDialog
      title="Ödeme Onayı"
      subtitle="Ödemenin durumunu güncelle"
      tone="confirm"
      icon="check-circle"
      actions={[
        { label: "Vazgeç", cancel: true, onClick: onClose },
        {
          label: "Ödendi olarak kaydet",
          primary: true,
          onClick: () => onConfirm(payment),
        },
      ]}
    >
      <div className="confirm-amount">
        <span className="confirm-kicker">Ödendi olarak işaretlenecek</span>
        <h3>{payment?.title}</h3>
        {bank && <p>{bank.name}</p>}
        <strong>₺{formatMoneyTR(amount)}</strong>
      </div>
      <dl className="detail-list confirm-details">
        <div>
          <dt>Son Ödeme Tarihi</dt>
          <dd>{formatDateTR(itemDate)}</dd>
        </div>
        <div>
          <dt>Kalan Gün</dt>
          <dd
            className={
              daysUntil < 0
                ? "confirmation-overdue"
                : daysUntil <= 3
                  ? "confirmation-soon"
                  : ""
            }
          >
            {daysUntil < 0
              ? `${Math.abs(daysUntil)} gün gecikmiş`
              : daysUntil === 0
                ? "Bugün"
                : `${daysUntil} gün`}
          </dd>
        </div>
        {isCard && limit > 0 && (
          <>
            <div>
              <dt>Tanımlı Kart Limiti</dt>
              <dd>₺{formatMoneyTR(limit)}</dd>
            </div>
            <div>
              <dt>Ödemenin Limite Oranı</dt>
              <dd>%{Math.round((amount / limit) * 100)}</dd>
            </div>
          </>
        )}
        {payment?.subtitle && (
          <div>
            <dt>Açıklama</dt>
            <dd>{payment.subtitle}</dd>
          </div>
        )}
      </dl>
      <p className="confirmation-note">
        <Icon name="info" size={17} />
        <span>
          Bu işlem bankadan ödeme yapmaz; yalnızca ödeme durumunu kaydeder.
        </span>
      </p>
    </ActionDialog>
  );
};
