import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook per leggere tessere NFC dal lettore USB ACE122U A9
 * tramite WebHID API (nativa nei browser Chromium, nessuna estensione richiesta).
 *
 * Flusso:
 *  1. L'utente clicca "Connetti lettore" → si apre il selettore WebHID del browser
 *  2. Il lettore invia report HID quando avvicina una tessera
 *  3. L'UID viene estratto e passato al callback registrato con onCard()
 */

// Vendor ID e Product ID del ACE122U A9 (stesso chip ACR122U: VID 072F PID 2200)
const FILTERS = [
  { vendorId: 0x072F, productId: 0x2200 }, // ACR122U / ACE122U A9
  { vendorId: 0x072F, productId: 0x2201 },
  { vendorId: 0x072F },                    // fallback: qualsiasi ACS
];

const DEBOUNCE_MS = 2000;

export function useACE122U() {
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [readerName, setReaderName] = useState('');
  const [lastUID, setLastUID] = useState(null);
  const [supported, setSupported] = useState(false);

  const deviceRef = useRef(null);
  const cardCallbackRef = useRef(null);
  const lastUIDRef = useRef('');
  const lastUIDTimeRef = useRef(0);

  // Controlla se WebHID è supportato
  useEffect(() => {
    setSupported('hid' in navigator);
  }, []);

  const onCard = useCallback((fn) => {
    cardCallbackRef.current = fn;
  }, []);

  // Estrae UID dal report HID raw dell'ACR122U/ACE122U
  const parseUID = useCallback((data) => {
    // Il report tipico per card detect è 0xD5 0x4B (risposta TgInitAsTarget)
    // ma in modalità HID il reader manda: [len, ...uid bytes]
    // Layout report noto: byte[0]=eventCode, byte[1]=len, byte[2..n]=UID
    const bytes = new Uint8Array(data.buffer);

    // Formato standard ACR122U HID notification:
    // FF 00 00 00 05 D4 60 00 [uidLen] [uid bytes...]  — tramite APDU
    // In HID raw il frame è più semplice, proviamo entrambi

    // Cerca pattern D5 4B (risposta al InListPassiveTarget)
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === 0xD5 && bytes[i + 1] === 0x4B) {
        // bytes[i+2] = numero tag, bytes[i+3] = Tg, bytes[i+4] = ATQA[0], [5]=ATQA[1], [6]=SAK, [7]=uidLen
        if (i + 7 < bytes.length) {
          const uidLen = bytes[i + 7];
          if (uidLen >= 4 && uidLen <= 10 && i + 7 + uidLen < bytes.length) {
            const uid = Array.from(bytes.slice(i + 8, i + 8 + uidLen))
              .map(b => b.toString(16).padStart(2, '0').toUpperCase())
              .join('');
            return uid;
          }
        }
      }
    }

    // Fallback: cerca 4-7 byte consecutivi validi dopo byte[1] (len)
    if (bytes.length >= 6 && bytes[0] === 0x00) {
      const len = bytes[1];
      if (len >= 4 && len <= 7 && bytes.length >= 2 + len) {
        const uid = Array.from(bytes.slice(2, 2 + len))
          .map(b => b.toString(16).padStart(2, '0').toUpperCase())
          .join('');
        if (/^[0-9A-F]{8,14}$/.test(uid)) return uid;
      }
    }

    return null;
  }, []);

  const handleInputReport = useCallback((event) => {
    const uid = parseUID(event.data);
    if (!uid) return;

    const now = Date.now();
    if (uid === lastUIDRef.current && (now - lastUIDTimeRef.current) < DEBOUNCE_MS) return;
    lastUIDRef.current = uid;
    lastUIDTimeRef.current = now;

    setLastUID(uid);
    if (cardCallbackRef.current) cardCallbackRef.current({ uid });
  }, [parseUID]);

  const connect = useCallback(async () => {
    if (!('hid' in navigator)) {
      setStatus('error');
      return;
    }

    setStatus('connecting');

    try {
      // Prima prova dispositivi già autorizzati
      let devices = await navigator.hid.getDevices();
      let device = devices.find(d => FILTERS.some(f =>
        (!f.vendorId || d.vendorId === f.vendorId) &&
        (!f.productId || d.productId === f.productId)
      ));

      // Se non trovato, chiedi all'utente
      if (!device) {
        const requested = await navigator.hid.requestDevice({ filters: FILTERS });
        device = requested[0];
      }

      if (!device) {
        setStatus('disconnected');
        return;
      }

      deviceRef.current = device;
      setReaderName(device.productName || 'ACE122U A9');

      if (!device.opened) await device.open();

      device.addEventListener('inputreport', handleInputReport);

      // Invia APDU GetFirmwareVersion per confermare connessione
      try {
        await device.sendFeatureReport(0x00, new Uint8Array([0xFF, 0x00, 0x48, 0x00, 0x00]));
      } catch {
        // Non critico, alcuni modelli non rispondono a questo comando
      }

      setStatus('connected');
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setStatus('error');
      } else {
        setStatus('disconnected');
      }
    }
  }, [handleInputReport]);

  const disconnect = useCallback(async () => {
    const device = deviceRef.current;
    if (device) {
      device.removeEventListener('inputreport', handleInputReport);
      if (device.opened) await device.close().catch(() => {});
      deviceRef.current = null;
    }
    setStatus('disconnected');
    setReaderName('');
    setLastUID(null);
  }, [handleInputReport]);

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      const device = deviceRef.current;
      if (device) {
        device.removeEventListener('inputreport', handleInputReport);
        if (device.opened) device.close().catch(() => {});
      }
    };
  }, [handleInputReport]);

  return {
    status,
    readerName,
    lastUID,
    supported,
    isConnected: status === 'connected',
    connect,
    disconnect,
    onCard,
  };
}