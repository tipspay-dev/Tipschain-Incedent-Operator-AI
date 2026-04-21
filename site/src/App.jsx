import { useEffect, useState } from "react";

const TIPSCHAIN_NETWORK = {
  chainIdDec: 19251925,
  chainIdHex: "0x125c2d5",
  chainName: "Tipschain Mainnet",
  nativeCurrency: {
    name: "TipCoin",
    symbol: "TIP",
    decimals: 18,
  },
  rpcUrls: ["https://rpc2.tipschain.org", "https://rpc.tipschain.org"],
  blockExplorerUrls: ["https://scan.tipschain.online"],
};

const walletLinks = {
  hostedWallet: "https://wallet.tipspay.org",
  explorer: "https://scan.tipschain.online",
  rpc: "https://rpc2.tipschain.org",
  rpcFallback: "https://rpc.tipschain.org",
  dex: "https://dex.tipspay.org",
  bridge: "https://bridge.tipspay.org",
};

const surfaces = [
  {
    title: "Wallet",
    href: walletLinks.hostedWallet,
    endpoint: "wallet.tipspay.org",
    description: "Hosted wallet entrypoint for balances, transfers, and onboarding flows.",
  },
  {
    title: "Explorer",
    href: walletLinks.explorer,
    endpoint: "scan.tipschain.online",
    description: "Blocks, transactions, contracts, and token visibility.",
  },
  {
    title: "RPC",
    href: walletLinks.rpc,
    endpoint: "rpc2.tipschain.org",
    description: "Primary Besu JSON-RPC surface for wallets and integrations.",
  },
  {
    title: "Bridge",
    href: walletLinks.bridge,
    endpoint: "bridge.tipspay.org",
    description: "Cross-chain bridge surface for moving assets into and out of Tipschain.",
  },
];

const detailCards = [
  {
    label: "CHAIN ID",
    value: String(TIPSCHAIN_NETWORK.chainIdDec),
    valueClassName: "text-2xl sm:text-[2rem]",
  },
  {
    label: "CONSENSUS",
    value: "QBFT",
    valueClassName: "text-2xl sm:text-[2rem]",
  },
  {
    label: "EXPLORER",
    value: "scan.tipschain.online",
    valueClassName:
      "text-[0.92rem] sm:text-[0.98rem] lg:text-[1.02rem] tracking-[-0.03em]",
  },
  {
    label: "PRIMARY RPC",
    value: "rpc2.tipschain.org",
    valueClassName:
      "text-[0.92rem] sm:text-[0.98rem] lg:text-[1.02rem] tracking-[-0.03em]",
  },
  {
    label: "BRIDGE",
    value: "bridge.tipspay.org",
    valueClassName:
      "text-[0.92rem] sm:text-[0.98rem] lg:text-[1.02rem] tracking-[-0.03em]",
  },
];

function getEthereumProvider() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.ethereum ?? null;
}

function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function describeWalletState({ installed, account, chainId }) {
  if (!installed) {
    return "No injected wallet detected. Install MetaMask or Rabby, then retry.";
  }
  if (!account) {
    return "Wallet detected. Connect an account to start onboarding onto Tipschain.";
  }
  if (chainId?.toLowerCase() !== TIPSCHAIN_NETWORK.chainIdHex) {
    return "Wallet connected, but the active network is not Tipschain yet.";
  }
  return "Wallet connected and aligned with Tipschain Mainnet.";
}

function normalizeWalletError(error) {
  if (!error) {
    return "Wallet request failed.";
  }
  if (error.code === 4001) {
    return "Wallet request was rejected. Approve the prompt in your wallet to continue.";
  }
  if (error.code === 4902) {
    return "Tipschain is not added in this wallet yet. Use the Add Network action and retry.";
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return "Wallet request failed.";
}

async function ensureTipschainNetwork(provider) {
  const activeChainId = await provider.request({ method: "eth_chainId" });
  if (activeChainId?.toLowerCase() === TIPSCHAIN_NETWORK.chainIdHex) {
    return activeChainId;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TIPSCHAIN_NETWORK.chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: TIPSCHAIN_NETWORK.chainIdHex,
          chainName: TIPSCHAIN_NETWORK.chainName,
          nativeCurrency: TIPSCHAIN_NETWORK.nativeCurrency,
          rpcUrls: TIPSCHAIN_NETWORK.rpcUrls,
          blockExplorerUrls: TIPSCHAIN_NETWORK.blockExplorerUrls,
        },
      ],
    });
  }

  return provider.request({ method: "eth_chainId" });
}

