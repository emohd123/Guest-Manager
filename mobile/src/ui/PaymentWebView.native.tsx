import React from "react";
import { WebView } from "react-native-webview";

type Props = {
  source: {uri: string};
  style?: object;
  onNavigationStateChange?: (state: {url: string}) => void;
};

export function PaymentWebView(props: Props) {
  return <WebView {...props} />;
}
