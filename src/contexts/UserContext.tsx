import { createContext, ReactNode, useState, useEffect, Dispatch, SetStateAction } from "react";

interface ClockIn {
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
  clockIn: [
  ]
}

interface UserContextData {
  error: boolean,
  setError: Dispatch<SetStateAction<boolean>>,
  errorMessage: string,
  user: User,
  setUser: Dispatch<SetStateAction<User>>,
  isAuthenticated: boolean,
}

interface UserProviderProps {
  children: ReactNode
}

export const UserContext = createContext({} as UserContextData)

export function UserProvider({ children }: UserProviderProps) {
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User>(emptyUser)

  useEffect(() => {
    const userData = storageAvailable() ? localStorage.getItem('userData') : JSON.stringify(emptyUser)
    const finalData = userData ? JSON.parse(userData) : emptyUser
    setUser(finalData)
  }, [])
  

  useEffect(() => {
    if (user.name !== '' && user.workHours !== '' && user.name.trim().length > 0 && /^\d+$/.test(user.workHours)) {
      localStorage.setItem('userData', JSON.stringify(user))
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      setErrorMessage('Você ainda não inseriu suas informações básicas. Por favor, cadastre-se.')
      setError(true)
    }
  }, [user])

  useEffect(() => {
    if (!storageAvailable()) {
      setIsAuthenticated(false)
      setErrorMessage('O cache do seu navegador está desabilitado ou não disponível. Tente novamente ou altere as configurações do seu navegador.')
      setError(true)
    }
  }, [])

  return (
    <UserContext.Provider value={{ error, setError, errorMessage, isAuthenticated, setUser, user }}>
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