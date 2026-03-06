package realtime

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const apiBaseURL = "https://api.openf1.org/v1"

var topics = []string{
	"v1/sessions",
	"v1/drivers",
	"v1/position",
	"v1/intervals",
	"v1/laps",
	"v1/stints",
	"v1/pit",
	"v1/race_control",
}

type TokenSource interface {
	GetToken() string
}

type OnUpdate func(snapshot SessionSnapshot)

type Client struct {
	tokenSource TokenSource
	state       *SessionState
	onUpdate    OnUpdate
	httpClient  *http.Client

	mu     sync.Mutex
	client mqtt.Client
	stopCh chan struct{}
}

func NewClient(ts TokenSource, onUpdate OnUpdate) *Client {
	return &Client{
		tokenSource: ts,
		state:       NewSessionState(),
		onUpdate:    onUpdate,
		httpClient:  &http.Client{Timeout: 15 * time.Second},
		stopCh:      make(chan struct{}),
	}
}

func (c *Client) Start() {
	go c.connectLoop()
}

func (c *Client) Stop() {
	close(c.stopCh)
	c.mu.Lock()
	if c.client != nil && c.client.IsConnected() {
		c.client.Disconnect(1000)
	}
	c.mu.Unlock()
}

func (c *Client) GetSnapshot() SessionSnapshot {
	return c.state.Snapshot()
}

func (c *Client) connectLoop() {
	for {
		select {
		case <-c.stopCh:
			return
		default:
		}

		if err := c.connect(); err != nil {
			log.Printf("realtime: connection failed: %v (retrying in 10s)", err)
			select {
			case <-time.After(10 * time.Second):
			case <-c.stopCh:
				return
			}
			continue
		}

		select {
		case <-c.stopCh:
			return
		}
	}
}

func (c *Client) connect() error {
	token := c.tokenSource.GetToken()
	if token == "" {
		return ErrNoToken
	}

	opts := mqtt.NewClientOptions().
		AddBroker("wss://mqtt.openf1.org:8084/mqtt").
		SetUsername("openf1-client").
		SetPassword(token).
		SetAutoReconnect(true).
		SetMaxReconnectInterval(30 * time.Second).
		SetKeepAlive(60 * time.Second).
		SetCleanSession(true).
		SetConnectionLostHandler(func(_ mqtt.Client, err error) {
			log.Printf("realtime: connection lost: %v", err)
		}).
		SetReconnectingHandler(func(_ mqtt.Client, opts *mqtt.ClientOptions) {
			newToken := c.tokenSource.GetToken()
			opts.SetPassword(newToken)
			log.Println("realtime: reconnecting with fresh token")
		}).
		SetOnConnectHandler(func(client mqtt.Client) {
			log.Println("realtime: connected to MQTT broker")
			c.subscribe(client)
			go c.bootstrap()
		})

	client := mqtt.NewClient(opts)
	tok := client.Connect()
	if !tok.WaitTimeout(15 * time.Second) {
		return ErrConnectTimeout
	}
	if tok.Error() != nil {
		return tok.Error()
	}

	c.mu.Lock()
	c.client = client
	c.mu.Unlock()

	return nil
}

func (c *Client) subscribe(client mqtt.Client) {
	filters := make(map[string]byte, len(topics))
	for _, t := range topics {
		filters[t] = 0
	}

	tok := client.SubscribeMultiple(filters, c.handleMessage)
	if tok.WaitTimeout(10*time.Second) && tok.Error() != nil {
		log.Printf("realtime: subscribe error: %v", tok.Error())
		return
	}
	log.Printf("realtime: subscribed to %d topics", len(topics))
}

func (c *Client) handleMessage(_ mqtt.Client, msg mqtt.Message) {
	topic := msg.Topic()
	payload := msg.Payload()

	switch topic {
	case "v1/sessions":
		c.handleSession(payload)
	case "v1/drivers":
		c.handleDriver(payload)
	case "v1/position":
		c.handlePosition(payload)
	case "v1/intervals":
		c.handleInterval(payload)
	case "v1/laps":
		c.handleLap(payload)
	case "v1/stints":
		c.handleStint(payload)
	case "v1/pit":
		c.handlePit(payload)
	case "v1/race_control":
		c.handleRaceControl(payload)
	}

	if c.onUpdate != nil {
		c.onUpdate(c.state.Snapshot())
	}
}

type mqttSession struct {
	SessionKey   int    `json:"session_key"`
	SessionName  string `json:"session_name"`
	SessionType  string `json:"session_type"`
	CountryName  string `json:"country_name"`
	CircuitShort string `json:"circuit_short_name"`
	MeetingKey   int    `json:"meeting_key"`
}

type mqttDriver struct {
	DriverNumber int    `json:"driver_number"`
	NameAcronym  string `json:"name_acronym"`
	TeamName     string `json:"team_name"`
}

type mqttPosition struct {
	DriverNumber int `json:"driver_number"`
	Position     int `json:"position"`
}

type mqttInterval struct {
	DriverNumber int          `json:"driver_number"`
	GapToLeader  *json.Number `json:"gap_to_leader"`
}

