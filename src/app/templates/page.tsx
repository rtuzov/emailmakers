import { Metadata } from 'next'
import { TemplatesPage } from '@/ui/components/pages/templates-page'

export const metadata: Metadata = {
  title: 'Email Templates | Email Makers',
  description: 'Browse and manage your email templates with advanced filtering and analytics.',
}

export default function Templates() {
  return <TemplatesPage />
} 