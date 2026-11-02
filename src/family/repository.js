import { newFamily, transitionFamily } from './model.js';

// Explicitly local IndexedDB storage. Never connects to Supabase or writes finance tables.
export function localFamilyRepository(id, seed = () => newFamily(id)) {
  if (!import.meta.env.DEV) throw new Error('Aile modülünün yerel deposu yalnız geliştirmede kullanılabilir.');
  let connection;
  const open = () => connection ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('finown-family-local-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('budgets', { keyPath: 'id' });
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Yerel depo başka bir sekmede kilitli.'));
  });
  const transact = async (write, operation) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      // The read, version check, reservation assessment and write share ONE serialized transaction.
      const transaction = db.transaction('budgets', write ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('budgets');
      const request = store.get(id);
      let result, failure;
      request.onsuccess = () => {
        try {
          const before = request.result || seed();
          result = operation(before);
          if (write) store.put(result);
        } catch (error) { failure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(failure || transaction.error || new Error('Yerel işlem iptal edildi.'));
      transaction.onerror = () => { /* onabort reports the failure */ };
    });
  };
  let channel;
  return {
    load: () => transact(true, state => state),
    dispatch: async (actor, command, env, operationId = crypto.randomUUID()) => {
      const result = await transact(true, state => transitionFamily(state, actor, command, env, { id: operationId, at: new Date().toISOString() }));
      const publisher = channel || (typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`finown-family:${id}`) : null);
      publisher?.postMessage(result.version);
      if (publisher !== channel) publisher?.close();
      return result;
    },
    subscribe: listener => {
      channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`finown-family:${id}`) : null;
      if (channel) channel.onmessage = listener;
      return () => { channel?.close(); channel = null; };
    },
    close: () => { channel?.close(); connection?.then(db => db.close()); },
  };
}
