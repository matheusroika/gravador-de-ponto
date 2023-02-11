import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import { format, setDefaultOptions } from 'date-fns'
import { ptBR } from 'date-fns/locale'

setDefaultOptions({ locale: ptBR })

import styles from './styles.module.scss'
import { UserContext, User } from '../../contexts/UserContext'

export default function MainApp() {
  const { user, setUser } = useContext(UserContext)

  const [editingIndex, setEditingIndex] = useState(-1)
  const [timeInInput, setTimeInInput] = useState([""])
  const [timeOutInput, setTimeOutInput] = useState([""])
  const [dateInput, setDateInput] = useState("")

  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const popup = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAdding) return

    function handleClick(event: MouseEvent) {
      if (popup.current && !popup.current.contains(event.target as Node)) {
        setIsAdding(false)
      }
    }

    window.addEventListener("click", handleClick)

    return () => window.removeEventListener("click", handleClick)
  }, [isAdding])

  function handleAdding() {}

  function handleDeleting() {}

  function handleEditing() {
    const newUser: User = JSON.parse(JSON.stringify(user))
    let change = false
    
    const formattedDate = dateInput.split('-').reverse().join('-')
    if (formattedDate && formattedDate !== user.clockIn[editingIndex].date) {
      newUser.clockIn[editingIndex].date = formattedDate
      change = true
    }

    user.clockIn[editingIndex].timeIn.forEach((time, index) => {
      if (timeInInput[index] && timeInInput[index] !== time) {
        newUser.clockIn[editingIndex].timeIn[index] = timeInInput[index]
        change = true
      }
    })

    user.clockIn[editingIndex].timeOut.forEach((time, index) => {
      if (timeOutInput[index] && timeOutInput[index] !== time) {
        newUser.clockIn[editingIndex].timeOut[index] = timeOutInput[index]
        change = true
      }
    })

    if (change) {
      setUser(newUser)
    }

    closeEditing()
  }

  function closeAdding() {
    setIsAdding(false)
  }

  function closeDeleting() {
    setIsDeleting(false)
  }

  function closeEditing() {
    setEditingIndex(-1)
    setDateInput("")
    setTimeInInput([""])
    setTimeOutInput([""])
  }

  const [date, setDate] = useState(new Date())

  function refreshDate() {
    setDate(new Date())
  }

  useEffect(() => {
    const timer = setInterval(refreshDate, 1000)
    return () => clearInterval(timer)
  }, [])

  function handleClockIn() {
    const currentDate = format(date, 'P').replaceAll('/', '-')

    const currentClockIn = user.clockIn.find((e) => e.date === currentDate)

    if (currentClockIn) {
      const updatedClockIn = {
        ...currentClockIn
      }

      if (currentClockIn.timeIn.length > currentClockIn.timeOut.length) {
        updatedClockIn.timeOut.unshift(format(date, 'pp'))
      } else {
        updatedClockIn.timeIn.unshift(format(date, 'pp'))
      }

      const indexOf = user.clockIn.indexOf(currentClockIn)

      const updatedUser = {
        ...user
      }

      updatedUser.clockIn[indexOf] = updatedClockIn

      setUser(updatedUser)
      
      } else {
      const updatedUser = {
        ...user,
        clockIn: [
          ...user.clockIn,
          {
            date: currentDate,
            timeIn: [format(date, 'pp')],
            timeOut: []
          }
        ]
      }

      setUser(updatedUser)
    }
  }

  function addClockIn() {
    setIsAdding(true)
  }

  function editClockIn(index: number) {
    setEditingIndex(index)
  }

  function handleTimeInInputChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    event.preventDefault()
    let newTimeInput = timeInInput
    newTimeInput[index] = event.target.value
    setTimeInInput(newTimeInput)
  }

  function handleTimeOutInputChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    event.preventDefault()
    let newTimeInput = timeOutInput
    newTimeInput[index] = event.target.value
    setTimeOutInput(newTimeInput)
  }

  function handleDateInputChange(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault()
    setDateInput(event.target.value)
  }

  function transformToSeconds(time: string) {
    const splitTime = time.split(':')
    const seconds = (+splitTime[0]) * 60 * 60 + (+splitTime[1]) * 60 + (+splitTime[2])
    return seconds
  }

  function transformToHours(seconds: number) {
    return new Date(seconds * 1000).toISOString().substring(11, 19)
  }

  return (
    <div className={styles.mainApp}>
      <div className={styles.date}>
        <p className={styles.weekDay}>{format(date, 'EEEE')}</p>

        <p className={styles.time}>{format(date, 'pp')}</p>

        <div className={styles.month}>
          <p>{format(date, "dd 'de'")}</p>
          <p>{format(date, 'LLLL')}</p>
        </div>
      </div>

      <div className={styles.table}>
        <div>
          <div className={styles.buttons}>
            <button onClick={handleClockIn}>Bater ponto</button>
            <button onClick={addClockIn}>Adicionar ponto</button>
          </div>

          <table cellSpacing={0}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Pontos de entrada</th>
                <th>Pontos de saída</th>
                <th>Total trabalhado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
            {user.clockIn.map((e, index) => {
              let timeWorked = 0
              const inputDate = e.date.split('-').reverse().join('-')

              if (e.timeIn.length > e.timeOut.length) {
                e.timeOut.forEach((time, i) => {
                  const timeDif = transformToSeconds(time) - transformToSeconds(e.timeIn[i])
                  timeWorked = timeWorked + timeDif
                })

                const timeDif = transformToSeconds(format(date, 'pp')) - transformToSeconds(e.timeIn[e.timeIn.length-1])
                timeWorked = timeWorked + timeDif
              } else {
                e.timeOut.forEach((time, i) => {
                  const timeDif = transformToSeconds(time) - transformToSeconds(e.timeIn[i])
                  timeWorked = timeWorked + timeDif
                })
              }

              return (
                <tr key={index}>
                  <td id="tableDate">{editingIndex === index ? (
                    <input type="date" name={`date${index}`} id={`date${index}`} value={dateInput ? dateInput : inputDate} onChange={handleDateInputChange} />
                  ) : (
                    <input type="date" name={`date${index}`} id={`date${index}`} value={inputDate} disabled/>
                  )}
                  </td>

                  <td>
                    <div>
                    {editingIndex === index ? (
                      e.timeIn.map((e, index) => {
                        return (
                          <input key={index} type="time" name={`timeIn${index}`} id={`timeIn${index}`} value={timeInInput[index] ? timeInInput[index] : e} onChange={(event) => {handleTimeInInputChange(event, index)}} />
                        )
                      })
                    ) : (
                      e.timeIn.map((e, index) => {
                        return (
                          <input type="time" name={`timeIn${index}`} id={`timeIn${index}`} value={e} disabled />
                        )
                      })   
                    )}
                    </div>
                  </td>

                  <td>
                    <div>
                    {editingIndex === index ? (
                      e.timeOut.map((e, index) => {
                        return (
                          <input key={index} type="time" name={`timeOut${index}`} id={`timeOut${index}`} value={timeOutInput[index] ? timeOutInput[index] : e} onChange={(event) => {handleTimeOutInputChange(event, index)}} />
                        )
                      })
                    ) : (
                      e.timeOut.map((e, index) => {
                        return (
                          <input key={index} type="time" name={`timeOut${index}`} id={`timeOut${index}`} value={e} disabled/>
                        )
                      })
                    )}
                    </div>
                  </td>

                  <td>{transformToHours(timeWorked)}</td>
                  <td>
                    {editingIndex === index ? (
                      <>
                      <button onClick={handleEditing}>Confirmar</button><br/>
                      <button onClick={closeEditing}>Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => {editClockIn(index)}}>Editar</button>
                    )}
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={popup} className={`${styles.popup} ${isAdding ? styles.active : ''}`}>
        <button onClick={handleAdding}>Adicionar</button>
        <button onClick={closeAdding}>Cancelar</button>
      </div>

      <div className={`${styles.popup} ${isDeleting ? styles.active : ''}`}>
        Essa é uma ação irreversível, tem certeza que deseja apagar esse dia? Todos os pontos serão perdidos.
        <div className={styles.buttons}>
          <button onClick={handleDeleting}>Sim, apagar</button>
          <button onClick={closeDeleting}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}