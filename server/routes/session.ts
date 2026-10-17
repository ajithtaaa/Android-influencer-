import { issueToken } from '../auth';
import { route } from '../http';
import { createUser } from '../store';

// Creates an anonymous account. The app stores the token on the device.
export default route(['POST'], async () => {
  const { userId, token } = issueToken();
  await createUser(userId);
  return { userId, token };
}, { auth: false });