function TipspayHero() {
  const [wallet, setWallet] = useState({
    installed: false,
    account: null,
    chainId: null,
    busy: false,
    error: "",
    status: "Checking wallet availability...",
  });

  const isConnected = Boolean(wallet.account);
  const isOnTipschain = wallet.chainId?.toLowerCase() === TIPSCHAIN_NETWORK.chainIdHex;

  async function syncWalletState() {
    const provider = getEthereumProvider();
    if (!provider) {
      setWallet({
        installed: false,
        account: null,
        chainId: null,
        busy: false,
        error: "",
        status: describeWalletState({ installed: false, account: null, chainId: null }),
      });
      return;
    }

    try {
      const [accounts, chainId] = await Promise.all([
        provider.request({ method: "eth_accounts" }),
        provider.request({ method: "eth_chainId" }),
      ]);

      const account = accounts[0] ?? null;
      setWallet((current) => ({
        ...current,
        installed: true,
        account,
        chainId,
        error: "",
        status: describeWalletState({ installed: true, account, chainId }),
      }));
    } catch (error) {
      setWallet((current) => ({
        ...current,
        installed: true,
        error: normalizeWalletError(error),
        status: "Wallet detected, but status could not be read cleanly.",
      }));
    }
  }

  useEffect(() => {
    const provider = getEthereumProvider();
    void syncWalletState();

    if (!provider?.on) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      const account = accounts[0] ?? null;
      setWallet((current) => ({
        ...current,
        installed: true,
        account,
        error: "",
        status: describeWalletState({
          installed: true,
          account,
          chainId: current.chainId,
        }),
      }));
    };

    const handleChainChanged = (chainId) => {
      setWallet((current) => ({
        ...current,
        chainId,
        error: "",
        status: describeWalletState({
          installed: true,
          account: current.account,
          chainId,
        }),
      }));
    };

    const handleDisconnect = () => {
      setWallet((current) => ({
        ...current,
        account: null,
        chainId: null,
        error: "Wallet disconnected from the page.",
        status: "Wallet disconnected. Reconnect to continue.",
      }));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
      provider.removeListener?.("disconnect", handleDisconnect);
    };
  }, []);

  async function handleConnectWallet() {
    const provider = getEthereumProvider();
    if (!provider) {
      window.open(walletLinks.hostedWallet, "_blank", "noopener,noreferrer");
      return;
    }

    setWallet((current) => ({
      ...current,
      busy: true,
      error: "",
    }));

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = accounts[0] ?? null;
      const chainId = await ensureTipschainNetwork(provider);

      setWallet((current) => ({
        ...current,
        installed: true,
        account,
        chainId,
        error: "",
        status: describeWalletState({ installed: true, account, chainId }),
      }));
    } catch (error) {
      setWallet((current) => ({
        ...current,
        installed: true,
        error: normalizeWalletError(error),
        status: current.account
          ? "Wallet session is present, but onboarding did not complete."
          : "Wallet connection was not completed.",
      }));
    } finally {
      setWallet((current) => ({
        ...current,
        busy: false,
      }));
    }
  }

  async function handleSwitchNetwork() {
    const provider = getEthereumProvider();
    if (!provider) {
      window.open(walletLinks.hostedWallet, "_blank", "noopener,noreferrer");
      return;
    }

    setWallet((current) => ({
      ...current,
      busy: true,
      error: "",
    }));

    try {
      const chainId = await ensureTipschainNetwork(provider);
      const accounts = await provider.request({ method: "eth_accounts" });
      const account = accounts[0] ?? null;

      setWallet((current) => ({
        ...current,
        installed: true,
        account,
        chainId,
        error: "",
        status: describeWalletState({ installed: true, account, chainId }),
      }));
    } catch (error) {
      setWallet((current) => ({
        ...current,
        installed: true,
        error: normalizeWalletError(error),
        status: "Network switch did not complete.",
      }));
    } finally {
      setWallet((current) => ({
        ...current,
        busy: false,
      }));
    }
  }

  const topActionLabel = wallet.busy
    ? "Connecting..."
    : !wallet.installed
      ? "Get Wallet"
      : !isConnected
        ? "Connect Wallet"
        : !isOnTipschain
          ? "Switch to Tipschain"
          : shortenAddress(wallet.account);

  const topActionHandler = !wallet.installed || !isConnected
    ? handleConnectWallet
    : !isOnTipschain
      ? handleSwitchNetwork
      : syncWalletState;

  return (
    <section className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(28,158,255,0.18),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(158,91,255,0.12),transparent_24%),linear-gradient(180deg,#03112f_0%,#02091c_100%)] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(2,9,30,0.94),rgba(2,7,23,0.97))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10 xl:p-12">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 fade-rise" style={{ animationDelay: "0.05s" }}>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Tipschain Mainnet
            </div>
            <span className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300 sm:text-xs">
              Chain ID {TIPSCHAIN_NETWORK.chainIdDec}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 fade-rise sm:justify-end" style={{ animationDelay: "0.12s" }}>
            <a
              href={walletLinks.hostedWallet}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/25 sm:min-h-[52px] sm:px-6 sm:text-base"
            >
              Open Hosted Wallet
            </a>
            <button
              type="button"
              onClick={topActionHandler}
              disabled={wallet.busy}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-cyan-400/30 bg-slate-900/80 px-5 text-sm font-semibold text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-wait disabled:opacity-70 sm:min-h-[52px] sm:px-6 sm:text-base"
            >
              {topActionLabel}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.35fr_0.85fr] lg:gap-10">
          <div className="relative flex flex-col">
            <h1 className="fade-rise max-w-3xl bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-4xl font-extrabold leading-[0.98] tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl xl:text-7xl" style={{ animationDelay: "0.16s" }}>
              The Wallet &amp; Payment Layer for Tipschain
            </h1>

            <div className="mt-5 max-w-3xl fade-rise" style={{ animationDelay: "0.22s" }}>
              <h2 className="text-lg font-medium leading-8 text-slate-200 sm:text-2xl">
                Manage payments, access DeFi, bridge assets, and onboard existing wallets into Tipschain cleanly.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">
                Connect your injected wallet, switch directly onto Tipschain Mainnet,
                verify live chain status, and move into the explorer, RPC, hosted wallet,
                bridge, and DEX surfaces without guessing network details.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 fade-rise" style={{ animationDelay: "0.3s" }}>
              <a
                href={walletLinks.hostedWallet}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(16,194,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(16,194,255,0.3)] sm:text-base"
              >
                Open TipsWallet
              </a>
              <a
                href={walletLinks.bridge}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 px-6 text-sm font-semibold text-fuchsia-100 transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/45 hover:bg-fuchsia-500/15 sm:text-base"
              >
                Open Bridge
              </a>
              <button
                type="button"
                onClick={handleSwitchNetwork}
                disabled={wallet.busy}
                className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-cyan-300/25 bg-white/5 px-6 text-sm font-semibold text-cyan-100 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-white/10 disabled:cursor-wait disabled:opacity-70 sm:text-base"
              >
                Add Tipschain Network
              </button>
            </div>

            <div className="mt-10 flex justify-center lg:mt-12 fade-rise" style={{ animationDelay: "0.38s" }}>
              <div className="relative flex w-full items-center justify-center py-2">
                <div className="absolute inset-x-12 top-1/2 h-24 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-3xl sm:h-28 lg:h-32" />
                <div className="absolute inset-x-20 top-1/2 h-20 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl sm:h-24 lg:h-28" />
                <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
                <div className="absolute inset-x-24 top-1/2 h-px translate-y-7 bg-gradient-to-r from-transparent via-fuchsia-400/25 to-transparent" />
                <div className="absolute inset-x-24 top-1/2 h-px -translate-y-7 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
                <img
                  src="/tipswallet-logo.png"
                  alt="TipsWallet logo"
                  className="hero-logo-float relative z-10 h-auto w-full max-w-[430px] rounded-[26px] object-contain shadow-[0_24px_80px_rgba(12,18,48,0.45)] sm:max-w-[500px] lg:max-w-[560px]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="fade-rise rounded-[28px] border border-indigo-200/10 bg-slate-950/65 p-5 shadow-inner shadow-white/[0.03] backdrop-blur-sm" style={{ animationDelay: "0.26s" }}>
              <div className="mb-5 flex min-h-[220px] items-center justify-center rounded-3xl border border-white/5 bg-black p-4">
                <img
                  src="/tipschain-logo.png"
                  alt="Tipschain logo"
                  className="h-auto w-full max-w-[420px] object-contain"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {detailCards.map((card) => (
                  <div
                    key={card.label}
                    className="min-w-0 rounded-3xl border border-indigo-200/10 bg-slate-900/90 p-4"
                  >
                    <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]">
                      {card.label}
                    </div>
                    <div className={`overflow-hidden whitespace-nowrap text-ellipsis font-bold leading-none text-white ${card.valueClassName ?? "text-lg sm:text-2xl"}`}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-rise rounded-[28px] border border-cyan-400/15 bg-slate-950/65 p-5 backdrop-blur-sm" style={{ animationDelay: "0.3s" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Wallet Status
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {isConnected ? (isOnTipschain ? "Connected on Tipschain" : "Connected, switch required") : "Wallet ready to connect"}
                  </h3>
                </div>
                <span className={`inline-flex rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isConnected && isOnTipschain
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                }`}>
                  {wallet.installed ? (isOnTipschain ? "Ready" : "Needs Action") : "No Wallet"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                {wallet.status}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-indigo-200/10 bg-slate-900/90 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Connected account
                  </div>
                  <div className="break-all text-sm font-semibold text-white sm:text-base">
                    {wallet.account ?? "No account connected"}
                  </div>
                </div>
                <div className="rounded-3xl border border-indigo-200/10 bg-slate-900/90 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Active chain
                  </div>
                  <div className="text-sm font-semibold text-white sm:text-base">
                    {wallet.chainId ?? "Unknown"}
                  </div>
                </div>
              </div>

              {wallet.error ? (
                <div className="mt-4 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100">
                  {wallet.error}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={wallet.busy}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:min-h-[52px] sm:px-6 sm:text-base"
                >
                  {wallet.busy ? "Waiting for wallet..." : isConnected ? "Reconnect / Refresh" : "Connect Wallet"}
                </button>
                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                  disabled={wallet.busy}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 px-5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/25 disabled:cursor-wait disabled:opacity-70 sm:min-h-[52px] sm:px-6 sm:text-base"
                >
                  Switch / Add Tipschain
                </button>
                <a
                  href={walletLinks.bridge}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-5 text-sm font-semibold text-fuchsia-100 transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-300/35 sm:min-h-[52px] sm:px-6 sm:text-base"
                >
                  Open Bridge
                </a>
              </div>
            </div>

            <div id="ecosystem" className="fade-rise rounded-[28px] border border-indigo-200/10 bg-slate-950/65 p-4 backdrop-blur-sm sm:p-5" style={{ animationDelay: "0.34s" }}>
              <div className="space-y-3">
                {surfaces.map((surface) => (
                  <a
                    key={surface.title}
                    href={surface.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-3xl border border-indigo-200/10 bg-slate-900/90 p-5 transition duration-300 hover:border-cyan-400/25 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.35)]">
                        {surface.title}
                      </h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Open
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
                      {surface.description}
                    </p>
                    <div className="mt-3 overflow-hidden whitespace-nowrap text-ellipsis text-[0.9rem] font-semibold tracking-[-0.02em] text-cyan-200 sm:text-[0.96rem]">
                      {surface.endpoint}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        id="network"
        className="mx-auto mt-8 grid max-w-7xl gap-4 px-1 md:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="fade-rise rounded-[28px] border border-white/8 bg-white/5 p-6 backdrop-blur-sm" style={{ animationDelay: "0.42s" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Network posture
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Live chain routes, aligned with the current Tipschain public entrypoints.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Primary RPC is now <span className="font-semibold text-white">rpc2.tipschain.org</span>,
            with <span className="font-semibold text-white">rpc.tipschain.org</span> kept as fallback.
            Wallet, explorer, bridge, and DEX routes are wired to the current public surfaces.
          </p>
        </div>

        <div className="fade-rise grid gap-3" style={{ animationDelay: "0.5s" }}>
          <a
            href={walletLinks.explorer}
            target="_blank"
            rel="noreferrer"
            className="rounded-[24px] border border-cyan-400/15 bg-slate-950/65 p-5 transition duration-300 hover:border-cyan-300/35"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Explorer endpoint
            </div>
            <div className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.08rem]">
              scan.tipschain.online
            </div>
          </a>
          <a
            href={walletLinks.rpc}
            target="_blank"
            rel="noreferrer"
            className="rounded-[24px] border border-fuchsia-400/15 bg-slate-950/65 p-5 transition duration-300 hover:border-fuchsia-300/35"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-fuchsia-300">
              Public RPC
            </div>
            <div className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.08rem]">
              rpc2.tipschain.org
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Fallback: {walletLinks.rpcFallback.replace("https://", "")}
            </div>
          </a>
          <a
            href={walletLinks.bridge}
            target="_blank"
            rel="noreferrer"
            className="rounded-[24px] border border-emerald-400/15 bg-slate-950/65 p-5 transition duration-300 hover:border-emerald-300/35"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Bridge surface
            </div>
            <div className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis text-[1rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.08rem]">
              bridge.tipspay.org
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Cross-chain asset movement entrypoint
            </div>
          </a>
        </div>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 sm:text-sm">
        <span>Tipspay Wallet on Tipschain Mainnet</span>
        <a href={walletLinks.rpc} target="_blank" rel="noreferrer" className="transition duration-300 hover:text-slate-300">
          API Docs
        </a>
        <a href={walletLinks.hostedWallet} target="_blank" rel="noreferrer" className="transition duration-300 hover:text-slate-300">
          Hosted Wallet
        </a>
        <a href={walletLinks.bridge} target="_blank" rel="noreferrer" className="transition duration-300 hover:text-slate-300">
          Bridge
        </a>
        <a href={walletLinks.dex} target="_blank" rel="noreferrer" className="transition duration-300 hover:text-slate-300">
          DEX
        </a>
      </footer>
    </section>
  );
}

export default function App() {
  return <TipspayHero />;
}
