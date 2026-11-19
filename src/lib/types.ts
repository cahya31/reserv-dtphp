export type SessionUser = {
  id: string
  name: string
  accessCode: string
  role: string
}

export type Room = {
  id: string
  name: string
  location: string | null
  capacity: number
  facilities: string | null
  color: string
  active: boolean
  _count?: { reservations: number }
}

export type ReservationUser = {
  id: string
  name: string
  accessCode: string
}

export type ReservationRoom = {
  id: string
  name: string
  location: string | null
  capacity: number
  color: string
}

export type Reservation = {
  id: string
  title: string
  agenda: string | null
  roomId: string
  room: ReservationRoom
  userId: string
  user: ReservationUser
  date: string
  startTime: string
  endTime: string
  status: string
  actualStart: string | null
  actualEnd: string | null
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  id: string
  openHour: number
  closeHour: number
  autoApprove: boolean
  maxDaysAhead: number
}

export type Stats = {
  roomsActive: number
  usersActive: number
  todayCount: number
  ongoingCount: number
  pendingCount: number
}
