import { useNavigate } from 'react-router-dom'
import { setup } from '~/utils'
import { useEffect } from 'react'

export function Setup(): JSX.Element {
  const navigate = useNavigate()
  useEffect(() => {
    setup(navigate)
  }, [])
  return <></>
}
