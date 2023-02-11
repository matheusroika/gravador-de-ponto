import { useContext } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import styles from './styles.module.scss'

import Registration from '../components/Registration'
import MainApp from '../components/MainApp'
import { UserContext } from '../contexts/UserContext'

export default function Home() {
  const { isAuthenticated, user } = useContext(UserContext)
  return (
    <>
      <Head>
        <title>Gravador de Ponto</title>
      </Head>

      <div className={styles.container}>
        <Header />
        
        <main className={styles.main}>
          {isAuthenticated ? (
            <MainApp />
          ) : (
            <div>
              <h2>Olá! Por favor, cadastre-se abaixo.</h2>
              <Registration />
            </div>
          )}
        </main>
      </div>
    </>
  )
}
