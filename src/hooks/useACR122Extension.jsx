import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook per comunicare con il lettore NFC ACR122U tramite
 * l'estensione browser installata sul PC.
 *
 * L'estensione espone un WebSocket locale su ws://localhost:12345
 * e invia messaggi JSON nel formato:
 *   { type: "card", uid: "AABBCCDD" }   → tessera letta
 *   { type: "status", connected: true } → stato lettore
 *
 * Se la tua estensione usa una porta diversa, modifica EXTENSION_WS.
 */
const EXTENSION_WS = 'ws://localhost:12345';
const DEBOUNCE_MS = 2000;

export function useACR122Extension() {
  const [extConnected, setExtConnected] = useState(false);   // estensione raggiungibile
  const [readerReady, setReaderReady] = useState(false);     // ACR122U rilevato dall'estensione
  const [extStatus, setExtStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [lastUID, setLastUID] = useState(null);
  const [logs, setLogs] = useState([]);

  const wsRef = useRef(null);
  const cardCallbackRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const lastUIDRef = useRef('');
  const lastUIDTimeRef = useRef(0);

  const addLog = useCallback((msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('it-IT');
    setLogs(prev => [...prev.slice(-199), { ts, msg, type }]);
  }, []);

  /** Registra callback da chiamare quando arriva una tessera */
  const onCard = useCallback((fn) => {
    cardCallbackRef.current = fn;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (
      wsRef.current.readyState === WebSocket.OPEN ||
      wsRef.current.readyState === WebSocket.CONNECTING
    )) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    setExtStatus('connecting');
    const ws = new WebSocket(EXTENSION_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setExtConnected(true);
      setExtStatus('connected');
      addLog('Estensione ACR122U connessa', 'success');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Tessera letta
        if (msg.type === 'card' || msg.uid) {
          const uid = (msg.uid || msg.card_uid || '').toUpperCase().trim();
          if (!uid) return;

          // Debounce: ignora stessa tessera entro DEBOUNCE_MS
          const now = Date.now();
          if (uid === lastUIDRef.current && (now - lastUIDTimeRef.current) < DEBOUNCE_MS) return;
          lastUIDRef.current = uid;
          lastUIDTimeRef.current = now;

          setLastUID(uid);
          addLog(`Tessera: ${uid}`, 'success');
          if (cardCallbackRef.current) cardCallbackRef.current({ uid });
        }

        // Stato lettore
        else if (msg.type === 'reader_status' || msg.type === 'status') {
          const ready = msg.connected ?? msg.reader_connected ?? false;
          setReaderReady(ready);
          addLog(`ACR122U: ${ready ? 'rilevato' : 'non rilevato'}`, ready ? 'success' : 'error');
        }

        // Log generici dall'estensione
        else if (msg.type === 'log') {
          addLog(`[ext] ${msg.text}`, 'info');
        }

      } catch {
        // Messaggio non-JSON: alcuni plugin mandano l'UID grezzo come stringa
        const raw = event.data?.toString().trim().toUpperCase();
        if (/^[0-9A-F]{8,14}$/.test(raw)) {
          const now = Date.now();
          if (raw === lastUIDRef.current && (now - lastUIDTimeRef.current) < DEBOUNCE_MS) return;
          lastUIDRef.current = raw;
          lastUIDTimeRef.current = now;
          setLastUID(raw);
          addLog(`Tessera: ${raw}`, 'success');
          if (cardCallbackRef.current) cardCallbackRef.current({ uid: raw });
        }
      }
    };

    ws.onerror = () => {
      setExtStatus('error');
      setExtConnected(false);
      addLog(`Estensione non raggiungibile su ${EXTENSION_WS} — verifica che l'estensione NFC sia installata e attiva`, 'error');
    };

    ws.onclose = () => {
      setExtStatus('disconnected');
      setExtConnected(false);
      setReaderReady(false);
      // Riprova ogni 5 secondi
      reconnectTimerRef.current = setTimeout(() => connect(), 5000);
    };
  }, [addLog]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close();
  }, []);

  // Auto-connect al mount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return {
    extConnected,
    readerReady,
    extStatus,
    lastUID,
    logs,
    connect,
    disconnect,
    onCard,
  };
}