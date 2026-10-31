import React from "react";
import { RecordRow } from "./RecordRow";
import { formatDateTR, formatMoneyTR } from "../../utils";

export const SubscriptionItem = ({
  item,
  onOpenNote,
  onEdit,
  onDelete,
  onTogglePaid,
  onOpenPaymentEntry,
  banks = [],
  products = [],
}) => {
  const bankId = item.paymentMethod?.value || item.paymentMethodValue;
  const method = item.paymentMethod?.type || item.paymentMethodType;
  const bank = banks.find((value) => String(value.id) === String(bankId));
  const card = products.find(
    (value) => String(value.id) === String(item.relatedCardId),
  );
  const paymentDisplay =
    method === "bank"
      ? `${bank?.name || "Banka"}${card ? ` · ${card.name} · •• ${card.last4Digits || ""}` : ""}`
      : bankId || "Manuel";
  const amount = item.isPaid
    ? (item.actualAmount ?? item.expectedAmount ?? item.amount ?? 0)
    : (item.expectedAmount ?? item.amount ?? 0);
  return (
    <RecordRow
      title={item.title}
      amount={amount}
      icon="repeat"
      meta={formatDateTR(item.dueDate)}
      status={
        item.isArchived ? "Arşivlendi" : item.isPaid ? "Ödendi" : "Bekleniyor"
      }
      detail={
        <>
          <dl className="detail-list">
            <div>
              <dt>Ödeme yöntemi</dt>
              <dd>{paymentDisplay}</dd>
            </div>
            <div>
              <dt>Beklenen tutar</dt>
              <dd>₺{formatMoneyTR(item.expectedAmount ?? item.amount)}</dd>
            </div>
            {item.actualAmount != null && (
              <div>
                <dt>Kaydedilen tutar</dt>
                <dd>₺{formatMoneyTR(item.actualAmount)}</dd>
              </div>
            )}
          </dl>
          {item.note && <p>{item.note}</p>}
        </>
      }
      actions={[
        ...(!item.isArchived
          ? [
              {
                label: item.isPaid
                  ? "Ödendi işaretini geri al"
                  : item.isVariable
                    ? "Ödeme tutarı gir"
                    : "Ödendi olarak işaretle",
                onClick: () =>
                  item.isVariable && !item.isPaid
                    ? onOpenPaymentEntry(item)
                    : onTogglePaid(),
                opensModal: item.isVariable && !item.isPaid,
              },
              {
                label: "Ödeme kaydını düzenle",
                onClick: () => onOpenPaymentEntry(item),
                opensModal: true,
              },
            ]
          : []),
        {
          label: "Aboneliği düzenle",
          onClick: () => onEdit(item),
          opensModal: true,
        },
        {
          label: "Notlarım",
          onClick: () => onOpenNote(item),
          opensModal: true,
        },
        {
          label: item.isArchived ? "Arşiv işlemleri" : "Arşivle / sil",
          onClick: () => onDelete(item),
          opensModal: true,
          danger: !item.isArchived,
        },
      ]}
    />
  );
};
