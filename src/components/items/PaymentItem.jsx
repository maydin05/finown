import React from "react";
import { RecordRow } from "./RecordRow";
import { formatDateTR, getDaysDifference } from "../../utils";

export const PaymentItem = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  onCardNeedAmount,
}) => {
  const diff = getDaysDifference(item.dueDate, new Date());
  const status = item.isPaid
    ? "Ödendi"
    : item.needsCardAmount
      ? "Ekstre bekleniyor"
      : diff < 0
        ? "Gecikmiş"
        : diff === 0
          ? "Bugün"
          : diff <= 3
            ? `${diff} gün kaldı`
            : null;
  return (
    <RecordRow
      title={item.title}
      amount={item.amount}
      meta={formatDateTR(item.dueDate)}
      icon={
        item.type === "card"
          ? "credit-card"
          : item.type === "loan"
            ? "landmark"
            : "receipt"
      }
      status={status}
      unknown={item.needsCardAmount}
      onEnterAmount={
        item.needsCardAmount
          ? () => (onCardNeedAmount || onEdit)?.(item)
          : undefined
      }
      detail={
        <>
          {item.note && <p>{item.note}</p>}
          {item.hasAmbiguousStatus && <p>Eski ödeme durumu doğrulanmalı.</p>}
        </>
      }
      actions={[
        {
          label: item.needsCardAmount
            ? "Ekstre tutarı gir"
            : item.isPaid
              ? "Ödendi işaretini geri al"
              : "Ödendi olarak işaretle",
          onClick: item.needsCardAmount
            ? onEdit
              ? () => onEdit(item)
              : null
            : onToggle
              ? () => onToggle(item)
              : null,
          opensModal:
            item.needsCardAmount ||
            (!item.isPaid && item.recordType === "payment"),
        },
        {
          label: "Düzenle",
          onClick: onEdit ? () => onEdit(item) : null,
          opensModal: true,
        },
        {
          label: "Sil",
          onClick: onDelete ? () => onDelete(item) : null,
          opensModal: true,
          danger: true,
        },
      ]}
    />
  );
};
