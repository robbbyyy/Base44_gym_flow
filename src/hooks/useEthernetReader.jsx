import { useState, useEffect, useCallback, useRef } from 'react';

export function useEthernetReader() {
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastUID, setLastUID] = useState(null);
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [port, setPort] = useState('8080');
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Connetti al lettore Ethernet
  const connect = useCallback(async (ip = ipAddress, pt = port) => {
    try {
      setError(null);
      setScanning(true);

      // Per lettori Ethernet, usiamo WebSocket o HTTP polling
      // Questo è un esempio generico - adatta in base al protocollo del tuo lettore
      const url = `ws://${ip}:${pt}`;
      
      socketRef.current = new WebSocket(url);
      
      socketRef.current.onopen = () => {
        console.log('Connesso al lettore Ethernet');
        setConnected(true);
        setScanning(false);
        setError(null);
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          // Il formato del messaggio dipende dal lettore
          // WebSocket event.data è già una stringa
          const data = event.data;
          
          // Estrai UID (adatta in base al formato del tuo lettore)
          let uid = data;
          try {
            const parsed = JSON.parse(data);
            uid = parsed.uid || parsed.card_id || parsed.data || data;
          } catch (e) {
            // Non è JSON, usa il testo diretto
            uid = typeof data === 'string' ? data.trim() : String(data);
          }
          
          if (uid && uid.length > 0) {
            setLastUID(uid);
          }
        } catch (err) {
          console.error('Errore parsing messaggio:', err);
        }
      };
      
      socketRef.current.onerror = (err) => {
        console.error('Errore WebSocket:', err);
        setError('Errore di connessione al lettore Ethernet');
        setScanning(false);
      };
      
      socketRef.current.onclose = () => {
        console.log('Disconnesso dal lettore Ethernet');
        setConnected(false);
        setScanning(false);
        
        // Tentativo di riconnessione automatica dopo 5 secondi
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
            connect(ip, pt);
          }
        }, 5000);
      };

      return true;
    } catch (err) {
      console.error('Errore connessione Ethernet:', err);
      setError(err.message || 'Impossibile connettersi al lettore Ethernet');
      setConnected(false);
      setScanning(false);
      return false;
    }
  }, [ipAddress, port]);

  // Metodo alternativo per lettori basati su HTTP polling
  const connectHTTP = useCallback(async (ip = ipAddress, pt = port) => {
    try {
      setError(null);
      setScanning(true);

      const baseUrl = `http://${ip}:${pt}`;
      
      // Polling ogni secondo per verificare nuove letture
      const pollReader = async () => {
        try {
          const response = await fetch(`${baseUrl}/status`);
          if (response.ok) {
            const data = await response.json();
            if (data.card_detected && data.uid) {
              setLastUID(data.uid);
            }
            setConnected(true);
            setScanning(false);
          }
        } catch (err) {
          console.error('Errore polling HTTP:', err);
          setConnected(false);
        }
      };

      // Primo poll immediato
      await pollReader();
      
      // Poll continuo ogni secondo
      pollIntervalRef.current = setInterval(pollReader, 1000);
      
      return true;
    } catch (err) {
      console.error('Errore connessione HTTP:', err);
      setError(err.message || 'Impossibile connettersi al lettore Ethernet');
      setConnected(false);
      setScanning(false);
      return false;
    }
  }, [ipAddress, port]);

  // Disconnetti il lettore
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    setConnected(false);
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    scanning,
    error,
    lastUID,
    ipAddress,
    setIpAddress,
    port,
    setPort,
    connect,
    connectHTTP,
    disconnect
  };
}