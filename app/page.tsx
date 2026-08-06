import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>HENKAKU Initiation</h1>
      <p>ウォレットを準備して、Initiationをはじめましょう。</p>
      <Link className="primaryLink" href="/setup">
        ウォレットセットアップへ →
      </Link>
    </main>
  );
}
