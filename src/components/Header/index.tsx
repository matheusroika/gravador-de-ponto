import { useContext, useEffect, useRef, useState } from 'react'
import { emptyUser, UserContext } from '../../contexts/UserContext'

import { AiFillCaretDown } from 'react-icons/ai'

import styles from './styles.module.scss'
import { format } from 'date-fns'

export default function Header() {
  const { isAuthenticated, user, setUser } = useContext(UserContext)

  const [menuVisible, setMenuVisible] = useState(false)
  const [popupVisible, setPopupVisible] = useState(false)
  const menu = useRef<HTMLDivElement>(null)

  function handleMenuVisible() {
    setMenuVisible(!menuVisible)
  }

  useEffect(() => {
    if (!menuVisible) return

    function handleClick(event: MouseEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) {
        setMenuVisible(false)
      }
    }

    window.addEventListener("click", handleClick)

    return () => window.removeEventListener("click", handleClick)
  }, [menuVisible])

  function deleteAccount() {
    setUser(emptyUser)
    localStorage.removeItem('userData')
    setPopupVisible(false)
  }

  function handlePopup() {
    setPopupVisible(!popupVisible)
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Gravador de Ponto</h1>
          {isAuthenticated && (
            <div ref={menu} className={styles.profile} onClick={handleMenuVisible}>
              <p className={styles.username}>{user.name}</p>
              <AiFillCaretDown />

              <div className={`${styles.profileMenu} ${menuVisible ? styles.menuActive : ''}`}>
                <a onClick={handlePopup}>Apagar conta</a>
                <a href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(user, null, 4))}`} download={`gravadorDePonto_${format(new Date(), 'yyyy-LL-dd')}.json`}>Fazer backup</a>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div className={`${styles.popup} ${popupVisible ? styles.active : ''}`}>
        Essa é uma ação irreversível, tem certeza que deseja apagar sua conta? Todos os seus dados serão perdidos.
        <div className={styles.buttons}>
          <button onClick={deleteAccount}>Sim, apagar</button>
          <button onClick={handlePopup}>Cancelar</button>
        </div>
      </div>
    </>
  )
}