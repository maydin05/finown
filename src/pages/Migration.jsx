import React, { useState } from 'react';
import { bulkUpsert, createPaymentsBulk } from '../api/finown';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Migration() {
    const [jsonInput, setJsonInput] = useState("");
    const [status, setStatus] = useState("idle"); // idle, processing, success, error
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const { fetchData } = useData();

    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    const handleMigrate = async () => {
        try {
            setStatus("processing");
            setLogs(["Başlıyor... JSON parse ediliyor."]);

            let data;
            try {
                data = JSON.parse(jsonInput);
            } catch (e) {
                throw new Error("Geçersiz JSON formatı. Lütfen kopyaladığınız veriyi kontrol edin.");
            }

            addLog(`Veri bulundu: ${Object.keys(data).join(", ")}`);

            // --- Helper: Clean Fields ---
            const cleanItem = (item) => {
                const newItem = { ...item };

                // 1. Date Fields
                const dateFields = ['date', 'startDate', 'endDate', 'dueDate', 'firstPaymentDate'];
                dateFields.forEach(field => {
                    if (Object.prototype.hasOwnProperty.call(newItem, field)) {
                        const val = newItem[field];
                        // Empty string -> null
                        if (val === "" || val === null || val === undefined) {
                            newItem[field] = null;
                        }
                        // If it's a string, try to parse it
                        // If it's a string, try to parse it
                        else if (typeof val === 'string') {
                            // 1. Remove parenthetical text (e.g. timezone names) causing issues in some parsers
                            const cleanVal = val.replace(/\s*\(.*\)/, '');
                            const parsed = Date.parse(cleanVal);
                            const isDate = !isNaN(parsed);

                            if (isDate && val.length > 5) {
                                // Keep it! (Supabase can handle ISO strings, let's normalize to ISO to be safe)
                                newItem[field] = new Date(parsed).toISOString();
                            } else {
                                // Not a date. If it has text content, append to note.
                                if (val.length > 5 && !isDate) {
                                    newItem.note = (newItem.note ? newItem.note + " | " : "") + `${field}: ${val}`;
                                }
                                newItem[field] = null;
                            }
                        }
                    }
                });

                // 2. Numeric/ID Fields (Handle "" -> null)
                // These fields are BigInt or Numeric in DB, but might be "" string in JSON
                const numericFields = ['relatedCardId', 'bankId', 'productId', 'parentCardId', 'limit', 'cutoffDay', 'paymentDueDay', 'total', 'remaining', 'installment', 'totalInstallments', 'amount'];
                numericFields.forEach(field => {
                    if (Object.prototype.hasOwnProperty.call(newItem, field)) {
                        const val = newItem[field];
                        // If empty string, set to null (DB handle null or 0 default?)
                        // IDs should be null. Amounts usually 0 per legacy. 
                        // But if it came as "", legacy treated as 0.
                        // Let's stick to null for IDs, and 0 for amounts if needed?
                        // Supabase can handle "1" -> 1. But "" -> Error.
                        if (val === "") {
                            newItem[field] = null;
                        }
                    }
                });

                return newItem;
            };

            // 1. Banks
            if (data.banks?.length) {
                addLog(`Bankalar yükleniyor (${data.banks.length} adet)...`);
                await bulkUpsert('banks', data.banks);
            }

            // 2. Products
            if (data.products?.length) {
                addLog(`Ürünler yükleniyor (${data.products.length} adet)...`);
                const cleanedProducts = data.products.map(cleanItem);
                await bulkUpsert('products', cleanedProducts);
            }

            // 3. Sources
            if (data.incomeSources?.length) {
                addLog(`Gelir kaynakları yükleniyor (${data.incomeSources.length} adet)...`);
                const cleaned = data.incomeSources.map(cleanItem);
                await bulkUpsert('income_sources', cleaned);
            }
            if (data.expenseSources?.length) {
                addLog(`Gider kaynakları yükleniyor (${data.expenseSources.length} adet)...`);
                const cleaned = data.expenseSources.map(cleanItem);
                await bulkUpsert('expense_sources', cleaned);
            }
            if (data.subscriptionSources?.length) {
                addLog(`Abonelikler yükleniyor (${data.subscriptionSources.length} adet)...`);
                // Normalize legacy payment method if needed, but Code.gs export handles it?
                // Code.gs export returns flattened keys if we use my version?
                // Wait, legacy Code.gs _readTable_ UNFLATTENS it back to object:
                // obj.paymentMethod = { type: ..., value: ... }
                // Supabase expects FLATTENED keys: payment_method_type, payment_method_value
                // WE MUST FLATTEN IT HERE if the JSON has it as object.
                // Let's check logic below.
                const flattenedSubs = data.subscriptionSources.map(sub => {
                    const s = { ...sub };
                    if (s.paymentMethod) {
                        s.paymentMethodType = s.paymentMethod.type;
                        s.paymentMethodValue = s.paymentMethod.value;
                        delete s.paymentMethod;
                    }
                    return s;
                }).map(cleanItem);
                await bulkUpsert('subscription_sources', flattenedSubs);
            }

            // 4. Payments
            if (data.payments?.length) {
                addLog(`Ödemeler yükleniyor (${data.payments.length} adet)...`);
                // Payments have productId. Since products are inserted with IDs, this works.
                const cleanedPayments = data.payments.map(cleanItem);
                await bulkUpsert('payments', cleanedPayments);
            }

            // 5. Trackers
            const trackers = [];
            if (data.statusTracker) {
                Object.entries(data.statusTracker).forEach(([k, v]) => trackers.push({ key: k, value: v }));
            }
            if (data.subscriptionTracker) {
                Object.entries(data.subscriptionTracker).forEach(([k, v]) => trackers.push({ key: k, value: v }));
            }
            if (trackers.length) {
                addLog(`Tracker ayarları yükleniyor (${trackers.length} adet)...`);
                await bulkUpsert('trackers', trackers);
            }

            addLog("MİGRASYON BAŞARIYLA TAMAMLANDI! ✅");
            addLog("Veriler yeniden yükleniyor...");
            setStatus("success");

            // Reload data into app context
            await fetchData();
            addLog("Veriler yüklendi! Anasayfaya yönlendiriliyor...");

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error(error);
            addLog(`HATA: ${error.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="p-4 pb-24">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Veri Taşıma (Import)</h1>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 text-sm text-yellow-800">
                <p className="font-bold mb-2">Nasıl Yapılır?</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Eski Google E-Tablonuzu açın.</li>
                    <li><strong>Uzantılar &gt; Apps Script</strong> menüsüne gidin.</li>
                    <li>Soldaki dosyalar listesinden <code>Code.gs</code> dosyasını seçin.</li>
                    <li>İçeriğini silin ve size verilen "Export Script" kodunu yapıştırın.</li>
                    <li>Yukarıdan <code>exportJSON</code> fonksiyonunu seçip <strong>Çalıştır</strong>'a basın.</li>
                    <li>Günlük (Log) ekranında çıkan JSON verisini kopyalayın.</li>
                    <li>Aşağıdaki kutuya yapıştırın.</li>
                </ol>
            </div>

            <textarea
                className="w-full h-64 p-3 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder='{"banks": [...], "products": [...] }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
            />

            <button
                onClick={handleMigrate}
                disabled={status === 'processing' || !jsonInput}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${status === 'processing' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {status === 'processing' ? 'Yükleniyor...' : 'Verileri Başlat'}
            </button>

            {logs.length > 0 && (
                <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
        </div>
    );
}
