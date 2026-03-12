import { useState, useRef, useEffect, useCallback } from 'react';
import { insforge } from './insforge';

export type PeerState = 'disconnected' | 'connecting' | 'connected';

export function useWebRTC(portalCode: string, addLog: (m: string, t?: 'info'|'warn'|'success'|'alert') => void) {
  const [peerState, setPeerState] = useState<PeerState>('disconnected');
  const [transferProgress, setTransferProgress] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isInitiatorRef = useRef(false);

  // File Receiving State
  const receiveBufferRef = useRef<Uint8Array[]>([]);
  const receivedSizeRef = useRef(0);
  const expectingSizeRef = useRef(0);
  const receivedFileNameRef = useRef('unknown');
  
  // Cleanup
  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPeerState('disconnected');
    try {
      if (portalCode) {
        insforge.realtime.unsubscribe(`portal:${portalCode}`);
      }
    } catch (e) { console.error(e) }
  }, [portalCode]);

  // Create Peer Connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        insforge.realtime.publish(`portal:${portalCode}`, 'ice-candidate', { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setPeerState(pc.connectionState as PeerState);
      if (pc.connectionState === 'connected') {
        addLog('SECURE P2P DATACHANNEL ESTABLISHED. GATE OPEN.', 'success');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        addLog('P2P CONNECTION LOST. DIMENSIONAL RIFT CLOSED.', 'alert');
        cleanup();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [portalCode, addLog, cleanup]);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    
    channel.onopen = () => {
      addLog('ENCRYPTED WARD READY FOR PAYLOADS.', 'success');
    };
    
    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'file-start') {
          addLog(`INCOMING PAYLOAD: ${msg.fileName} (${Math.round(msg.size/1024/1024)}mb)`, 'info');
          expectingSizeRef.current = msg.size;
          receivedFileNameRef.current = msg.fileName;
          receivedSizeRef.current = 0;
          receiveBufferRef.current = [];
          setTransferProgress(0);
        } else if (msg.type === 'file-end') {
          addLog(`PAYLOAD RECEIVED. RECONSTRUCTING MATTER...`, 'warn');
          const blob = new Blob(receiveBufferRef.current);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = receivedFileNameRef.current;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          addLog('MATTER RECONSTRUCTED SUCCESSFULLY.', 'success');
          setTimeout(() => setTransferProgress(0), 2000);
        }
      } else {
        // Receiving chunk
        const chunk = new Uint8Array(event.data);
        receiveBufferRef.current.push(chunk);
        receivedSizeRef.current += chunk.length;
        
        const progress = Math.min(100, Math.round((receivedSizeRef.current / expectingSizeRef.current) * 100));
        setTransferProgress(progress);
      }
    };

    dataChannelRef.current = channel;
  }, [addLog]);

  // Connect & Sequence
  const connectToPortal = useCallback(async (isInitiating: boolean) => {
    isInitiatorRef.current = isInitiating;
    const channelName = `portal:${portalCode}`;
    
    addLog(`CONNECTING TO SECTOR REALTIME: ${channelName}`, 'info');
    
    await insforge.realtime.connect();
    const sub = await insforge.realtime.subscribe(channelName);
    if (!sub.ok) {
      addLog(`FAILED TO ENTER SECTOR: ${sub.error?.message}`, 'alert');
      return;
    }

    setPeerState('connecting');

    // Message Handling
    insforge.realtime.on('join', async () => {
      if (isInitiatorRef.current) {
        addLog('FOREIGN ENTITY DETECTED ON RADAR. INITIATING HANDSHAKE...', 'warn');
        const pc = createPeerConnection();
        const dc = pc.createDataChannel('upside-down-channel');
        setupDataChannel(dc);
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await insforge.realtime.publish(channelName, 'offer', { offer });
      }
    });

    insforge.realtime.on('offer', async (payload) => {
      if (!isInitiatorRef.current) {
        addLog('HANDSHAKE OFFER RECEIVED. PREPARING COUNTER-SPELL.', 'warn');
        const pc = createPeerConnection();
        
        pc.ondatachannel = (event) => {
          setupDataChannel(event.channel);
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await insforge.realtime.publish(channelName, 'answer', { answer });
      }
    });

    insforge.realtime.on('answer', async (payload) => {
      if (isInitiatorRef.current && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        addLog('COUNTER-SPELL ACCEPTED.', 'success');
      }
    });

    insforge.realtime.on('ice-candidate', async (payload) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    // Start sequence
    if (!isInitiating) {
      await insforge.realtime.publish(channelName, 'join', {});
    } else {
      addLog('OPENING PORTAL... WAITING FOR ENTITY TO JOIN.', 'info');
    }

  }, [portalCode, addLog, createPeerConnection, setupDataChannel]);

  const sendFile = useCallback(async (file: File) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      addLog('CANNOT SEND: ENCRYPTED WARD INACTIVE.', 'alert');
      return;
    }

    addLog(`INITIATING DATA TRANSLOCATION: ${file.name}`, 'warn');
    
    // Send metadata
    dataChannelRef.current.send(JSON.stringify({
      type: 'file-start',
      fileName: file.name,
      size: file.size,
      fileType: file.type
    }));

    const chunkSize = 16 * 1024; // 16kb chunks
    let offset = 0;

    const readSlice = (o: number) => {
      const slice = file.slice(offset, o + chunkSize);
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer && dataChannelRef.current?.readyState === 'open') {
          try {
            dataChannelRef.current.send(buffer);
            offset += buffer.byteLength;
            
            const progress = Math.min(100, Math.round((offset / file.size) * 100));
            setTransferProgress(progress);
            
            if (offset < file.size) {
              // Wait for buffer amount to lower if too high (WebRTC limits)
              if (dataChannelRef.current.bufferedAmount > 1024 * 1024) {
                 setTimeout(() => readSlice(offset), 50);
              } else {
                 readSlice(offset);
              }
            } else {
              // Done
              dataChannelRef.current.send(JSON.stringify({ type: 'file-end' }));
              addLog('TRANSLOCATION COMPLETE.', 'success');
              setTimeout(() => setTransferProgress(0), 2000);
            }
          } catch (e) {
            addLog('TRANSFER FAILED: DIMENSIONAL INTERFERENCE.', 'alert');
          }
        }
      };
      reader.readAsArrayBuffer(slice);
    };
    
    readSlice(0);
    
  }, [addLog]);

  return { connectToPortal, disconnect: cleanup, peerState, transferProgress, sendFile };
}
