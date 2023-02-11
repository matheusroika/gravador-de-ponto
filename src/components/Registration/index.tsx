import { ChangeEvent, FormEvent, useContext, useState, useRef, useEffect } from "react"
import { GrFormClose } from "react-icons/gr"
import { emptyUser, UserContext } from "../../contexts/UserContext"

import styles from './styles.module.scss'

export default function Registration() {
  const { error, setError, errorMessage, isAuthenticated, setUser, user } = useContext(UserContext)
  const [form, setForm] = useState({
    userName: '',
    workHours: '',
  })

  const popup = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!error) return

    function handleClick(event: MouseEvent) {
      if (popup.current && !popup.current.contains(event.target as Node)) {
        setError(false)
      }
    }

    window.addEventListener("click", handleClick)

    return () => window.removeEventListener("click", handleClick)
  }, [error])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const userData = {
      ...emptyUser,
      name: form.userName,
      workHours: form.workHours,
    }

    setUser(userData)
  }

  function handlePopup() {
    setError(false)
  }

  return (
    <>
    <div className={styles.registration}>
      <form onSubmit={handleSubmit}>
        <div className={styles.input}>
          <label htmlFor="userName">Nome</label><br/>
          <input required type="text" name="userName" id="userName" value={form.userName} onChange={handleChange} />
        </div>
        
        <div className={styles.input}>
          <label htmlFor="workHours">Tempo de trabalho por semana</label><br/>
          <input required type="number" name="workHours" id="workHours" value={form.workHours} list="commonWorkHours" min={0} max={168} onChange={handleChange} />
          <datalist id="commonWorkHours">
            <option value="40" />
            <option value="44" />
            <option value="20" />
            <option value="36" />
            <option value="30" />
          </datalist>
        </div>

        <button type="submit">Cadastrar</button>
      </form>
    </div>

    <div ref={popup} className={`${styles.popup} ${error ? styles.active : ''}`}>
      <button onClick={handlePopup}><GrFormClose /></button>
      {errorMessage}
    </div>
    </>
  )
}