import { ChangeEvent, MouseEvent, useContext, useEffect, useRef, useState } from 'react'
import { format, isWithinInterval, lastDayOfMonth, lastDayOfWeek, setDefaultOptions, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

setDefaultOptions({ locale: ptBR })

import styles from './styles.module.scss'
import { UserContext, User, ClockIn } from '../../contexts/UserContext'
import { GrFormAdd, GrFormClose, GrFormSubtract } from 'react-icons/gr'
import { ModalContext } from '../../contexts/ModalContext'

export default function MainApp() {
  const { user, setUser } = useContext(UserContext)
  const { openModal, closeModal } = useContext(ModalContext)

  const [isChecked, setIsChecked] = useState(
    new Array(user.clockIn.length).fill(false)
  )
  const [isAllChecked, setIsAllChecked] = useState(false)

  const [editingIndex, setEditingIndex] = useState(-1)
  const [timeInInput, setTimeInInput] = useState([""])
  const [timeOutInput, setTimeOutInput] = useState([""])
  const [dateInput, setDateInput] = useState("")

  const [isAdding, setIsAdding] = useState(false)
  const [numberOfTimeInputs, setNumberOfTimeInputs] = useState(1)
  const [addTimeInInput, setAddTimeInInput] = useState([""])
  const [addTimeOutInput, setAddTimeOutInput] = useState([""])
  const [timeAdded, setTimeAdded] = useState(0)
  const [addDate, setAddDate] = useState("")

  function handleCheckChange(index: number) {
    const updatedIsChecked = isChecked.map((check, i) => index === i ? !check : check)
    setIsChecked(updatedIsChecked)
  }

  function handleAllCheckChange() {
    setIsAllChecked(!isAllChecked)
    const updatedIsChecked = isChecked.map(check => !isAllChecked)
    setIsChecked(updatedIsChecked)
  }
  
  function handleAddTimeInInputChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    event.preventDefault()

    if (addTimeOutInput[index] && transformToSeconds(event.target.value) > transformToSeconds(addTimeOutInput[index])) return

    let newTimeInput = addTimeInInput
    newTimeInput[index] = event.target.value
    setAddTimeInInput(newTimeInput)
    updateAddTotal()
  }

  function handleAddTimeOutInputChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    event.preventDefault()

    if (addTimeInInput[index] && transformToSeconds(event.target.value) < transformToSeconds(addTimeInInput[index])) return

    let newTimeInput = addTimeOutInput
    newTimeInput[index] = event.target.value
    setAddTimeOutInput(newTimeInput)
    updateAddTotal()
  }
  
  function handleAddDate(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault()
    setAddDate(event.target.value)
  }

  const inInputList = []
  for (let i = 0; i < numberOfTimeInputs; i++) {
    inInputList.push(
      <input
        key={i}
        required
        type="time"
        step="1"
        name={`inInput${i}`}
        id={`inInput${i}`}
        value={addTimeInInput[i] ? addTimeInInput[i] : ""}
        onChange={(event) => {handleAddTimeInInputChange(event, i)}}
      />
    )
  }
  
  const outInputList = []
  for (let i = 0; i < numberOfTimeInputs; i++) {
    outInputList.push(
      <input
        key={i}
        required
        type="time"
        step="1"
        name={`outInput${i}`}
        id={`outInput${i}`}
        value={addTimeOutInput[i] ? addTimeOutInput[i] : ""}
        onChange={(event) => {handleAddTimeOutInputChange(event, i)}}
      />
    )
  }

  function updateAddTotal() {
    if (addTimeInInput.length > outInputList.length) {
      setTimeAdded(0)
    } else {
      setTimeAdded(0)
      addTimeOutInput.forEach((time, i) => {
        const timeDif = transformToSeconds(time) - transformToSeconds(addTimeInInput[i])
        setTimeAdded(currentTime => Number(currentTime + timeDif))
      })
    }
  }

  function handleAdding() {
    if (!addDate || !addTimeInInput[0] || !addTimeOutInput[0]) return

    const formattedDate = format(new Date(addDate.replaceAll('-', '/')), 'P').replaceAll('/', '-')
    const currentClockIn = user.clockIn.find((e) => e.date === formattedDate)

    if (currentClockIn) {
      openModal({
        description: 'Não foi possível adicionar esse ponto. Já existe um ponto com essa data.'
      })
      closeAdding()
      return
    }

    const newClockIn = {
      date: formattedDate,
      timeIn: addTimeInInput,
      timeOut: addTimeOutInput
    }

    const updatedUser = {
      ...user
    }
    updatedUser.clockIn.push(newClockIn)
    updatedUser.clockIn.sort((time1, time2) => {
      const date1 = getDate(time1.date).getTime()
      const date2 = getDate(time2.date).getTime()
      return date2 - date1
    })

    setUser(updatedUser)
    closeAdding()
  }

  function handleDeleting(index: number) {
    const updatedUser = {
      ...user
    }

    updatedUser.clockIn.splice(index, 1)
    setUser(updatedUser)
    closeModal()
  }

  function deleteClockIn(index: number) {
    const formattedDate = user.clockIn[index].date.replaceAll('-', '/')

    openModal({
      description: `Tem certeza que deseja apagar o ponto do dia ${formattedDate}?`,
      buttons: [
        {
          text: 'Confirmar',
          onClick: () => handleDeleting(index)
        },
        {
          text: 'Cancelar',
          onClick: closeModal
        }
      ]
    })
  }

  function handleMultipleDeleting() {
    const tempClockIn = user.clockIn
    const updatedClockIn = tempClockIn.filter((_, index) => !isChecked[index])

    const updatedUser = {
      ...user,
      clockIn: updatedClockIn
    }
    setUser(updatedUser)
    setIsChecked(new Array(user.clockIn.length).fill(false))
    closeModal()
  }

  function deleteMultiple() {
    const tempClockIn = user.clockIn
    const dates = tempClockIn.filter((_, index) => isChecked[index]).map(clockIn => clockIn.date.replaceAll('-', '/'))
    const formattedDates = dates.join(', ')
    const description = dates.length > 1 ? `Tem certeza que deseja apagar o ponto dos dias: ${formattedDates}?` : `Tem certeza que deseja apagar o ponto do dia ${formattedDates}?`

    openModal({
      description,
      buttons: [
        {
          text: 'Confirmar',
          onClick: () => handleMultipleDeleting()
        },
        {
          text: 'Cancelar',
          onClick: closeModal
        }
      ]
    })
  }

  function handleEditing() {
    const newUser: User = JSON.parse(JSON.stringify(user))
    let change = false
    
    const formattedDate = getDateString(dateInput)
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
    setNumberOfTimeInputs(1)
    setAddTimeInInput([""])
    setAddTimeOutInput([""])
    setAddDate("")
    setTimeAdded(0)
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
    setTimeAdded(0)
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
          {
            date: currentDate,
            timeIn: [format(date, 'pp')],
            timeOut: []
          },
          ...user.clockIn
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
    function format(n: number) {
      return (~~n).toString().padStart(2, '0')
    }

    return [
      format(seconds / 60 / 60),
      format(seconds / 60 % 60),
      format(seconds % 60)
    ].join(':');
  }

  function getDate(date: string) {
    return new Date(date.split('-').reverse().join('/'))
  }

  function getDateString(date: string, separator = '-') {
    return date.split('-').reverse().join(separator)
  }

  function getTimeWorkedDaily(clockIn: ClockIn) {
    let timeWorked = 0

    if (clockIn.timeIn.length > clockIn.timeOut.length) {
      clockIn.timeOut.forEach((time, i) => {
        const timeDif = transformToSeconds(time) - transformToSeconds(clockIn.timeIn[i])
        timeWorked = timeWorked + timeDif
      })

      const timeDif = transformToSeconds(format(date, 'pp')) - transformToSeconds(clockIn.timeIn[clockIn.timeIn.length-1])
      timeWorked = timeWorked + timeDif
    } else {
      clockIn.timeOut.forEach((time, i) => {
        const timeDif = transformToSeconds(time) - transformToSeconds(clockIn.timeIn[i])
        timeWorked = timeWorked + timeDif
      })
    }

    return timeWorked
  }

  function getTimeWorkedWeekly() {
    if (!user.clockIn[0]) return '00:00:00'

    const recentDate = getDate(user.clockIn[0].date)
    const startOfWeekDate = startOfWeek(recentDate)
    const endOfWeekDate =  lastDayOfWeek(recentDate)

    const datesInWeek = user.clockIn.filter(e => {
      const formattedDate = getDate(e.date)
      const isInWeek = isWithinInterval(formattedDate, {
        start: startOfWeekDate,
        end: endOfWeekDate
      })
      return isInWeek
    })

    let timeWorked = 0
    if (datesInWeek[0]) {
      const hoursInWeek = datesInWeek.map(date => getTimeWorkedDaily(date))
      timeWorked = hoursInWeek.reduce((acc, curr) => acc + curr)
    }
    return transformToHours(timeWorked)
  }

  function getTimeWorkedMonthly() {
    if (!user.clockIn[0]) return '00:00:00'

    const recentDate = getDate(user.clockIn[0].date)
    const startOfMonthDate = startOfMonth(recentDate)
    const endOfMonthDate =  lastDayOfMonth(recentDate)

    const datesInMonth = user.clockIn.filter(e => {
      const formattedDate = getDate(e.date)
      const isInMonth = isWithinInterval(formattedDate, {
        start: startOfMonthDate,
        end: endOfMonthDate
      })
      return isInMonth
    })

    let timeWorked = 0
    if (datesInMonth[0]) {
      const hoursInMonth = datesInMonth.map(date => getTimeWorkedDaily(date))
      timeWorked = hoursInMonth.reduce((acc, curr) => acc + curr)
    }
    return transformToHours(timeWorked)
  }

  function getTimeWorkedToday() {
    const currentDate = format(date, 'P').replaceAll('/', '-')
    const currentClockIn = user.clockIn.find((e) => e.date === currentDate)
    
    return currentClockIn ? transformToHours(getTimeWorkedDaily(currentClockIn)) : '00:00:00'
  }

  function getRemainingWorkTime() {
    const workHoursInSeconds = transformToSeconds(`${user.workHours}:00:00`)
    const weeklyHoursWorkedInSeconds = transformToSeconds(getTimeWorkedWeekly())
    const remainingWorkTime = transformToHours(workHoursInSeconds - weeklyHoursWorkedInSeconds)
    return remainingWorkTime
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
          
          <div className={styles.buttonsAndInfo}>
            <div className={styles.buttons}>
              <button onClick={handleClockIn}>Bater ponto</button>
              <button onClick={addClockIn}>Adicionar ponto</button>
              <button onClick={deleteMultiple} disabled={!isChecked.some(check => check)}>Deletar ponto(s)</button>
            </div>
            
            <div className={styles.info}>
              <div>
                <h3>Semanal</h3>

                <h4>Trabalhado</h4>
                <p>{getTimeWorkedWeekly()}</p>

                <h4>Restante</h4>
                <p>{getRemainingWorkTime()}</p>
              </div>

              <div>
                <h3>Diário</h3>

                <h4>Trabalhado</h4>
                <p>{getTimeWorkedToday()}</p>
              </div>

              <div>
                <h3>Mensal</h3>

                <h4>Trabalhado</h4>
                <p>{getTimeWorkedMonthly()}</p>
              </div>
            </div>
          </div>

          <table cellSpacing={0}>
            <thead>
              <tr>
                <th><input type="checkbox" name="checkAll" id="checkAll" checked={isAllChecked} onChange={handleAllCheckChange} /></th>
                <th>Data</th>
                <th>Pontos de entrada</th>
                <th>Pontos de saída</th>
                <th>Total trabalhado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
            {user.clockIn.map((e, index) => {
              const inputDate = getDateString(e.date)
              const timeWorked = getTimeWorkedDaily(e)

              return (
                <tr key={index}>
                  <td><input type="checkbox" name={`check${index}`} id={`check${index}`} checked={isChecked[index]} onChange={() => handleCheckChange(index)} /></td>
                  <td>{editingIndex === index ? (
                    <input type="date" name={`date${index}`} id={`date${index}`} value={dateInput ? dateInput : inputDate} onChange={handleDateInputChange} />
                  ) : (
                    <>
                    <input aria-hidden type="date" name={`date${index}`} id={`date${index}`} value={inputDate} disabled/>
                    <time dateTime={inputDate}></time>
                    </>
                  )}
                  </td>

                  <td>
                    <div className={styles.tableTimes}>
                    {editingIndex === index ? (
                      e.timeIn.map((e, index) => {
                        return (
                          <input key={index} type="time" name={`timeIn${index}`} id={`timeIn${index}`} value={timeInInput[index] ? timeInInput[index] : e} onChange={(event) => {handleTimeInInputChange(event, index)}} />
                        )
                      })
                    ) : (
                      e.timeIn.map((e, index) => {
                        return (
                          <div key={index}>
                            <input aria-hidden type="time" name={`timeIn${index}`} id={`timeIn${index}`} value={e} disabled />
                            <time dateTime={e}></time>
                          </div>
                        )
                      })   
                    )}
                    </div>
                  </td>

                  <td>
                    <div className={styles.tableTimes}>
                    {editingIndex === index ? (
                      e.timeOut.map((e, index) => {
                        return (
                          <input key={index} type="time" name={`timeOut${index}`} id={`timeOut${index}`} value={timeOutInput[index] ? timeOutInput[index] : e} onChange={(event) => {handleTimeOutInputChange(event, index)}} />
                        )
                      })
                    ) : (
                      e.timeOut.map((e, index) => {
                        return (
                          <div key={index}>
                            <input aria-hidden type="time" name={`timeOut${index}`} id={`timeOut${index}`} value={e} disabled/>
                            <time dateTime={e}></time>
                          </div>
                        )
                      })
                    )}
                    </div>
                  </td>

                  <td>{transformToHours(timeWorked)}</td>
                  <td>
                    <div className={styles.editButtons}>
                    {editingIndex === index ? (
                      <>
                      <button onClick={handleEditing}>Confirmar</button>
                      <button onClick={closeEditing}>Cancelar</button>
                      </>
                    ) : (
                      <>
                      <button onClick={() => {editClockIn(index)}}>Editar</button>
                      <button onClick={() => {deleteClockIn(index)}}>Apagar</button>
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>

        {isAdding && (
          <div className={styles.addModalWrapper} onClick={closeAdding}>
            <div className={styles.addModal} onClick={event => event.stopPropagation()}>
              <button className={styles.closeButton} onClick={closeAdding}><GrFormClose /></button>
              <p className={styles.addDescription}>Preencha as informações abaixo para adicionar um ponto</p>
              <div className={styles.addInputs}>
                <div>
                  <p><label htmlFor='addDate'>Data</label></p>
                  <input required type="date" name="addDate" id="addDate" onChange={handleAddDate} value={addDate} />
                </div>
                <div className={styles.inInputs}>
                  <p>Pontos de entrada</p>
                  <div>
                    {inInputList}
                    {numberOfTimeInputs > 1 && (
                      <button onClick={() => setNumberOfTimeInputs(numberOfTimeInputs - 1)}><GrFormSubtract /></button>
                    )}
                  </div>
                </div>
                <div className={styles.outInputs}>
                  <p>Postos de saída</p>
                  <div>
                    {outInputList}
                    <button onClick={() => setNumberOfTimeInputs(numberOfTimeInputs + 1)}><GrFormAdd /></button>
                  </div>
                </div>
                <div className={styles.total}>
                  <p>Total</p>
                  <div>{timeAdded > 0 ? transformToHours(timeAdded) : "00:00:00"}</div>
                </div>
              </div>

              <div className={styles.addButtons}>
                <button onClick={handleAdding}>Confirmar</button>
                <button onClick={closeAdding}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}