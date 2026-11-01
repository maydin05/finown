import React from "react";
import { RecordRow } from "./RecordRow";
import { formatDateTR, formatMoneyTR } from "../../utils";

export const IncomeItem = ({
  item,
  onToggle,
  onEdit,
  onEditReceipt,
  onDelete,
  onOpenNote,
}) => (
  <RecordRow
    title={item.title}
    amount={item.amount}
    income
    icon="arrow-up-right"
    meta={formatDateTR(item.date)}
    status={item.isReceived ? "Alındı" : "Bekleniyor"}
    detail={
      <>
        <p>Planlanan: ₺{formatMoneyTR(item.expectedAmount ?? item.amount)}</p>
        {item.isReceived && <p>{item.actualAmount != null ? `Gerçek alınan: ₺${formatMoneyTR(item.actualAmount)}` : "Gerçek alınan tutar ayrıca kaydedilmedi; planlanan tutar gösteriliyor."}</p>}
        {item.receiptNote && <p>{item.receiptNote}</p>}
        {item.note && <p>{item.note}</p>}
        {item.hasAmbiguousStatus && <p>Eski tahsilat durumu doğrulanmalı.</p>}
      </>
    }
    actions={[
      {
        label: item.isReceived
          ? "Alındı işaretini geri al"
          : "Alındı olarak işaretle",
        onClick: () => onToggle(item),
        opensModal: !item.isReceived,
      },
      ...(item.isReceived ? [{ label: "Bu ay alınan tutarı düzenle", onClick: () => onEditReceipt(item), opensModal: true }] : []),
      { label: "Gelir planını düzenle", onClick: () => onEdit(item), opensModal: true },
      { label: "Notlarım", onClick: () => onOpenNote(item), opensModal: true },
      {
        label: "Sil",
        onClick: () => onDelete(item),
        opensModal: true,
        danger: true,
      },
    ]}
  />
);
