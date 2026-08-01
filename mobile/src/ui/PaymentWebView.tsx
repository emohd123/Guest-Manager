import React from "react";

type Props = {
  source: {uri: string};
  style?: object;
  onNavigationStateChange?: (state: {url: string}) => void;
};

export function PaymentWebView({source, style}: Props) {
  return React.createElement("iframe", {
    src: source.uri,
    title: "Secure payment",
    style: {
      width: "100%",
      minHeight: 576,
      border: 0,
      backgroundColor: "#FFFFFF",
      ...(style as Record<string, unknown>),
    },
    allow: "payment",
  });
}
