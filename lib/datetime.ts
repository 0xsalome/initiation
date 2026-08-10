// ABOUTME: 画面に出す日時をJST固定で整形する。
// ABOUTME: タイムゾーンを明示しないとサーバー(UTC)とブラウザ(JST)で文字列が食い違う。
/**
 * ISO8601の文字列をJSTで整形する。
 *
 * タイムゾーンを省くと実行環境依存になり、Server Componentでは本番(Vercel)のUTC、
 * Client ComponentのSSRではハイドレーション不一致になる。基準をJSTに固定するのは、
 * DBの `checkins.checkin_date` が `Asia/Tokyo` で日付を決めているのに揃えるため。
 */
export function formatJst(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}
