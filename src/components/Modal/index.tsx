import { useContext } from 'react'
import { ModalContext } from '../../contexts/ModalContext'

import styles from './styles.module.scss'

export default function Modal() {
  const { isVisible, title, CloseIcon, description, buttons, closeModal } = useContext(ModalContext)
  
  return (
    <>
    {isVisible && (
      <div className={styles.modalWrapper} onClick={closeModal}>
        <div className={styles.modal} onClick={event => event.stopPropagation()}>
          {title && (
            <h6 className={styles.title}>{title}</h6>
          )}

          {CloseIcon && (
            //@ts-ignore
            <button className={styles.closeIcon} onClick={closeModal}>{CloseIcon}</button>
          )}
          
          {description && (
            <p className={styles.description}>{description}</p>
          )}

          {buttons[0] && (
            <div className={styles.buttons}>
              {buttons.map((button, index) => (
                <button key={index} onClick={button.onClick}>{button.text}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}