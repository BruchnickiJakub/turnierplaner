import { redirect } from "next/navigation";

/** Alte URL /turniere/[id]/bearbeiten → neue Route (Next 16 / Turbopack: params in tiefer Verschachtelung). */
type Props = { params: Promise<{ id: string }> };

export default async function TurnierBearbeitenLegacyRedirect({ params }: Props) {
  const { id } = await params;
  const clean = typeof id === "string" ? id.trim() : "";
  if (!clean) {
    redirect("/turniere");
  }
  redirect(`/turniere/bearbeiten/${clean}`);
}
