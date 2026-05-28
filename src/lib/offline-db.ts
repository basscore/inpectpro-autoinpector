// =========================================================
// InpectPro — Offline IndexedDB & Synchronization Utilities
// =========================================================

import type { Order } from "./types";

const DB_NAME = "InspectProOffline";
const DB_VERSION = 1;

export interface QueuedUpdate {
  orderId: string;
  status?: string;
  vehicle?: any;
  checklist?: Array<{
    id: string; // item_id
    status: string;
    severity?: string | null;
    notes?: string | null;
    photos?: string[];
  }>;
  summaryNotes?: string;
  timestamp: number;
}

// Inisialisasi Database
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("IndexedDB is only available in the browser.");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB load error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Object Store untuk menyimpan daftar order inspeksi yang ditugaskan (caching)
      if (!db.objectStoreNames.contains("orders")) {
        db.createObjectStore("orders", { keyPath: "id" });
      }

      // Object Store untuk antrean sinkronisasi pembaruan checklist / status offline
      if (!db.objectStoreNames.contains("checklist_updates")) {
        db.createObjectStore("checklist_updates", { keyPath: "orderId" });
      }
    };
  });
}

// --- Operasi Caching Orders ---

// Menyimpan daftar order ke IndexedDB
export async function saveOfflineOrders(orders: Order[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("orders", "readwrite");
    const store = transaction.objectStore("orders");

    // Bersihkan data lama agar sinkron
    store.clear();

    orders.forEach((order) => {
      store.put(order);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Mendapatkan semua order dari cache IndexedDB
export async function getOfflineOrders(): Promise<Order[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("orders", "readonly");
    const store = transaction.objectStore("orders");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

// Menyimpan detail satu order lengkap ke IndexedDB (termasuk template/checklist)
export async function saveOfflineOrderDetail(orderId: string, orderData: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("orders", "readwrite");
    const store = transaction.objectStore("orders");
    store.put(orderData);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Mengambil detail satu order dari cache IndexedDB
export async function getOfflineOrderDetail(orderId: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("orders", "readonly");
    const store = transaction.objectStore("orders");
    const request = store.get(orderId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

// --- Operasi Antrean Sinkronisasi (Queue) ---

// Menambahkan atau memperbarui antrean update offline
export async function queueOfflineUpdate(
  orderId: string,
  update: Partial<Omit<QueuedUpdate, "orderId" | "timestamp">>
): Promise<void> {
  const db = await initDB();
  
  // Baca jika ada antrean sebelumnya agar bisa dimerge
  const existingUpdate = await new Promise<QueuedUpdate | null>((resolve, reject) => {
    const transaction = db.transaction("checklist_updates", "readonly");
    const store = transaction.objectStore("checklist_updates");
    const request = store.get(orderId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("checklist_updates", "readwrite");
    const store = transaction.objectStore("checklist_updates");

    let mergedChecklist = existingUpdate?.checklist || [];
    if (update.checklist) {
      // Merge checklist update berdasarkan item_id
      const updateMap = new Map(update.checklist.map((item) => [item.id, item]));
      
      // Update item lama
      mergedChecklist = mergedChecklist.map((item) => {
        if (updateMap.has(item.id)) {
          const newItem = updateMap.get(item.id)!;
          updateMap.delete(item.id);
          return { ...item, ...newItem };
        }
        return item;
      });

      // Tambahkan item baru
      mergedChecklist.push(...Array.from(updateMap.values()));
    }

    const mergedVehicle = update.vehicle 
      ? { ...(existingUpdate?.vehicle || {}), ...update.vehicle }
      : existingUpdate?.vehicle;

    const queuedObj: QueuedUpdate = {
      orderId,
      status: update.status || existingUpdate?.status,
      vehicle: mergedVehicle,
      checklist: mergedChecklist,
      summaryNotes: update.summaryNotes !== undefined ? update.summaryNotes : existingUpdate?.summaryNotes,
      timestamp: Date.now(),
    };

    store.put(queuedObj);

    transaction.oncomplete = () => {
      console.log(`[Offline Sync] Menambahkan update ke antrean offline untuk order: ${orderId}`, queuedObj);
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Mendapatkan seluruh antrean update offline
export async function getQueuedUpdates(): Promise<QueuedUpdate[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("checklist_updates", "readonly");
    const store = transaction.objectStore("checklist_updates");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

// Menghapus item dari antrean (setelah sukses disinkronkan ke server)
export async function removeQueuedUpdate(orderId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("checklist_updates", "readwrite");
    const store = transaction.objectStore("checklist_updates");
    store.delete(orderId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Sinkronkan seluruh antrean ke server API Supabase
export async function syncOfflineData(): Promise<{ successCount: number; failedCount: number }> {
  let successCount = 0;
  let failedCount = 0;

  try {
    const updates = await getQueuedUpdates();
    if (updates.length === 0) {
      return { successCount, failedCount };
    }

    for (const update of updates) {
      try {
        // Kirim update ke endpoint PUT /api/admin/orders/[id]
        const res = await fetch(`/api/admin/orders/${update.orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: update.status,
            vehicle: update.vehicle,
            checklist: update.checklist,
          }),
        });

        if (res.ok) {
          // Jika statusnya pending_review, kirim juga review submit
          if (update.status === "pending_review") {
            await fetch(`/api/admin/orders/${update.orderId}/review`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "pending_review",
                notes: update.summaryNotes || "",
              }),
            });
          }

          await removeQueuedUpdate(update.orderId);
          successCount++;
          console.log(`[Offline Sync] Sinkronisasi sukses untuk order: ${update.orderId}`);
        } else {
          failedCount++;
          console.error(`[Offline Sync] Gagal sinkronisasi order: ${update.orderId}. Status: ${res.status}`);
        }
      } catch (err) {
        failedCount++;
        console.error(`[Offline Sync] Error jaringan saat sinkronisasi order: ${update.orderId}`, err);
      }
    }
  } catch (dbError) {
    console.error("[Offline Sync] Error membaca IndexedDB:", dbError);
  }

  return { successCount, failedCount };
}
