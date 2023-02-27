import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState, ChangeEvent } from 'react'
import { checkClockIn, emptyUser, User, UserContext } from '../../contexts/UserContext'

import { AiFillCaretDown } from 'react-icons/ai'

import styles from './styles.module.scss'
import { format } from 'date-fns'
import { ModalContext, OpenModalProps } from '../../contexts/ModalContext'
import { GrFormClose } from 'react-icons/gr'

interface HandleImportProps {
  setUser: Dispatch<SetStateAction<User>>,
  openModal: ({ title, CloseIcon, description, buttons }: OpenModalProps) => void
}

export function handleImport({ setUser, openModal }: HandleImportProps) {
  async function parseJsonFile(file: File) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.onload = event => resolve(JSON.parse(event.target?.result as string))
      fileReader.onerror = error => reject(error)
      fileReader.readAsText(file)
    })
  }

  function isUser(object: any): object is User {
    const objPropNames = Object.getOwnPropertyNames(object)
    const userPropNames = Object.getOwnPropertyNames(emptyUser)

    return objPropNames.length === userPropNames.length &&
      objPropNames.every((prop, index) => prop === userPropNames[index])
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = ".json"
  input.onchange = async e => {
    if (input.files && input.files.item(0)) {
      const jsonObject = await parseJsonFile(input.files.item(0) as File)

      if (isUser(jsonObject) && checkClockIn(jsonObject)) {
        setUser(jsonObject)
      } else {
        openModal({
          description: 'Erro na formatação dos dados do backup. Corrija e tente novamente. Lembre-se que datas devem estar no formato DD-MM-YYYY e as horas no formato HH:MM:SS.'
        })
      } 
    }
  };
  input.click();
}

export default function Header() {
  const { isAuthenticated, user, setUser } = useContext(UserContext)
  const { openModal, closeModal } = useContext(ModalContext)

  const [menuVisible, setMenuVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user.name)
  const [editWorkHours, setEditWorkHours] = useState(user.workHours)

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
    closeModal()
  }

  function handleDelete() {
    openModal({
      description: 'Essa é uma ação irreversível, tem certeza que deseja apagar sua conta? Todos os seus dados serão perdidos.',
      buttons: [
        {
          text: 'Sim, apagar',
          onClick: deleteAccount
        },
        {
          text: 'Cancelar',
          onClick: closeModal
        }
      ]
    })
  }

  function handleEditName(event: ChangeEvent <HTMLInputElement>) {
    event.preventDefault()
    setEditName(event.target.value)
  }

  function handleEditWorkHours(event: ChangeEvent <HTMLInputElement>) {
    event.preventDefault()
    setEditWorkHours(event.target.value)
  }

  function editProfile() {
    if (!editName || !editWorkHours || editName.trim().length <= 0 || !/^\d+$/.test(editWorkHours)) return
    if (editName === user.name && editWorkHours === user.workHours) return closeEdit()

    const updatedUser = {
      ...user
    }

    if (editName !== user.name) updatedUser.name = editName
    if (editWorkHours !== user.workHours) updatedUser.workHours = editWorkHours

    setUser(updatedUser)
    closeEdit()
  }

  function openEdit() {
    setEditName(user.name)
    setEditWorkHours(user.workHours)
    setIsEditing(true)
  }

  function closeEdit() {
    setIsEditing(false)
    setEditName(user.name)
    setEditWorkHours(user.workHours)
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
                <a onClick={openEdit}>Editar dados</a>
                <a onClick={handleDelete}>Apagar conta</a>
                <a onClick={() => {handleImport({setUser, openModal})}}>Importar backup</a>
                <a href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(user, null, 4))}`} download={`gravadorDePonto_${format(new Date(), 'yyyy-LL-dd')}.json`}>Fazer backup</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {isEditing && (
        <div className={styles.editModalWrapper}>
          <div className={styles.editModal}>
            <button className={styles.closeButton} onClick={closeEdit}><GrFormClose /></button>
            <p className={styles.editDescription}>Edite suas informações abaixo</p>

            <div className={styles.editInputs}>
              <div>
                <label htmlFor='editName'>Nome</label>
                <input required type="text" name="editName" id="editName" onChange={handleEditName} value={editName} />
              </div>

              <div>
                <label htmlFor='editWorkHours'>Horas trabalhadas por semana</label>
                <input required type="number" name="editWorkHours" id="editWorkHours" onChange={handleEditWorkHours} value={editWorkHours} list="commonWorkHours" min={0} max={168} />
                <datalist id="commonWorkHours">
                  <option value="40" />
                  <option value="44" />
                  <option value="20" />
                  <option value="36" />
                  <option value="30" />
                </datalist>
              </div>
            </div>

            <div className={styles.editButtons}>
              <button onClick={editProfile}>Confirmar</button>
              <button onClick={closeEdit}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}