import React from "react";
import { RecordRow } from "./RecordRow";
import { formatDateTR } from "../../utils";

export const IncomeItem = ({
  item,
  onToggle,
  onEdit,
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
      },
      { label: "Düzenle", onClick: () => onEdit(item), opensModal: true },
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
