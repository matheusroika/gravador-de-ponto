import { ChangeEvent, FormEvent, useContext, useState } from "react"
import { ModalContext } from "../../contexts/ModalContext"
import { emptyUser, UserContext } from "../../contexts/UserContext"
import { handleImport } from "../Header"

import styles from './styles.module.scss'

export default function Registration() {
  const { isAuthenticated, setUser, user } = useContext(UserContext)
  const { openModal } = useContext(ModalContext)

  const [form, setForm] = useState({
    userName: '',
    workHours: '',
  })

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

  return (
    <>
    <div className={styles.registration}>
      <form onSubmit={handleSubmit}>
        <div className={styles.input}>
          <label htmlFor="userName">Nome</label><br/>
          <input required type="text" name="userName" id="userName" value={form.userName} onChange={handleChange} />
        </div>
        
        <div className={styles.input}>
          <label htmlFor="workHours">Horas trabalhadas por semana</label><br/>
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

      <p>ou</p>

      <div className={styles.sideButtons}>
        <button onClick={() => {handleImport({setUser, openModal})}}>Importar dados</button>
      </div>
    </div>
    </>
  )
}