type mqttLap struct {
	DriverNumber int      `json:"driver_number"`
	LapDuration  *float64 `json:"lap_duration"`
	LapNumber    int      `json:"lap_number"`
}

type mqttStint struct {
	DriverNumber int    `json:"driver_number"`
	Compound     string `json:"compound"`
}

type mqttPit struct {
	DriverNumber int `json:"driver_number"`
	LapNumber    int `json:"lap_number"`
}

type mqttRaceControl struct {
	Category string `json:"category"`
	Message  string `json:"message"`
}

func (c *Client) handleSession(data []byte) {
	var s mqttSession
	if err := json.Unmarshal(data, &s); err != nil {
		return
	}
	if s.SessionName != "" {
		c.state.SetSession(s.SessionName, s.SessionType, s.CircuitShort, s.CountryName)
	}
}

func (c *Client) handleDriver(data []byte) {
	var d mqttDriver
	if err := json.Unmarshal(data, &d); err != nil {
		return
	}
	if d.DriverNumber > 0 && d.NameAcronym != "" {
		c.state.SetDriver(d.DriverNumber, d.NameAcronym, d.TeamName)
	}
}

func (c *Client) handlePosition(data []byte) {
	var p mqttPosition
	if err := json.Unmarshal(data, &p); err != nil {
		return
	}
	if p.DriverNumber > 0 {
		c.state.SetPosition(p.DriverNumber, p.Position)
	}
}

func (c *Client) handleInterval(data []byte) {
	var iv mqttInterval
	if err := json.Unmarshal(data, &iv); err != nil {
		return
	}
	if iv.DriverNumber > 0 && iv.GapToLeader != nil {
		if gap, err := iv.GapToLeader.Float64(); err == nil {
			c.state.SetInterval(iv.DriverNumber, gap)
		}
	}
}

func (c *Client) handleLap(data []byte) {
	var l mqttLap
	if err := json.Unmarshal(data, &l); err != nil {
		return
	}
	if l.DriverNumber > 0 && l.LapDuration != nil {
		c.state.SetLap(l.DriverNumber, *l.LapDuration, l.LapNumber)

		c.state.SetPit(l.DriverNumber, false)
	}
}

func (c *Client) handleStint(data []byte) {
	var s mqttStint
	if err := json.Unmarshal(data, &s); err != nil {
		return
	}
	if s.DriverNumber > 0 && s.Compound != "" {
		c.state.SetStint(s.DriverNumber, s.Compound)
	}
}

func (c *Client) handlePit(data []byte) {
	var p mqttPit
	if err := json.Unmarshal(data, &p); err != nil {
		return
	}
	if p.DriverNumber > 0 {
		c.state.SetPit(p.DriverNumber, true)
	}
}

func (c *Client) handleRaceControl(data []byte) {
	var rc mqttRaceControl
	if err := json.Unmarshal(data, &rc); err != nil {
		return
	}
	if rc.Message != "" {
		log.Printf("realtime: race control: %s", rc.Message)
	}
}

func (c *Client) bootstrap() {
	token := c.tokenSource.GetToken()
	if token == "" {
		log.Println("realtime: bootstrap skipped, no token available")
		return
	}

	sessResp, err := c.apiGet("/sessions?session_key=latest", token)
	if err != nil {
		log.Printf("realtime: bootstrap sessions fetch failed: %v", err)
	} else {
		defer sessResp.Body.Close()
		var sessions []mqttSession
		body, _ := io.ReadAll(sessResp.Body)
		if err := json.Unmarshal(body, &sessions); err == nil && len(sessions) > 0 {
			s := sessions[0]
			c.state.SetSession(s.SessionName, s.SessionType, s.CircuitShort, s.CountryName)
			log.Printf("realtime: bootstrap session: %s @ %s (%s)", s.SessionName, s.CircuitShort, s.CountryName)
		} else if err != nil {
			log.Printf("realtime: bootstrap sessions decode failed: %v", err)
		}
	}

	drvResp, err := c.apiGet("/drivers?session_key=latest", token)
	if err != nil {
		log.Printf("realtime: bootstrap drivers fetch failed: %v", err)
	} else {
		defer drvResp.Body.Close()
		var drivers []mqttDriver
		body, _ := io.ReadAll(drvResp.Body)
		if err := json.Unmarshal(body, &drivers); err == nil {
			for _, d := range drivers {
				if d.DriverNumber > 0 && d.NameAcronym != "" {
					c.state.SetDriver(d.DriverNumber, d.NameAcronym, d.TeamName)
				}
			}
			log.Printf("realtime: bootstrap loaded %d drivers", len(drivers))
		} else {
			log.Printf("realtime: bootstrap drivers decode failed: %v", err)
		}
	}

	if c.onUpdate != nil {
		c.onUpdate(c.state.Snapshot())
	}
}

func (c *Client) apiGet(path, token string) (*http.Response, error) {
	req, err := http.NewRequest("GET", apiBaseURL+path, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("API returned %d for %s", resp.StatusCode, path)
	}
	return resp, nil
}

type sentinelError string

func (e sentinelError) Error() string { return string(e) }

const (
	ErrNoToken        = sentinelError("no access token available")
	ErrConnectTimeout = sentinelError("MQTT connect timed out")
)
