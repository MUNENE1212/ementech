/**
 * Lead Capture Components
 *
 * Value-first lead capture components for EmenTech website
 *
 * Components:
 * - NewsletterSignup: Email subscription with multiple variants
 * - ResourceDownload: Progressive form for gated content
 * - ExitIntentPopup: Exit intent capture with attractive offers
 *
 * Usage:
 * ```jsx
 * import { NewsletterSignup, ResourceDownload, ExitIntentPopup } from '@/components/lead-capture';
 *
 * // Newsletter in footer
 * <NewsletterSignup context="footer" variant="minimal" />
 *
 * // Resource download
 * <ResourceDownload resource={resourceData} />
 *
 * // Exit intent (already integrated in App)
 * <ExitIntentPopup />
 * ```
 */

export { default as NewsletterSignup } from './NewsletterSignup';
export { default as ResourceDownload } from './ResourceDownload';
export { default as ExitIntentPopup } from './ExitIntentPopup';
export { default as LeadForm } from './shared/LeadForm';
export { default as SuccessModal } from './shared/SuccessModal';
export { default as LoadingSpinner } from './shared/LoadingSpinner';
