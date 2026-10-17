import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, H1, P, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { SUPPORT_EMAIL } from '@/lib/theme';

// In-app account deletion + public web page (Google Play User Data policy).
export default function DeleteAccountScreen() {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  return (
    <Screen>
      <H1>Delete your data</H1>
      <P>This permanently deletes, from our servers:</P>
      <Card>
        <P>• Your account ID and remaining credits</P>
        <P>• All your generated videos and their history</P>
      </Card>
      <P muted>
        Uploaded photos and videos are only kept by our AI provider for processing and are removed automatically within 7 days.
        Payment records may be kept by Google Play or Stripe as required by law. Unused credits are not refundable once deleted.
      </P>
      <P muted>
        Using the app on the web? Open this page in the same browser. Can't access the app? Email {SUPPORT_EMAIL} with the
        subject “Delete my data”.
      </P>
      {state === 'done' ? (
        <>
          <P>Your data has been deleted.</P>
          <Button title="Back to start" onPress={() => router.replace('/')} />
        </>
      ) : (
        <Button
          title="Permanently delete my data"
          variant="danger"
          loading={state === 'busy'}
          onPress={async () => {
            setState('busy');
            try {
              await api.deleteAccount();
              setState('done');
            } catch {
              setState('error');
            }
          }}
        />
      )}
      {state === 'error' && <P>Something went wrong. Please try again or email us.</P>}
    </Screen>
  );
}
