package auth

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const tokenURL = "https://api.openf1.org/token"

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type TokenManager struct {
	username string
	password string
	http     *http.Client

	mu        sync.RWMutex
	token     string
	expiresAt time.Time

	stopCh chan struct{}
}

func NewTokenManager(username, password string) (*TokenManager, error) {
	tm := &TokenManager{
		username: username,
		password: password,
		http:     &http.Client{Timeout: 15 * time.Second},
		stopCh:   make(chan struct{}),
	}

	if err := tm.refresh(); err != nil {
		return nil, fmt.Errorf("initial token fetch: %w", err)
	}

	go tm.refreshLoop()

	return tm, nil
}

func (tm *TokenManager) GetToken() string {
	tm.mu.RLock()
	defer tm.mu.RUnlock()
	return tm.token
}

func (tm *TokenManager) Stop() {
	close(tm.stopCh)
}

func (tm *TokenManager) refresh() error {
	form := url.Values{}
	form.Set("username", tm.username)
	form.Set("password", tm.password)

	resp, err := tm.http.Post(tokenURL, "application/x-www-form-urlencoded", strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("token request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("token request returned %d", resp.StatusCode)
	}

	var tok tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tok); err != nil {
		return fmt.Errorf("decoding token response: %w", err)
	}

	var expSec int
	if _, err := fmt.Sscanf(tok.ExpiresIn, "%d", &expSec); err != nil {
		expSec = 3600
	}

	tm.mu.Lock()
	tm.token = tok.AccessToken
	tm.expiresAt = time.Now().Add(time.Duration(expSec) * time.Second)
	tm.mu.Unlock()

	log.Printf("auth: token refreshed, expires in %d seconds", expSec)
	return nil
}

func (tm *TokenManager) refreshLoop() {
	for {
		tm.mu.RLock()
		until := time.Until(tm.expiresAt)
		tm.mu.RUnlock()

		wait := until - 5*time.Minute
		if wait < 1*time.Minute {
			wait = 1 * time.Minute
		}
		if wait > 50*time.Minute {
			wait = 50 * time.Minute
		}

		select {
		case <-time.After(wait):
			if err := tm.refresh(); err != nil {
				log.Printf("auth: token refresh failed: %v (will retry in 30s)", err)
				select {
				case <-time.After(30 * time.Second):
				case <-tm.stopCh:
					return
				}
			}
		case <-tm.stopCh:
			return
		}
	}
}
