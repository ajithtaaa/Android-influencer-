import { H1, P, Screen, Section } from '@/components/ui';
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/theme';

const UPDATED = 'October 17, 2026';

// Also published at <your-domain>/privacy for the Play Console privacy URL.
export default function PrivacyScreen() {
  return (
    <Screen>
      <H1>Privacy Policy</H1>
      <P muted>Last updated: {UPDATED}</P>
      <Section title="Who we are">
        {APP_NAME} (“we”) lets you create AI face swap videos. Contact: {SUPPORT_EMAIL}.
      </Section>
      <Section title="What we collect">
        • Photos and videos you choose to upload, only to create your video.{'\n'}
        • The videos we generate for you.{'\n'}
        • A random account ID created by the app. We do not ask for your name, email or phone number.{'\n'}
        • Purchase records (product, time, a purchase token). Card details are handled by Google Play or Stripe — we never see them.{'\n'}
        • Reports you send about content.
      </Section>
      <Section title="Face data">
        Faces in your uploads are processed only to generate the video you request. We do not use them to identify you, build
        face templates, train AI models, or for advertising.
      </Section>
      <Section title="How we use it">
        To generate your videos, keep your credit balance, prevent abuse, respond to reports and comply with the law. We do not
        sell your data, show ads, or use advertising IDs or tracking SDKs.
      </Section>
      <Section title="Who we share it with">
        • Higgsfield AI — processes uploads to generate the video.{'\n'}
        • Google Play / Stripe — payments.{'\n'}
        • Our hosting providers (Vercel, Upstash) — store your account and video list.{'\n'}
        • Authorities, only when required by law.
      </Section>
      <Section title="Security">All data is encrypted in transit (HTTPS). Your session key is stored in the device’s secure storage.</Section>
      <Section title="How long we keep it">
        Generated videos and history: 30 days. Uploaded files at our AI provider: at least 7 days, then deleted. Account ID and
        credits: until you delete your data. Reports: up to 1 year for safety reviews.
      </Section>
      <Section title="Your choices">
        Delete everything at any time from Settings → Delete my data, or at the /delete-account page of our website, or by email.
        Depending on where you live (e.g. GDPR, CCPA) you may also request access or correction by emailing us.
      </Section>
      <Section title="Children">This app is for adults 18+. We do not knowingly collect data from children.</Section>
      <Section title="Changes">We will update this page and the date above if this policy changes.</Section>
    </Screen>
  );
}
