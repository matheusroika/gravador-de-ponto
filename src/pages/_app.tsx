import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { UserProvider } from '../contexts/UserContext'
import { ModalProvider } from '../contexts/ModalContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ModalProvider>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </ModalProvider>
  )
}
