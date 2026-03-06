package realtime

import (
	"sort"
	"sync"
)

type SessionState struct {
	mu sync.RWMutex

	SessionName string `json:"session_name"`
	SessionType string `json:"session_type"`
	EventName   string `json:"event_name"`
	CountryName string `json:"country_name"`
	Active      bool   `json:"active"`

	drivers   map[int]*DriverState
	positions map[int]int
	intervals map[int]float64
	laps      map[int]*LapInfo
	stints    map[int]*StintInfo
	pits      map[int]bool
}

type DriverState struct {
	DriverNumber int    `json:"driver_number"`
	NameAcronym  string `json:"name_acronym"`
	TeamName     string `json:"team_name"`
}

type LapInfo struct {
	LapDuration float64 `json:"lap_duration"`
	LapNumber   int     `json:"lap_number"`
}

type StintInfo struct {
	Compound string `json:"compound"`
}

type SessionSnapshot struct {
	SessionName string           `json:"session_name"`
	SessionType string           `json:"session_type"`
	EventName   string           `json:"event_name"`
	CountryName string           `json:"country_name"`
	Active      bool             `json:"active"`
	Drivers     []DriverSnapshot `json:"drivers"`
}

type DriverSnapshot struct {
	Position      int    `json:"position"`
	Code          string `json:"code"`
	Team          string `json:"team"`
	Tire          string `json:"tire"`
	InPit         bool   `json:"in_pit"`
	LastLapMs     int    `json:"last_lap_ms"`
	GapToLeaderMs int    `json:"gap_to_leader_ms"`
}

func NewSessionState() *SessionState {
	return &SessionState{
		drivers:   make(map[int]*DriverState),
		positions: make(map[int]int),
		intervals: make(map[int]float64),
		laps:      make(map[int]*LapInfo),
		stints:    make(map[int]*StintInfo),
		pits:      make(map[int]bool),
	}
}

func (s *SessionState) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.SessionName = ""
	s.SessionType = ""
	s.EventName = ""
	s.CountryName = ""
	s.Active = false
	s.drivers = make(map[int]*DriverState)
	s.positions = make(map[int]int)
	s.intervals = make(map[int]float64)
	s.laps = make(map[int]*LapInfo)
	s.stints = make(map[int]*StintInfo)
	s.pits = make(map[int]bool)
}

func (s *SessionState) SetSession(name, sessionType, eventName, countryName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.SessionName = name
	s.SessionType = sessionType
	s.EventName = eventName
	s.CountryName = countryName
	s.Active = true
}

func (s *SessionState) SetDriver(driverNum int, acronym, teamName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.drivers[driverNum] = &DriverState{
		DriverNumber: driverNum,
		NameAcronym:  acronym,
		TeamName:     teamName,
	}
}

func (s *SessionState) SetPosition(driverNum, position int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.positions[driverNum] = position
}

func (s *SessionState) SetInterval(driverNum int, gapToLeader float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.intervals[driverNum] = gapToLeader
}

func (s *SessionState) SetLap(driverNum int, duration float64, lapNumber int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.laps[driverNum] = &LapInfo{
		LapDuration: duration,
		LapNumber:   lapNumber,
	}
}

func (s *SessionState) SetStint(driverNum int, compound string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stints[driverNum] = &StintInfo{Compound: compound}
}

func (s *SessionState) SetPit(driverNum int, inPit bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pits[driverNum] = inPit
}

func (s *SessionState) Snapshot() SessionSnapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()

	snap := SessionSnapshot{
		SessionName: s.SessionName,
		SessionType: s.SessionType,
		EventName:   s.EventName,
		CountryName: s.CountryName,
		Active:      s.Active,
		Drivers:     make([]DriverSnapshot, 0, len(s.drivers)),
	}

	for driverNum, d := range s.drivers {
		ds := DriverSnapshot{
			Code: d.NameAcronym,
			Team: d.TeamName,
			Tire: "Unknown",
		}

		if pos, ok := s.positions[driverNum]; ok {
			ds.Position = pos
		}

		if gap, ok := s.intervals[driverNum]; ok {
			ds.GapToLeaderMs = int(gap * 1000)
		}

		if lap, ok := s.laps[driverNum]; ok {
			ds.LastLapMs = int(lap.LapDuration * 1000)
		}

		if stint, ok := s.stints[driverNum]; ok && stint.Compound != "" {
			ds.Tire = normalizeTire(stint.Compound)
		}

		if inPit, ok := s.pits[driverNum]; ok {
			ds.InPit = inPit
		}

		snap.Drivers = append(snap.Drivers, ds)
	}

	sort.Slice(snap.Drivers, func(i, j int) bool {
		pi, pj := snap.Drivers[i].Position, snap.Drivers[j].Position
		if pi == 0 && pj == 0 {
			return snap.Drivers[i].Code < snap.Drivers[j].Code
		}
		if pi == 0 {
			return false
		}
		if pj == 0 {
			return true
		}
		return pi < pj
	})

	return snap
}

func normalizeTire(compound string) string {
	switch compound {
	case "SOFT":
		return "Soft"
	case "MEDIUM":
		return "Medium"
	case "HARD":
		return "Hard"
	case "INTERMEDIATE":
		return "Inter"
	case "WET":
		return "Wet"
	default:
		return compound
	}
}
