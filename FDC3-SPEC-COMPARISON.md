# FDC3 Spec Comparison — `@morgan-stanley/fdc3-web`

A comparison of this repository against the FDC3 Desktop Agent API specification
(<https://fdc3.finos.org/docs/api/spec>).

## Summary

This repo (`@morgan-stanley/fdc3-web`) is a **browser-resident FDC3 Desktop Agent**
implementation. It implements FDC3 **2.1** (per `getInfo`) and is split into three
published packages plus a test-harness:

```
+---------------------+   +----------------------+   +------------------+
|   fdc3-web (lib)    |   |  messaging-provider  |   |   ui-provider    |
|  DesktopAgent + WCP |   |  cross-frame/origin  |   | resolver +       |
|  proxy/root agents  |   |  postMessage relay   |   | channel selector |
+---------------------+   +----------------------+   +------------------+
```

## Spec compliance — all mandatory `DesktopAgent` methods are present

In `projects/fdc3-web/src/agent/desktop-agent-proxy.ts`: `addContextListener`,
`addIntentListener`, `addEventListener`, `broadcast`, `createPrivateChannel`,
`findInstances`, `findIntent`, `findIntentsByContext`, `getCurrentChannel`,
`getInfo`, `getAppMetadata`, `getOrCreateChannel`, `getUserChannels`, `open`,
`raiseIntent`, `raiseIntentForContext`, plus optional
`joinUserChannel`/`leaveCurrentChannel` and deprecated
`getSystemChannels`/`joinChannel`. Channels (public/private), the WCP handshake,
and originating-app metadata are also implemented. So it covers the required MUST
surface of the spec.

## Features this repo provides that are NOT part of the FDC3 base specification

These are vendor extensions / implementation choices outside the standardized API
surface (the "grey area" the spec explicitly leaves to implementers):

1. **`addIntentListenerWithContext(intent, contextType, handler)`** — a
   non-standard `DesktopAgent` extension. The repo declares its own
   `DesktopAgentNext` interface (`projects/fdc3-web/src/contracts.ts`) extending
   FINOS's, described as "features planned for the next version of FDC3." This
   method does not exist in the FDC3 2.x standard.

2. **Pluggable Application Strategies** — `IOpenApplicationStrategy` and
   `ISelectApplicationStrategy` let consumers override how apps are launched
   (`canOpen`/`open`) and how existing instances are focused
   (`canSelectApp`/`selectApp`). App launching/window management is explicitly
   *outside* FDC3 (the spec lists "workspace management" and "UX of application
   resolution" as non-standardized).

3. **Singleton apps** via the `MorganStanley.fdc3-web` host manifest
   (`{ singleton: true }`, `MS_HOST_MANIFEST_KEY`). Host-manifest contents are
   vendor-defined; this singleton behavior is a custom feature affecting resolver
   display.

4. **Local in-memory App Directories with live updates** — `LocalAppDirectory`
   accepts app definitions directly plus an `AsyncIterator` `updates` for runtime
   app injection. FDC3 standardizes the App Directory REST API; passing local
   arrays and a push-update iterator is an extension.

5. **Backoff/retry for app-directory loading** — `backoffRetry: { maxAttempts,
   baseDelay }` (exponential retry). Not part of the spec.

6. **Configurable logging levels** — `logLevels: { connection, proxy }` on
   `getAgent`. Implementation detail, not standardized.

7. **Root-agent self-registration** — `appDirectoryEntry` lets the root app
   register its own intents/metadata. Standard FDC3 has no notion of the agent
   registering itself this way.

8. **Pluggable messaging-provider abstraction** —
   `IRootMessagingProvider`/`IProxyMessagingProvider` and the separate
   `messaging-provider` package. The spec defines *what* messages flow
   (WCP/DACP); this swappable transport layer (and the
   `subscribeToConnectionAttemptUuids` helper) is implementation-specific.

9. **Channel Selector UI component** (in `ui-provider`). The spec requires a
   *resolver* mechanism for intents, but a standalone channel-selector UI is not
   a standardized API.

## Notably NOT implemented (consistent with being optional/experimental)

- **Desktop Agent Bridging** — `getInfo` reports
  `optionalFeatures.DesktopAgentBridging: false` (it's `@experimental` in the
  spec, so omitting it is compliant).
