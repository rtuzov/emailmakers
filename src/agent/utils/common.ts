


/** Sleep for the given milliseconds. */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mapCampaignType(
  campaignType?: string
): 'promotional' | 'informational' | 'seasonal' | 'urgent' | 'newsletter' {
  switch (campaignType) {
    case 'informational':
      return 'informational';
    case 'seasonal':
      return 'seasonal';
    case 'urgent':
      return 'urgent';
    case 'newsletter':
      return 'newsletter';
    default:
      return 'promotional';
  }
}

export function mapTone(
  tone?: string
): 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family' {
  switch (tone) {
    case 'professional':
      return 'professional';
    case 'urgent':
      return 'urgent';
    case 'casual':
      return 'casual';
    case 'luxury':
      return 'luxury';
    case 'family':
      return 'family';
    default:
      return 'friendly';
  }
} 