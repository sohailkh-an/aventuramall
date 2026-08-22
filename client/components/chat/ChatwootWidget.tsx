"use client";

import Script from "next/script";

type ChatwootSettings = {
  hideMessageBubble: boolean;
  position: "left" | "right";
  locale: string;
  type: "standard" | "expanded_bubble";
};

const mobileLauncherStyles = `
  @media (max-width: 767px) {
    .woot-widget-bubble,
    .woot--bubble-holder,
    iframe[src*="chatwoot"] {
      right: 0.75rem !important;
      bottom: calc(env(safe-area-inset-bottom) + 6.75rem) !important;
      z-index: 45 !important;
    }

    .woot-widget-holder {
      right: 0.75rem !important;
      bottom: calc(env(safe-area-inset-bottom) + 10.75rem) !important;
      max-height: calc(100vh - 12rem) !important;
    }
  }
`;

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
  }
}

const chatwootBaseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL?.replace(
  /\/$/,
  "",
);
const chatwootWebsiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;

export function ChatwootWidget() {
  if (!chatwootBaseUrl || !chatwootWebsiteToken) {
    return null;
  }

  return (
    <>
      <Script id="chatwoot-settings" strategy="afterInteractive">
        {`
          if (!document.getElementById("chatwoot-mobile-offset")) {
            const style = document.createElement("style");
            style.id = "chatwoot-mobile-offset";
            style.textContent = ${JSON.stringify(mobileLauncherStyles)};
            document.head.appendChild(style);
          }

          window.chatwootSettings = {
            hideMessageBubble: false,
            position: "right",
            locale: "en",
            type: "standard"
          };
        `}
      </Script>
      <Script
        id="chatwoot-sdk"
        src={`${chatwootBaseUrl}/packs/js/sdk.js`}
        strategy="afterInteractive"
        onLoad={() => {
          window.chatwootSDK?.run({
            websiteToken: chatwootWebsiteToken,
            baseUrl: chatwootBaseUrl,
          });
        }}
      />
    </>
  );
}
