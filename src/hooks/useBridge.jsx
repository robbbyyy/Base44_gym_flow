import { useState, useEffect, useRef, useCallback } from 'react';

const BRIDGE_WS = 'ws://192.168.1.100:7878'; // ← IP del PC con il bridge

/**
 * Hook per comunicare con il bridge locale (gymflow_bridge.py).
 * - Lettore primario: ACR122U via USB (pyscard)
 * - Apertura tornello: Tibbo (TCP Ethernet)
 * Il bridge avvia automaticamente il lettore USB all'avvio.
 */
export function useBridge() {
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [readerConnected, setReaderConnected] = useState(false);
  const [readerName, setReaderName] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState('disconnected');
  const [lastCard, setLastCard] = useState(null);
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);
  const cardCallbackRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('it-IT');
    setLogs(prev => [...prev.slice(-299), { ts, msg, type }]);
  }, []);

  const onCard = useCallback((fn) => {
    cardCallbackRef.current = fn;
  }, []);

  const send = useCallback((cmd) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
      return true;
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }

    setBridgeStatus('connecting');
    const ws = new WebSocket(BRIDGE_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setBridgeConnected(true);
      setBridgeStatus('connected');
      addLog('Bridge GymFlow v4.0 connesso', 'success');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'card') {
          const card = { uid: msg.uid, raw: msg.raw, ts: new Date() };
          setLastCard(card);
          addLog(`Tessera letta: ${msg.uid}`, 'success');
          if (cardCallbackRef.current) cardCallbackRef.current(card);
        } else if (msg.type === 'reader_status') {
          setReaderConnected(msg.connected);
          if (msg.name) setReaderName(msg.name);
          addLog(`ACR122U: ${msg.connected ? `rilevato (${msg.name || 'USB'})` : 'non rilevato'}`, msg.connected ? 'success' : 'error');
        } else if (msg.type === 'turnstile_open') {
          addLog(`Tornello Tibbo: ${msg.success ? 'aperto ✓' : `errore — ${msg.error || '?'}`}`, msg.success ? 'success' : 'error');
        } else if (msg.type === 'log') {
          addLog(`[bridge] ${msg.text}`, 'info');
        }
      } catch {
        addLog(event.data, 'info');
      }
    };

    ws.onerror = () => {
      setBridgeStatus('error');
      setBridgeConnected(false);
      addLog('Bridge non raggiungibile su 192.168.1.100:7878 — avvia gymflow_bridge.py sul PC Tibbo', 'error');
    };

    ws.onclose = () => {
      setBridgeStatus('disconnected');
      setBridgeConnected(false);
      setReaderConnected(false);
      // Riprova ogni 5 secondi automaticamente
      reconnectTimerRef.current = setTimeout(() => connect(), 5000);
    };
  }, [addLog]);

  const openTurnstile = useCallback(() => {
    addLog('Apertura tornello...', 'info');
    return send({ cmd: 'open_turnstile' });
  }, [send, addLog]);

  // Auto-connect al mount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return {
    bridgeConnected,
    readerConnected,
    readerName,
    bridgeStatus,
    lastCard,
    logs,
    connect,
    openTurnstile,
    onCard,
    addLog,
  };
}