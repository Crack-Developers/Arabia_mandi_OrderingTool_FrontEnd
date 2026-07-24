import { io, Socket } from 'socket.io-client';
import { useERPStore } from '../stores/erp.store';
import { getBaseUrl } from './api.service';

let socket: Socket | null = null;

export const initCloudSocket = () => {
  if (socket) {
    socket.disconnect();
  }

  // Connect directly to the cloud backend
  const host = getBaseUrl().replace('/api/v1', '');

  socket = io(host, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('[Socket] Connected to Cloud Backend for real-time sync');
    const store = useERPStore.getState();
    const branchId = store.currentBranch?._id || store.currentUser?.branchId;
    if (branchId) {
      socket?.emit('join_branch', branchId);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from Cloud Backend');
  });

  socket.on('cloud_update', (data) => {
    console.log('[Socket] Received cloud update:', data?.action);
    const store = useERPStore.getState();
    const branchId = store.currentBranch?._id || store.currentUser?.branchId;
    
    // Auto-refresh the relevant data without full page reload
    if (branchId) {
      store.fetchBranches();
      store.fetchTables(branchId);
      store.fetchMenuData(branchId);
    }
  });
};

export const disconnectCloudSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getCloudSocket = () => socket;
