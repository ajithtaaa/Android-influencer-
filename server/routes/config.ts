import { isDemo, stripeEnabled } from '../env';
import { route } from '../http';
import { PACKS } from '../store';

export default route(['GET'], async () => ({
  demo: isDemo(),
  stripe: stripeEnabled(),
  packs: PACKS,
}), { auth: false });
