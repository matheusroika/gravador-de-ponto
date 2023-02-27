import { format } from "date-fns";
import { createContext, useContext, ReactNode, useState, useEffect, Dispatch, SetStateAction } from "react";
import { ModalContext } from "./ModalContext";

export interface ClockIn {
  date: string,
  timeIn: string[],
  timeOut: string[]
}

export interface User {
  name: string,
  workHours: string,
  clockIn: ClockIn[]
}

export const emptyUser = {
  name: '',
  workHours: '',
  clockIn: []
}

interface UserContextData {
  user: User,
  setUser: Dispatch<SetStateAction<User>>,
  isAuthenticated: boolean,
}

interface UserProviderProps {
  children: ReactNode
}

export const UserContext = createContext({} as UserContextData)

export function UserProvider({ children }: UserProviderProps) {
  const { openModal, closeModal } = useContext(ModalContext)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User>(() => {
    const userData = storageAvailable() ? localStorage.getItem('userData') : JSON.stringify(emptyUser)
    const finalData = userData ? JSON.parse(userData) : emptyUser
    return finalData
  })
  
  useEffect(() => {
    function formatErrorModal() {
      const formatErrorMessage = 'Ocorreu um erro na formatação dos seus dados. Você pode fazer download, corrigir manualmente e importar novamente ou apagar seus dados. Lembre-se que datas devem estar no formato DD-MM-YYYY e as horas no formato HH:MM:SS.'

      const newErrorButtons = [{
        text: "Apagar dados",
        onClick: () => {
          const deleteAccountButtons = [{
            text: 'Sim, apagar',
            onClick: () => {
              setUser(emptyUser)
              localStorage.removeItem('userData')
              closeModal()
            }
          },
          {
            text: 'Cancelar',
            onClick: () => {
              setIsAuthenticated(false)
              openModal({
                description: formatErrorMessage,
                buttons: newErrorButtons
              })
            }
          }]

          setIsAuthenticated(false)
          openModal({
            description: 'Essa é uma ação irreversível, tem certeza que deseja apagar sua conta? Todos os seus dados serão perdidos.',
            buttons: deleteAccountButtons
          })
        }
      },
      {
        text: "Download dos dados",
        onClick: () => {
          const a = document.createElement('a')
          a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(user, null, 4))}`
          a.download = `gravadorDePonto_${format(new Date(), 'yyyy-LL-dd')}.json`
          a.click()
        }
      }]

      setIsAuthenticated(false)
      openModal({
        description: formatErrorMessage,
        buttons: newErrorButtons
      })
    }

    if (!checkClockIn(user)) {
      formatErrorModal()
    } else if (user.name !== '' &&
    user.workHours !== '' &&
    user.name.trim().length > 0 &&
    /^\d+$/.test(user.workHours)) {
      localStorage.setItem('userData', JSON.stringify(user))
      setIsAuthenticated(true)
    } else if (user === emptyUser) {
      setIsAuthenticated(false)
    } else {
      formatErrorModal()
    }
  }, [user])

  useEffect(() => {
    if (!storageAvailable()) {
      setIsAuthenticated(false)
      openModal({
        description: 'O cache do seu navegador está desabilitado ou não disponível. Tente novamente ou altere as configurações do seu navegador.'
      })
    }
  }, [])

  return (
    <UserContext.Provider value={{ isAuthenticated, setUser, user }}>
      {children}
    </UserContext.Provider>
  )
}

function storageAvailable() {
  if (typeof window === 'undefined') return false

  const storage = window['localStorage']
  const x = '__storage_test__';

  try {
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;

  } catch(e) {
      return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage.length !== 0;
  }
}

export function checkClockIn(user: User) {
  if (!Array.isArray(user.clockIn)) {
    return false
  }
  
  for (const entry of user.clockIn) {
    const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/
    if (!entry.date ||
      !datePattern.test(entry.date) ||
      !entry.timeIn ||
      !entry.timeOut ||
      entry.timeOut.length > entry.timeIn.length) {
      return false
    }

    for (const time of entry.timeIn) {
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
      if (!timePattern.test(time)) {
        return false
      }
    }

    for (const time of entry.timeOut) {
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
      if (!timePattern.test(time)) {
        return false
      }
    }
  }

  return true
}