import { HskPageClient } from "./HskPageClient";

export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6].map((l) => ({ level: String(l) }));
}

type Props = { params: Promise<{ level: string }> };

export default async function HskPage({ params }: Props) {
  const { level } = await params;
  return <HskPageClient level={level} />;
}
