## GitHub Copilot Chat

- Extension: 0.45.1 (prod)
- VS Code: 1.117.0 (10c8e557c8b9f9ed0a87f61f1c9a44bde731c409)
- OS: win32 10.0.26200 x64
- GitHub Account: cjhimanshu

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (1 ms)
- DNS ipv6 Lookup: Error (7 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): Error (4826 ms): Error: net::ERR_CONNECTION_TIMED_OUT
    at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
    at SimpleURLLoaderWrapper.emit (node:events:519:28)
    at SimpleURLLoaderWrapper.emit (node:domain:489:12)
    at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
    at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: timed out after 10 seconds
- Node.js fetch: 