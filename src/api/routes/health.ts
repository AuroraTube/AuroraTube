import { withApiErrors } from '../envelope'
import { getHealth } from '../services/health'

export const healthHandler = withApiErrors(async () => getHealth())
