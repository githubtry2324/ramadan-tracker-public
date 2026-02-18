import { QuranTracker } from '@/components/QuranTracker'

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <QuranTracker familySlug={slug} />
}
