import { createContext, ReactNode, useState, Dispatch, SetStateAction } from "react";
import { GrFormClose } from "react-icons/gr";
import { IconType } from "react-icons/lib";
import Modal from "../components/Modal";

interface ModalContextData {
  isVisible: boolean,
  title: string,
  CloseIcon: IconType | false,
  description: string,
  buttons: Button[],
  openModal: ({ title, CloseIcon, description, buttons }: OpenModalProps) => void,
  closeModal: () => void
}

interface ModelProviderProps {
  children: ReactNode
}

export interface Button {
  text: string,
  onClick: () => void,
}

export interface OpenModalProps {
  title?: string,
  CloseIcon?: IconType,
  description?: string,
  buttons?: Button[]
}

export const ModalContext = createContext({} as ModalContextData)

export function ModalProvider({ children }: ModelProviderProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [CloseIcon, setCloseIcon] = useState<IconType | false>(GrFormClose)
  const [description, setDescription] = useState('')
  const [buttons, setButtons] = useState<Button[]>([])

  function closeModal() {
    setIsVisible(false)
    setTitle('')
    setCloseIcon(GrFormClose)
    setDescription('')
    setButtons([])
  }

  function openModal({ title, CloseIcon, description, buttons }: OpenModalProps) {
    title && setTitle(title)
    CloseIcon && setCloseIcon(CloseIcon)
    description && setDescription(description)
    buttons && setButtons(buttons)
    setIsVisible(true)
  }

  return (
    <ModalContext.Provider value={{ isVisible, title, CloseIcon, description, buttons, openModal, closeModal }}>
      <Modal />
      {children}
    </ModalContext.Provider>
  )
}