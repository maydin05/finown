import React, { useState } from "react";
import { ActionDialog } from "../components/ui/ActionDialog";
import { Icon } from "../components/ui/Icon";
import { formatMoneyTR } from "../utils";

export const DeleteConfirmModal = ({
  deletingItem,
  onClose,
  onConfirm,
  onSoftDelete,
  onReactivate,
}) => {
  const [deleteMode, setDeleteMode] = useState(null);
  const isBank = deletingItem?.type === "bank";
  const isSubscription = deletingItem?.type === "subscription";
  const isArchived = isSubscription && deletingItem?.data?.isArchived;
  const title =
    deletingItem?.data?.title || deletingItem?.data?.name || "Bu kayıt";
  const meta = deletingItem?.meta || {};
  const cancel = { label: "Vazgeç", cancel: true, onClick: onClose };
  const back = { label: "Geri", onClick: () => setDeleteMode(null) };
  const item = (
    <div className="confirmation-record">
      <p>Seçili kayıt</p>
      <h3>{title}</h3>
      {isSubscription && deletingItem?.data?.amount != null && (
        <p>Aylık ₺{formatMoneyTR(deletingItem.data.amount)}</p>
      )}
    </div>
  );
  if (isArchived)
    return (
      <ActionDialog
        title="Arşivlenmiş Abonelik"
        subtitle="Kaydın şu anda arşivde"
        tone="confirm"
        icon="archive-restore"
        actions={[
          cancel,
          { label: "Tekrar Aktif Et", primary: true, onClick: onReactivate },
          {
            label: "Kalıcı Olarak Sil",
            danger: true,
            fullWidth: true,
            onClick: onConfirm,
          },
        ]}
      >
        {item}
        <p className="confirmation-copy">
          Aboneliği tekrar takibe alabilir veya geçmişiyle birlikte
          silebilirsin.
        </p>
        <p className="confirmation-warning">
          <Icon name="alert-triangle" size={17} />
          <span>
            Kalıcı silme, tüm geçmiş ödeme kayıtlarını da siler ve geri
            alınamaz.
          </span>
        </p>
      </ActionDialog>
    );
  if (isSubscription && deleteMode === null)
    return (
      <ActionDialog
        key="choose"
        title="Abonelik Silme"
        subtitle="Bu kayıt için bir işlem seç"
        tone="danger"
        icon="trash-2"
        actions={[cancel]}
      >
        {item}
        <div className="delete-options">
          <button
            className="delete-option archive-option"
            onClick={() => setDeleteMode("soft")}
          >
            <span className="option-icon">
              <Icon name="archive" size={21} />
            </span>
            <span>
              <strong>
                Arşivle <small>Önerilen</small>
              </strong>
              <span>
                Geçmiş ödemeler korunur. İstediğinde tekrar aktif edebilirsin.
              </span>
            </span>
            <Icon name="chevron-right" size={17} />
          </button>
          <button
            className="delete-option remove-option"
            onClick={() => setDeleteMode("hard")}
          >
            <span className="option-icon">
              <Icon name="trash-2" size={21} />
            </span>
            <span>
              <strong>Kalıcı Olarak Sil</strong>
              <span>
                Abonelik ve tüm geçmiş ödemeleri silinir. Geri alınamaz.
              </span>
            </span>
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      </ActionDialog>
    );
  if (isSubscription && deleteMode === "soft")
    return (
      <ActionDialog
        key="archive"
        title="Arşivleme Onayı"
        subtitle="Geçmiş kayıtların korunacak"
        tone="confirm"
        icon="archive"
        actions={[
          cancel,
          back,
          { label: "Arşivle", primary: true, onClick: onSoftDelete },
        ]}
      >
        {item}
        <div className="confirmation-benefits">
          <p>Bu abonelik arşivlendiğinde:</p>
          <ul>
            <li>
              <Icon name="check" size={16} />
              Geçmiş ödeme kayıtları korunur.
            </li>
            <li>
              <Icon name="check" size={16} />
              Aylık toplam tutardan düşülür.
            </li>
            <li>
              <Icon name="check" size={16} />
              İstediğinde tekrar aktif edebilirsin.
            </li>
          </ul>
        </div>
      </ActionDialog>
    );
  if (isSubscription && deleteMode === "hard")
    return (
      <ActionDialog
        key="permanent"
        title="Kalıcı Silme Onayı"
        subtitle="Bu işlem geri alınamaz"
        tone="danger"
        icon="trash-2"
        actions={[
          cancel,
          back,
          {
            label: "Kalıcı Sil",
            primary: true,
            danger: true,
            onClick: onConfirm,
          },
        ]}
      >
        {item}
        <p className="confirmation-warning">
          <Icon name="alert-triangle" size={18} />
          <span>
            Abonelik ve tüm geçmiş ödeme kayıtları kalıcı olarak silinecek.
          </span>
        </p>
      </ActionDialog>
    );
  return (
    <ActionDialog
      title="Silme Onayı"
      subtitle="Seçili kaydı silmek istiyor musun?"
      tone="danger"
      icon="trash-2"
      actions={[
        cancel,
        { label: "Sil", primary: true, danger: true, onClick: onConfirm },
      ]}
    >
      {item}
      {isBank ? (
        <div className="confirmation-impact">
          <p>Bu bankayla birlikte:</p>
          <ul>
            <li>
              <Icon name="credit-card" size={17} />
              <span>
                <b>{meta.productCount || 0}</b> bağlı kart/kredi silinecek.
              </span>
            </li>
            <li>
              <Icon name="receipt" size={17} />
              <span>
                <b>{meta.paymentsCount || 0}</b> ödeme satırı temizlenecek.
              </span>
            </li>
            <li>
              <Icon name="repeat" size={17} />
              <span>
                <b>{meta.subscriptionsCount || 0}</b> aboneliğin ödeme yöntemi
                manuel olacak.
              </span>
            </li>
          </ul>
        </div>
      ) : null}
      <p className="confirmation-warning">
        <Icon name="alert-triangle" size={17} />
        <span>Bu silme işlemi geri alınamaz.</span>
      </p>
    </ActionDialog>
  );
};
