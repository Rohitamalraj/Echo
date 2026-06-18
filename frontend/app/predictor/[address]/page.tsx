import { PredictorPage } from '@/components/predictor-page'

export default async function Predictor({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  return <PredictorPage address={address} />
}
