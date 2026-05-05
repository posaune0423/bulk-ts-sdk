import type { WsSubscription } from "../types/ws.ts";

export function topicOf(subscription: WsSubscription): string[] {
  switch (subscription.type) {
    case "ticker":
      return [`ticker.${subscription.symbol}`];
    case "candle":
      return [`candle.${subscription.symbol}.${subscription.interval}`];
    case "trades":
      return [`trades.${subscription.symbol}`];
    case "risk":
      return [`risk.${subscription.symbol}`];
    case "frontendContext":
      return ["frontendContext"];
    case "l2Snapshot": {
      const baseTopic = `l2snapshot.${subscription.symbol}`;
      return [subscription.nlevels === undefined ? baseTopic : `${baseTopic}.${subscription.nlevels}`];
    }
    case "l2Delta":
      return [`l2delta.${subscription.symbol}`];
    case "account":
      return Array.isArray(subscription.user)
        ? subscription.user.map((user) => `account.${user}`)
        : [`account.${subscription.user}`];
    default:
      return [];
  }
}
