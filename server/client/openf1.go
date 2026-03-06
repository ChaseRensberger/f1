package client

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const baseURL = "https://api.openf1.org/v1"

type TokenSource interface {
	GetToken() string
}

type Client struct {
	http        *http.Client
	tokenSource TokenSource
}

func New() *Client {
	return &Client{
		http: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) SetTokenSource(ts TokenSource) {
	c.tokenSource = ts
}

func (c *Client) Fetch(endpoint string, query url.Values) ([]byte, int, error) {
	u := fmt.Sprintf("%s/%s", baseURL, endpoint)
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	var resp *http.Response
	var err error

	for attempt := range 3 {
		req, reqErr := http.NewRequest("GET", u, nil)
		if reqErr != nil {
			return nil, 0, fmt.Errorf("creating request: %w", reqErr)
		}

		if c.tokenSource != nil {
			if token := c.tokenSource.GetToken(); token != "" {
				req.Header.Set("Authorization", "Bearer "+token)
			}
		}

		resp, err = c.http.Do(req)
		if err != nil {
			return nil, 0, fmt.Errorf("request failed: %w", err)
		}
		if resp.StatusCode != http.StatusTooManyRequests {
			break
		}
		resp.Body.Close()
		if attempt < 2 {
			time.Sleep(time.Duration(400*(attempt+1)) * time.Millisecond)
		}
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("reading body: %w", err)
	}

	return body, resp.StatusCode, nil
}
