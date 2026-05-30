import { useState, useEffect, useRef, useCallback } from 'react';

// Vendor ID e Product ID per ACR122U
const ACR122_VENDOR_ID = 0x072f;
const ACR122_PRODUCT_ID = 0x2200;

// Comandi APDU
const CMD_GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00];

export function useACR122() {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastUID, setLastUID] = useState(null);
  const scanTimeoutRef = useRef(null);

  // Connetti al lettore ACR122U
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Verifica che WebUSB sia supportato
      if (!navigator.usb) {
        throw new Error('WebUSB non supportato da questo browser. Usa Chrome o Edge.');
      }
      
      // Richiedi accesso al dispositivo USB
      const selectedDevice = await navigator.usb.requestDevice({
        filters: [{ vendorId: ACR122_VENDOR_ID }]
      });

      // Apri la connessione
      try {
        await selectedDevice.open();
      } catch (openErr) {
        console.error('Errore open:', openErr);
        // Se "Access denied", il dispositivo potrebbe essere già aperto
        if (openErr.message?.includes('Access denied')) {
          throw new Error('Dispositivo già in uso. Chiudi altre schede/finestre che usano il lettore NFC.');
        }
        throw openErr;
      }
      
      // Seleziona la configurazione (di solito la prima)
      if (selectedDevice.configuration === null) {
        await selectedDevice.selectConfiguration(1);
      }

      // Claim dell'interfaccia (di solito interfaccia 0)
      try {
        await selectedDevice.claimInterface(0);
      } catch (claimErr) {
        console.error('Errore claimInterface:', claimErr);
        // Interfaccia già claimata da un altro processo
        try {
          // Prova a rilasciare e riprovare
          await selectedDevice.releaseInterface(0);
          await new Promise(resolve => setTimeout(resolve, 200));
          await selectedDevice.claimInterface(0);
        } catch (releaseErr) {
          console.error('Errore releaseInterface:', releaseErr);
          throw new Error('Interfaccia bloccata. Chiudi altre applicazioni che usano il lettore NFC (es. software del produttore).');
        }
      }

      setDevice(selectedDevice);
      setConnected(true);
      
      selectedDevice.addEventListener('disconnect', () => {
        setConnected(false);
        setDevice(null);
        setError('Dispositivo disconnesso');
      });

      return true;
    } catch (err) {
      console.error('Errore connessione ACR122U:', err);
      const errorMessage = err.message?.includes('Access denied') 
        ? 'Accesso negato. Chiudi altre finestre/ applicazioni che usano il lettore NFC.'
        : err.message?.includes('not found')
        ? 'Lettore NFC non trovato. Assicurati che sia collegato via USB.'
        : err.message || 'Errore di connessione al dispositivo USB';
      
      setError(errorMessage);
      setConnected(false);
      return false;
    }
  }, []);

  // Invia comando APDU al lettore
  const sendAPDU = useCallback(async (apdu) => {
    if (!device || !connected) {
      throw new Error('Lettore non connesso');
    }

    try {
      // ACR122U richiede un wrapper per i comandi APDU
      const endpointOut = device.configuration.interfaces[0].alternate.endpoints.find(e => e.direction === 'out');
      const endpointIn = device.configuration.interfaces[0].alternate.endpoints.find(e => e.direction === 'in');

      if (!endpointOut || !endpointIn) {
        throw new Error('Endpoint non trovati');
      }

      // Wrapper per comando APDU (ACR122U usa questo formato)
      const buffer = new Uint8Array([
        0xFF, 0x00, 0x00, 0x00, apdu.length, ...apdu, 0x00
      ]);

      // Invia il comando
      await device.transferOut(endpointOut.endpointNumber, buffer);

      // Attendi la risposta
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await device.transferIn(endpointIn.endpointNumber, 64);
      
      if (result.status === 'stall') {
        throw new Error('Errore nella comunicazione USB');
      }

      return new Uint8Array(result.data.buffer);
    } catch (err) {
      console.error('Errore invio APDU:', err);
      throw err;
    }
  }, [device, connected]);

  // Leggi UID del tag NFC
  const readUID = useCallback(async () => {
    if (!connected) {
      throw new Error('Lettore non connesso');
    }

    try {
      setScanning(true);
      setError(null);

      // Invia comando per ottenere UID
      const response = await sendAPDU(CMD_GET_UID);
      
      // Estrai UID dalla risposta (formato: [UID, SW1, SW2])
      // UID è tipicamente 4 o 7 byte
      const uidBytes = response.slice(0, -2); // Rimuovi status words
      const uid = Array.from(uidBytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');

      setLastUID(uid);
      setScanning(false);
      
      return uid;
    } catch (err) {
      console.error('Errore lettura UID:', err);
      setError(err.message);
      setScanning(false);
      throw err;
    }
  }, [connected, sendAPDU]);

  // Disconnetti il lettore
  const disconnect = useCallback(async () => {
    if (device) {
      try {
        await device.close();
      } catch (err) {
        console.error('Errore disconnessione:', err);
      }
    }
    setConnected(false);
    setDevice(null);
  }, [device]);

  // Polling continuo per lettura tag
  useEffect(() => {
    if (connected && !scanning) {
      const pollNFC = async () => {
        try {
          await readUID();
        } catch (err) {
          // Ignora errori di polling (nessun tag presente)
        }
      };

      scanTimeoutRef.current = setInterval(pollNFC, 1000);
      
      return () => {
        if (scanTimeoutRef.current) {
          clearInterval(scanTimeoutRef.current);
        }
      };
    }
  }, [connected, scanning, readUID]);

  return {
    connected,
    scanning,
    error,
    lastUID,
    connect,
    disconnect,
    readUID
  };
}