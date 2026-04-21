const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('flowdesk',{
    ping: () => 'pong',
})