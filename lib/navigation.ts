// ABOUTME: サイト共通メニューの表示順とリンク先を定義する。
// ABOUTME: メンバー向けの参加導線と運営向け導線を分けて管理する。
export const mainNavigation = [
  { href: "/setup", label: "セットアップ", step: "1" },
  { href: "/initiation", label: "Initiation", step: "2" },
  { href: "/checkin", label: "チェックイン", step: "3" },
  { href: "/apply", label: "申請", step: "4" },
] as const;

export const adminNavigation = [{ href: "/admin", label: "運営" }] as const;
