import { useCallback, useContext } from 'react'

import logger from '../../../lib/logger/js-logger'
import useUserExists from '../../../lib/login/useUserExists'
import AuthContext from '../context/AuthContext'

const log = logger.child({ from: 'useCheckExisting' })

//check if email/mobile was used to register before and offer user to login instead
const useCheckExisting = () => {
  const { activeStep, setAlreadySignedUp } = useContext(AuthContext)
  const userExists = useUserExists()

  const checkExisting = useCallback(
    async (torusProvider, torusUser, goodWallet, eventVars = {}) => {
      let checkResult = { exists: false }
      const searchQuery = { ...torusUser, torusProvider }

      if (goodWallet) {
        searchQuery.identifier = goodWallet.getAccountForType('login')
      }

      try {
        checkResult = await userExists(searchQuery)
      } catch (e) {
        log.warn('userExists check failed:', e.message, e)
      }

      const { exists, provider } = checkResult

      log.debug('checking userAlreadyExist', { provider, torusProvider, exists, activeStep })

      if (!exists) {
        return 'signup'
      }

      // User exists, it is not the number check and it is the correct login
      if (provider?.includes(torusProvider) && !activeStep) {
        return 'login'
      }

      const analyticsVars = { provider: torusProvider, ...eventVars }

      return new Promise(resolve => setAlreadySignedUp(checkResult, analyticsVars, resolve))
    },
    [userExists],
  )

  return checkExisting
}

export default useCheckExisting
